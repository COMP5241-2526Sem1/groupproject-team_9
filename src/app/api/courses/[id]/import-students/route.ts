import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'
import User from '@/models/User'
import * as XLSX from 'xlsx'
import csv from 'csv-parser'
import { Readable } from 'stream'

interface StudentData {
  name: string
  email: string
  studentId?: string
  institution?: string
}

interface ImportResult {
  success: number
  failed: number
  errors: string[]
  students: StudentData[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Check if course exists and user is the instructor
    const course = await Course.findById(params.id)
    
    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      )
    }

    if (course.instructorId.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload CSV or Excel files only.' },
        { status: 400 }
      )
    }

    // Parse file based on type
    let students: StudentData[] = []
    const errors: string[] = []

    try {
      if (file.type === 'text/csv') {
        students = await parseCSV(file)
      } else {
        students = await parseExcel(file)
      }
    } catch (error) {
      console.error('File parsing error:', error)
      return NextResponse.json(
        { message: 'Failed to parse file. Please check the file format.' },
        { status: 400 }
      )
    }

    // Validate and process students
    const result = await processStudents(students, course._id.toString())
    
    return NextResponse.json({
      message: 'Import completed',
      result
    })

  } catch (error) {
    console.error('Student import error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function parseCSV(file: File): Promise<StudentData[]> {
  return new Promise((resolve, reject) => {
    const students: StudentData[] = []
    const stream = Readable.fromWeb(file.stream() as any)
    
    stream
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns to student data
        const student: StudentData = {
          name: row.name || row.Name || row.姓名 || '',
          email: row.email || row.Email || row.邮箱 || '',
          studentId: row.studentId || row['Student ID'] || row.学号 || '',
          institution: row.institution || row.Institution || row.学校 || 'PolyU'
        }
        
        if (student.name && student.email) {
          students.push(student)
        }
      })
      .on('end', () => {
        resolve(students)
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

async function parseExcel(file: File): Promise<StudentData[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(worksheet)
  
  const students: StudentData[] = jsonData.map((row: any) => ({
    name: row.name || row.Name || row.姓名 || '',
    email: row.email || row.Email || row.邮箱 || '',
    studentId: row.studentId || row['Student ID'] || row.学号 || '',
    institution: row.institution || row.Institution || row.学校 || 'PolyU'
  })).filter((student: StudentData) => student.name && student.email)
  
  return students
}

async function processStudents(students: StudentData[], courseId: string): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: [],
    students: []
  }

  for (const studentData of students) {
    try {
      // Validate required fields
      if (!studentData.name.trim()) {
        result.errors.push(`Row ${result.success + result.failed + 1}: Name is required`)
        result.failed++
        continue
      }

      if (!studentData.email.trim()) {
        result.errors.push(`Row ${result.success + result.failed + 1}: Email is required`)
        result.failed++
        continue
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(studentData.email)) {
        result.errors.push(`Row ${result.success + result.failed + 1}: Invalid email format`)
        result.failed++
        continue
      }

      // Check if user already exists
      let user = await User.findOne({ 
        $or: [
          { email: studentData.email.toLowerCase() },
          ...(studentData.studentId ? [{ studentId: studentData.studentId }] : [])
        ]
      })

      if (user) {
        // User exists, check if already in course
        if (user.role !== 'student') {
          result.errors.push(`Row ${result.success + result.failed + 1}: User ${studentData.email} is not a student`)
          result.failed++
          continue
        }

        const course = await Course.findById(courseId)
        if (course && course.studentIds.includes(user._id)) {
          result.errors.push(`Row ${result.success + result.failed + 1}: Student ${studentData.email} already enrolled in this course`)
          result.failed++
          continue
        }

        // Add student to course
        await Course.findByIdAndUpdate(
          courseId,
          { $addToSet: { studentIds: user._id } }
        )
      } else {
        // Create new student user
        user = new User({
          name: studentData.name.trim(),
          email: studentData.email.toLowerCase().trim(),
          role: 'student',
          institution: studentData.institution || 'PolyU',
          studentId: studentData.studentId?.trim() || undefined
        })

        await user.save()

        // Add student to course
        await Course.findByIdAndUpdate(
          courseId,
          { $addToSet: { studentIds: user._id } }
        )
      }

      result.students.push({
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        institution: user.institution
      })
      result.success++

    } catch (error) {
      console.error('Error processing student:', error)
      result.errors.push(`Row ${result.success + result.failed + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      result.failed++
    }
  }

  return result
}
