import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ActivityResponse from '@/models/ActivityResponse'
import Activity from '@/models/Activity'
import User from '@/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // 验证活动是否存在
    const activity = await Activity.findById(params.id)
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // 获取所有响应
    const responses = await ActivityResponse.find({ activityId: params.id })
      .populate('studentId', 'name email')
      .sort({ submittedAt: -1 })

    // 如果活动设置为匿名，则隐藏学生信息
    const anonymizedResponses = activity.settings.isAnonymous
      ? responses.map(response => ({
          ...response.toObject(),
          studentId: 'Anonymous'
        }))
      : responses

    return NextResponse.json(anonymizedResponses)
  } catch (error) {
    console.error('Error fetching activity responses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { responseData, score, feedback } = await request.json()

    // 验证活动是否存在
    const activity = await Activity.findById(params.id)
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // 检查是否已经提交过响应
    const existingResponse = await ActivityResponse.findOne({
      activityId: params.id,
      studentId: session.user.id
    })

    if (existingResponse && !activity.settings.allowMultipleAttempts) {
      return NextResponse.json(
        { error: 'Response already submitted' },
        { status: 400 }
      )
    }

    // 创建或更新响应
    const response = existingResponse
      ? await ActivityResponse.findByIdAndUpdate(
          existingResponse._id,
          {
            responseData,
            score,
            feedback,
            submittedAt: new Date()
          },
          { new: true }
        )
      : await ActivityResponse.create({
          activityId: params.id,
          studentId: session.user.id,
          responseData,
          score,
          feedback
        })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error submitting response:', error)
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    )
  }
}
