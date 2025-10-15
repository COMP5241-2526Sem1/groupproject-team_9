import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Activity from '@/models/Activity'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { title, description, type, courseId, timeLimit, isAnonymous, showResults, content } = await request.json()

    // Validate required fields
    if (!title || !type || !courseId) {
      return NextResponse.json(
        { 
          message: 'Missing required fields',
          details: {
            title: !title ? 'Title is required' : null,
            type: !type ? 'Type is required' : null,
            courseId: !courseId ? 'Course ID is required' : null
          }
        },
        { status: 400 }
      )
    }

    await connectDB()

    const activity = new Activity({
      title,
      description,
      type,
      courseId,
      content: content || {},
      settings: {
        isAnonymous: isAnonymous || false,
        showResults: showResults !== false,
        allowMultipleAttempts: false,
        shuffleQuestions: false,
        timeLimit: timeLimit || undefined
      }
    })

    await activity.save()

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Activity creation error:', error)
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
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
          details: 'An activity with this title already exists'
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

    let activities
    if (session.user.role === 'teacher') {
      activities = await Activity.find({})
        .populate('courseId', 'title code')
    } else {
      // For students, get activities from their enrolled courses
      activities = await Activity.find({})
        .populate('courseId', 'title code')
    }

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Activities fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
