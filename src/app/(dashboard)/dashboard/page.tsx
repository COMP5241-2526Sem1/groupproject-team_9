'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Activity, BarChart3, Plus, Settings, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
  stats: {
    totalCourses?: number
    totalStudents?: number
    totalActivities: number
    averageScore: number
    completedActivities?: number
    currentStreak?: number
    rank?: number
  }
  trends?: {
    courses: number
    students: number
    activities: number
    score: number
  }
  recentCourses?: Array<{
    id: string
    title: string
    code: string
    studentCount: number
  }>
  courses?: Array<{
    _id: string
    title: string
    code: string
    activities: Array<{
      _id: string
      title: string
      type: string
      status: string
      score?: number
      dueDate?: string
    }>
  }>
  recentActivities?: Array<{
    _id: string
    title: string
    type: string
    status: string
    score?: number
    dueDate?: string
  }>
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    // Fetch dashboard data for both teachers and students
    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use different API endpoints based on user role
      const apiEndpoint = session?.user.role === 'student' 
        ? '/api/student/dashboard' 
        : '/api/dashboard'
      
      const response = await fetch(apiEndpoint)
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || !session.user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    )
  }

  const isTeacher = session.user.role === 'teacher'
  const isStudent = session.user.role === 'student'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">Interactive Learning</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {session.user.name}</span>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">
            {isTeacher ? 'Manage your courses and activities' : 'Track your learning progress'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isTeacher ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.stats.totalCourses || 0}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {dashboardData?.trends?.courses !== undefined && dashboardData.trends.courses !== 0 && (
                      <>
                        {dashboardData.trends.courses > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                        )}
                        {Math.abs(dashboardData.trends.courses)} from last month
                      </>
                    )}
                    {(!dashboardData?.trends?.courses || dashboardData.trends.courses === 0) && 'No change from last month'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.stats.totalStudents || 0}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {dashboardData?.trends?.students !== undefined && dashboardData.trends.students !== 0 && (
                      <>
                        {dashboardData.trends.students > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                        )}
                        {Math.abs(dashboardData.trends.students)} from last month
                      </>
                    )}
                    {(!dashboardData?.trends?.students || dashboardData.trends.students === 0) && 'No change from last month'}
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Activities</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.stats.completedActivities || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    out of {dashboardData?.stats.totalActivities || 0} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.stats.currentStreak || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    consecutive days
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.stats.totalActivities || 0}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {dashboardData?.trends?.activities !== undefined && dashboardData.trends.activities !== 0 && (
                  <>
                    {dashboardData.trends.activities > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    {Math.abs(dashboardData.trends.activities)} from last month
                  </>
                )}
                {(!dashboardData?.trends?.activities || dashboardData.trends.activities === 0) && 'No change from last month'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isStudent ? 'My Rank' : 'Avg Score'}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isStudent 
                  ? `#${dashboardData?.stats.rank || 'N/A'}`
                  : `${dashboardData?.stats.averageScore || 0}%`
                }
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                {isStudent ? (
                  'among all students'
                ) : (
                  <>
                    {dashboardData?.trends?.score !== undefined && dashboardData.trends.score !== 0 && (
                      <>
                        {dashboardData.trends.score > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                        )}
                        {Math.abs(dashboardData.trends.score)}% from last month
                      </>
                    )}
                    {(!dashboardData?.trends?.score || dashboardData.trends.score === 0) && 'No change from last month'}
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Courses */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isTeacher ? 'Recent Courses' : 'My Courses'}
              </CardTitle>
              <CardDescription>
                {isTeacher ? 'Your teaching courses' : 'Courses you\'re enrolled in'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isTeacher ? (
                  dashboardData?.recentCourses && dashboardData.recentCourses.length > 0 ? (
                    dashboardData.recentCourses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{course.title}</h4>
                          <p className="text-sm text-gray-600">{course.code}</p>
                          <p className="text-xs text-gray-500">{course.studentCount} students</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/courses/${course.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No courses created yet
                    </div>
                  )
                ) : (
                  dashboardData?.courses && dashboardData.courses.length > 0 ? (
                    dashboardData.courses.map((course) => (
                      <div key={course._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{course.title}</h4>
                          <p className="text-sm text-gray-600">{course.code}</p>
                          <p className="text-xs text-gray-500">
                            {course.activities.filter(a => a.status === 'completed').length} / {course.activities.length} activities completed
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/courses/${course._id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No courses enrolled
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                {isTeacher ? 'Create and manage content' : 'Participate in activities'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isTeacher ? (
                  <>
                    <Button className="w-full justify-start" asChild>
                      <Link href="/courses">
                        <BookOpen className="h-4 w-4 mr-2" />
                        View All Courses
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/courses/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Course
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/activities/create">
                        <Activity className="h-4 w-4 mr-2" />
                        Create Activity
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/analytics">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full justify-start" asChild>
                      <Link href="/courses">
                        <BookOpen className="h-4 w-4 mr-2" />
                        View My Courses
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/activities">
                        <Activity className="h-4 w-4 mr-2" />
                        View Activities
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/leaderboard">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Leaderboard
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/progress">
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Progress
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
