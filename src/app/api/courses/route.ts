import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Course from '@/models/Course'
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
  } catch (error) {
    console.error('Course creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
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
        .populate('instructorId', 'name email')
    } else {
      // For students, show all available courses
      courses = await Course.find()
        .populate('instructorId', 'name email')
    }

    // Add activity count for each course
    const coursesWithActivityCount = await Promise.all(
      courses.map(async (course) => {
        const activityCount = await Activity.countDocuments({ courseId: course._id })
        return {
          ...course.toObject(),
          studentCount: course.studentIds ? course.studentIds.length : 0,
          activityCount
        }
      })
    )

    return NextResponse.json(coursesWithActivityCount)
  } catch (error) {
    console.error('Courses fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
