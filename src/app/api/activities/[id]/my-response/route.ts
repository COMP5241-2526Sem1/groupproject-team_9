import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ActivityResponse from '@/models/ActivityResponse'
import Activity from '@/models/Activity'

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

    // 获取当前学生的响应
    const studentResponse = await ActivityResponse.findOne({
      activityId: params.id,
      studentId: session.user.id
    })

    if (!studentResponse) {
      return NextResponse.json({ response: null })
    }

    return NextResponse.json({ response: studentResponse })
  } catch (error) {
    console.error('Error fetching student response:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student response' },
      { status: 500 }
    )
  }
}
