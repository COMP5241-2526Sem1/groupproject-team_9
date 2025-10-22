import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Activity from '@/models/Activity'
import Course from '@/models/Course'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const activity = await Activity.findById(params.id)
      .populate('courseId', 'title code instructorId studentIds')
      .populate('courseId.instructorId', 'name email')

    if (!activity) {
      return NextResponse.json(
        { message: 'Activity not found' },
        { status: 404 }
      )
    }

    // 检查权限：教师可以访问所有活动，学生只能访问已注册课程的活动
    if (session.user.role === 'student') {
      const course = await Course.findById(activity.courseId._id)
      if (!course || !course.studentIds.includes(session.user.id)) {
        return NextResponse.json(
          { message: 'Access denied. You are not enrolled in this course.' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(activity)
  } catch (error: any) {
    console.error('Activity fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const updates = await request.json()

    await connectDB()

    const activity = await Activity.findByIdAndUpdate(
      params.id,
      updates,
      { new: true }
    )

    if (!activity) {
      return NextResponse.json(
        { message: 'Activity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(activity)
  } catch (error: any) {
    console.error('Activity update error:', error)
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
    
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const activity = await Activity.findByIdAndDelete(params.id)

    if (!activity) {
      return NextResponse.json(
        { message: 'Activity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Activity deleted successfully' })
  } catch (error: any) {
    console.error('Activity deletion error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
