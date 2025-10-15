import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Activity from '@/models/Activity'
import ActivityResponse from '@/models/ActivityResponse'
import Course from '@/models/Course'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'student') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Get student's enrolled courses
    const courses = await Course.find({ 
      studentIds: session.user.id 
    }).populate('instructorId', 'name email')

    const courseIds = courses.map(course => course._id)

    // Get all activities for student's courses
    const activities = await Activity.find({ 
      courseId: { $in: courseIds }
    }).populate('courseId', 'title code')

    // Get student's responses to activities
    const studentResponses = await ActivityResponse.find({
      studentId: session.user.id,
      activityId: { $in: activities.map(a => a._id) }
    })

    // Create a map of activity responses for quick lookup
    const responseMap = new Map()
    studentResponses.forEach(response => {
      responseMap.set(response.activityId.toString(), response)
    })

    // Calculate student statistics
    const totalActivities = activities.length
    const completedActivities = studentResponses.length
    const averageScore = studentResponses.length > 0 
      ? studentResponses.reduce((sum, response) => sum + (response.score || 0), 0) / studentResponses.length 
      : 0

    // Calculate current streak (consecutive days with completed activities)
    const sortedResponses = studentResponses
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    
    let currentStreak = 0
    if (sortedResponses.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let currentDate = new Date(today)
      let foundActivityToday = false
      
      // Check if there's an activity today
      for (const response of sortedResponses) {
        const responseDate = new Date(response.submittedAt)
        responseDate.setHours(0, 0, 0, 0)
        
        if (responseDate.getTime() === currentDate.getTime()) {
          foundActivityToday = true
          currentStreak = 1
          break
        }
      }
      
      if (foundActivityToday) {
        // Count consecutive days backwards
        currentDate.setDate(currentDate.getDate() - 1)
        for (let i = 1; i < sortedResponses.length; i++) {
          const responseDate = new Date(sortedResponses[i].submittedAt)
          responseDate.setHours(0, 0, 0, 0)
          
          if (responseDate.getTime() === currentDate.getTime()) {
            currentStreak++
            currentDate.setDate(currentDate.getDate() - 1)
          } else {
            break
          }
        }
      }
    }

    // Calculate student rank (simplified - based on average score)
    const allStudents = await User.find({ role: 'student' })
    const studentScores = await Promise.all(
      allStudents.map(async (student) => {
        const studentResponses = await ActivityResponse.find({
          studentId: student._id
        })
        const avgScore = studentResponses.length > 0 
          ? studentResponses.reduce((sum, r) => sum + (r.score || 0), 0) / studentResponses.length 
          : 0
        return { studentId: student._id, averageScore: avgScore }
      })
    )
    
    studentScores.sort((a, b) => b.averageScore - a.averageScore)
    const studentRank = studentScores.findIndex(s => s.studentId.toString() === session.user.id) + 1

    // Prepare courses with activities and student progress
    const coursesWithActivities = courses.map(course => {
      const courseActivities = activities.filter(a => a.courseId._id.toString() === course._id.toString())
      
      const activitiesWithStatus = courseActivities.map(activity => {
        const response = responseMap.get(activity._id.toString())
        let status = 'pending'
        let score = undefined
        
        if (response) {
          status = 'completed'
          score = response.score
        } else if (activity.settings.dueDate && new Date(activity.settings.dueDate) < new Date()) {
          status = 'overdue'
        }
        
        return {
          _id: activity._id.toString(),
          title: activity.title,
          type: activity.type,
          status,
          score,
          dueDate: activity.settings.dueDate ? new Date(activity.settings.dueDate).toISOString() : undefined
        }
      })
      
      return {
        _id: course._id.toString(),
        title: course.title,
        code: course.code,
        activities: activitiesWithStatus
      }
    })

    // Get recent activities (last 10 completed activities)
    const recentActivities = studentResponses
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10)
      .map(response => {
        const activity = activities.find(a => a._id.toString() === response.activityId.toString())
        return {
          _id: response._id.toString(),
          title: activity?.title || 'Unknown Activity',
          type: activity?.type || 'unknown',
          status: 'completed',
          score: response.score,
          dueDate: activity?.settings.dueDate ? new Date(activity.settings.dueDate).toISOString() : undefined
        }
      })

    const dashboardData = {
      stats: {
        totalActivities,
        completedActivities,
        averageScore: Math.round(averageScore),
        currentStreak,
        rank: studentRank
      },
      courses: coursesWithActivities,
      recentActivities
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Student dashboard fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
