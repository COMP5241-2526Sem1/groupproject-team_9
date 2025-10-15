import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'
import User from '@/models/User'

// Add student to course
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

    const { name, email, studentId, institution } = await request.json()

    // Validate required fields
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { message: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        ...(studentId ? [{ studentId: studentId.trim() }] : [])
      ]
    })

    if (user) {
      // User exists, check if already in course
      if (user.role !== 'student') {
        return NextResponse.json(
          { message: 'User is not a student' },
          { status: 400 }
        )
      }

      if (course.studentIds.includes(user._id)) {
        return NextResponse.json(
          { message: 'Student already enrolled in this course' },
          { status: 400 }
        )
      }

      // Add student to course
      await Course.findByIdAndUpdate(
        params.id,
        { $addToSet: { studentIds: user._id } }
      )

      return NextResponse.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        institution: user.institution
      })
    } else {
      // Create new student user
      user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: 'student',
        institution: institution?.trim() || 'PolyU',
        studentId: studentId?.trim() || undefined
      })

      await user.save()

      // Add student to course
      await Course.findByIdAndUpdate(
        params.id,
        { $addToSet: { studentIds: user._id } }
      )

      return NextResponse.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        institution: user.institution
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Add student error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
