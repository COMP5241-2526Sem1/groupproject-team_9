'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, 
  Users, 
  Activity, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User
} from 'lucide-react'
import Link from 'next/link'

interface Course {
  _id: string
  title: string
  description: string
  code: string
  instructorId: string
  studentIds: string[]
  students?: Array<{
    _id: string
    name: string
    email: string
    studentId?: string
  }>
  activities?: Array<{
    _id: string
    title: string
    type: string
    status: string
    participants: number
  }>
  createdAt: string
  updatedAt: string
}

export default function CoursesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    fetchCourses()
  }, [session, status, router])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/courses')
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      
      const data = await response.json()
      setCourses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete course')
      }

      // Remove the course from the list
      setCourses(courses.filter(course => course._id !== courseId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course')
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
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
          <div className="text-red-600 text-xl mb-4">Error loading courses</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchCourses}>Retry</Button>
        </div>
      </div>
    )
  }

  const isTeacher = session.user.role === 'teacher'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isTeacher ? 'My Courses' : 'Enrolled Courses'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isTeacher 
                  ? 'Manage your courses and students'
                  : 'View your enrolled courses and activities'
                }
              </p>
            </div>
            {isTeacher && (
              <Button asChild>
                <Link href="/courses/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Stats */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredCourses.length} of {courses.length} courses
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline">{course.code}</Badge>
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/courses/${course._id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {isTeacher && session.user.id === course.instructorId && (
                        <>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/courses/${course._id}?edit=true`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteCourse(course._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {course.description}
                  </p>
                  
                  {/* Course Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Students</span>
                      </div>
                      <span className="font-medium">{course.studentIds?.length || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Activity className="h-4 w-4 mr-2" />
                        <span>Activities</span>
                      </div>
                      <span className="font-medium">{course.activities?.length || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Created</span>
                      </div>
                      <span className="font-medium">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <Button className="w-full" asChild>
                      <Link href={`/courses/${course._id}`}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Course
                      </Link>
                    </Button>
                    
                    {isTeacher && session.user.id === course.instructorId && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/courses/${course._id}?manage=students`}>
                            <Users className="h-4 w-4 mr-1" />
                            Students
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/activities/create?courseId=${course._id}`}>
                            <Plus className="h-4 w-4 mr-1" />
                            Activity
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              {isTeacher ? '📚' : '🎓'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No courses found' : (isTeacher ? 'No courses yet' : 'No enrolled courses')}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : (isTeacher 
                    ? 'Create your first course to get started'
                    : 'You are not enrolled in any courses yet'
                  )
              }
            </p>
            {isTeacher && !searchTerm && (
              <Button asChild>
                <Link href="/courses/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
