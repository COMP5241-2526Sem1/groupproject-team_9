import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'student') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const course = await Course.findById(params.id)
    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if student is already enrolled
    const isEnrolled = course.studentIds.some(
      (studentId: any) => studentId.toString() === session.user.id
    )

    if (isEnrolled) {
      return NextResponse.json(
        { message: 'Already enrolled in this course' },
        { status: 400 }
      )
    }

    // Add student to course
    course.studentIds.push(session.user.id)
    await course.save()

    return NextResponse.json(
      { message: 'Successfully enrolled in course' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Course enrollment error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'student') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const course = await Course.findById(params.id)
    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      )
    }

    // Remove student from course
    course.studentIds = course.studentIds.filter(
      (studentId: any) => studentId.toString() !== session.user.id
    )
    await course.save()

    return NextResponse.json(
      { message: 'Successfully unenrolled from course' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Course unenrollment error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
