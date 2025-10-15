'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Trophy, Target, Clock, Award, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Activity {
  _id: string
  title: string
  type: string
  status: string
  score?: number
  dueDate?: string
}

interface Course {
  _id: string
  title: string
  code: string
  activities: Activity[]
}

export default function StudentDashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState({
    totalActivities: 0,
    completedActivities: 0,
    averageScore: 0,
    currentStreak: 0,
    rank: 0
  })

  // Mock data for demonstration
  const mockCourses = [
    {
      _id: '1',
      title: 'Software Engineering',
      code: 'COMP 5241',
      activities: [
        { _id: '1', title: 'Week 1 Quiz', type: 'quiz', status: 'completed', score: 95, dueDate: '2024-01-15' },
        { _id: '2', title: 'Requirements Poll', type: 'poll', status: 'completed', score: 88, dueDate: '2024-01-16' },
        { _id: '3', title: 'Design Patterns Quiz', type: 'quiz', status: 'pending', dueDate: '2024-01-20' }
      ]
    },
    {
      _id: '2',
      title: 'Database Systems',
      code: 'COMP 5242',
      activities: [
        { _id: '4', title: 'SQL Basics Quiz', type: 'quiz', status: 'completed', score: 92, dueDate: '2024-01-14' },
        { _id: '5', title: 'Normalization Exercise', type: 'shortanswer', status: 'pending', dueDate: '2024-01-18' }
      ]
    }
  ]

  const mockRecentActivities = [
    { _id: '1', title: 'Week 1 Quiz', type: 'quiz', status: 'completed', score: 95, dueDate: '2024-01-15' },
    { _id: '2', title: 'Requirements Poll', type: 'poll', status: 'completed', score: 88, dueDate: '2024-01-16' },
    { _id: '3', title: 'Design Patterns Quiz', type: 'quiz', status: 'pending', dueDate: '2024-01-20' },
    { _id: '4', title: 'SQL Basics Quiz', type: 'quiz', status: 'completed', score: 92, dueDate: '2024-01-14' }
  ]

  useEffect(() => {
    setCourses(mockCourses)
    setRecentActivities(mockRecentActivities)
    setStats({
      totalActivities: 5,
      completedActivities: 3,
      averageScore: 92,
      currentStreak: 7,
      rank: 3
    })
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz': return '📝'
      case 'poll': return '📊'
      case 'wordcloud': return '☁️'
      case 'shortanswer': return '✍️'
      case 'minigame': return '🎮'
      default: return '📋'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Rank #{stats.rank}</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/leaderboard">View Leaderboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activities Completed</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedActivities}/{stats.totalActivities}</div>
              <Progress value={(stats.completedActivities / stats.totalActivities) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}%</div>
              <p className="text-xs text-muted-foreground">
                +3% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentStreak} days</div>
              <p className="text-xs text-muted-foreground">
                Keep it up!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Class Rank</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{stats.rank}</div>
              <p className="text-xs text-muted-foreground">
                Top 10%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Your latest learning activities and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                      <div>
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-gray-600 capitalize">{activity.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {activity.score && (
                        <div className="text-right">
                          <div className="font-bold text-green-600">{activity.score}%</div>
                          <div className="text-xs text-gray-600">Score</div>
                        </div>
                      )}
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/student/activities">View All Activities</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Courses */}
          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>
                Courses you're currently enrolled in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course._id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-gray-600">{course.code}</p>
                      </div>
                      <Badge variant="outline">{course.activities.length} activities</Badge>
                    </div>
                    <div className="space-y-2">
                      {course.activities.slice(0, 2).map((activity) => (
                        <div key={activity._id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <span>{getActivityIcon(activity.type)}</span>
                            <span>{activity.title}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {activity.dueDate && (
                              <div className="flex items-center text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{new Date(activity.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {getStatusBadge(activity.status)}
                          </div>
                        </div>
                      ))}
                      {course.activities.length > 2 && (
                        <div className="text-sm text-gray-500">
                          +{course.activities.length - 2} more activities
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/courses">View All Courses</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
