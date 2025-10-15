'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Play, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Calendar,
  Target
} from 'lucide-react'
import Link from 'next/link'

interface Activity {
  _id: string
  title: string
  type: 'poll' | 'quiz' | 'wordcloud' | 'shortanswer' | 'minigame'
  status: 'draft' | 'active' | 'completed'
  settings: {
    timeLimit?: number
    dueDate?: string
  }
  courseId: string
  course?: {
    title: string
    code: string
  }
  createdAt: string
  updatedAt: string
}

interface Course {
  _id: string
  title: string
  code: string
  activities: Activity[]
}

export default function StudentActivitiesPage() {
  const { data: session } = useSession()
  const [activities, setActivities] = useState<Activity[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [courseFilter, setCourseFilter] = useState<string>('all')

  // 获取学生参与的活动
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // 获取学生的课程
        const coursesResponse = await fetch('/api/courses')
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          setCourses(coursesData)
          
          // 获取所有活动
          const activitiesResponse = await fetch('/api/activities')
          if (activitiesResponse.ok) {
            const activitiesData = await activitiesResponse.json()
            
            // 过滤出学生课程中的活动
            const studentCourseIds = coursesData.map((course: Course) => course._id)
            const studentActivities = activitiesData.filter((activity: Activity) => 
              studentCourseIds.includes(activity.courseId)
            )
            
            setActivities(studentActivities)
            setFilteredActivities(studentActivities)
          }
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [])

  // 过滤活动
  useEffect(() => {
    let filtered = activities

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.course?.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(activity => activity.status === statusFilter)
    }

    // 类型过滤
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === typeFilter)
    }

    // 课程过滤
    if (courseFilter !== 'all') {
      filtered = filtered.filter(activity => activity.courseId === courseFilter)
    }

    setFilteredActivities(filtered)
  }, [activities, searchTerm, statusFilter, typeFilter, courseFilter])

  // 获取活动图标
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

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 获取类型显示名称
  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'quiz': return 'Quiz'
      case 'poll': return 'Poll'
      case 'wordcloud': return 'Word Cloud'
      case 'shortanswer': return 'Short Answer'
      case 'minigame': return 'Mini Game'
      default: return type
    }
  }

  // 检查活动是否可参与
  const canParticipate = (activity: Activity) => {
    return activity.status === 'active'
  }

  // 检查活动是否已过期
  const isOverdue = (activity: Activity) => {
    if (!activity.settings.dueDate) return false
    return new Date(activity.settings.dueDate) < new Date()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading activities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">My Activities</h1>
            </div>
            <Button variant="outline" asChild>
              <Link href="/student">
                <Target className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="poll">Poll</SelectItem>
                  <SelectItem value="wordcloud">Word Cloud</SelectItem>
                  <SelectItem value="shortanswer">Short Answer</SelectItem>
                  <SelectItem value="minigame">Mini Game</SelectItem>
                </SelectContent>
              </Select>

              {/* Course Filter */}
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.code} - {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || courseFilter !== 'all'
                    ? 'Try adjusting your filters to see more activities.'
                    : 'You don\'t have any activities yet. Check back later!'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity) => (
              <Card key={activity._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                      <div>
                        <CardTitle className="text-lg">{activity.title}</CardTitle>
                        <CardDescription>
                          {activity.course?.code} - {activity.course?.title}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(activity.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Activity Type */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Filter className="h-4 w-4" />
                      <span>{getTypeDisplayName(activity.type)}</span>
                    </div>

                    {/* Time Limit */}
                    {activity.settings.timeLimit && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{activity.settings.timeLimit} minutes</span>
                      </div>
                    )}

                    {/* Due Date */}
                    {activity.settings.dueDate && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {new Date(activity.settings.dueDate).toLocaleDateString()}</span>
                        {isOverdue(activity) && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {new Date(activity.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3">
                      {canParticipate(activity) ? (
                        <Button asChild className="w-full">
                          <Link href={`/student/activities/${activity._id}/participate`}>
                            <Play className="h-4 w-4 mr-2" />
                            Participate
                          </Link>
                        </Button>
                      ) : activity.status === 'completed' ? (
                        <Button variant="outline" className="w-full" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          <Clock className="h-4 w-4 mr-2" />
                          Not Available
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Activities</p>
                  <p className="text-2xl font-bold">{activities.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Activities</p>
                  <p className="text-2xl font-bold">
                    {activities.filter(a => a.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Activities</p>
                  <p className="text-2xl font-bold">
                    {activities.filter(a => a.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
