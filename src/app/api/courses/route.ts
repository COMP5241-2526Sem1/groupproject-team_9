import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { title, description, code } = await request.json()

    if (!title || !description || !code) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    await connectDB()

    const course = new Course({
      title,
      description,
      code,
      instructorId: session.user.id
    })

    await course.save()

    return NextResponse.json(course, { status: 201 })
  } catch (error: any) {
    console.error('Course creation error:', error)
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError' && error.errors) {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }))
      
      return NextResponse.json(
        { 
          message: 'Validation error',
          details: validationErrors
        },
        { status: 400 }
      )
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          message: 'Duplicate entry',
          details: 'A course with this code already exists'
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    let courses
    if (session.user.role === 'teacher') {
      courses = await Course.find({ instructorId: session.user.id })
        .populate('studentIds', 'name email studentId')
    } else {
      courses = await Course.find({ studentIds: session.user.id })
        .populate('instructorId', 'name email')
    }

    return NextResponse.json(courses)
  } catch (error: any) {
    console.error('Courses fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
