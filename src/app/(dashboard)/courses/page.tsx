'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Calendar, Plus, ArrowLeft, LogOut } from 'lucide-react'
import Link from 'next/link'

interface Course {
  _id: string
  title: string
  description: string
  code: string
  instructorId: {
    _id: string
    name: string
    email: string
  }
  studentIds: string[]
  studentCount: number
  activityCount: number
  createdAt: string
}

export default function CoursesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState<string | null>(null)

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

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrolling(courseId)
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to enroll')
      }
      
      // Refresh courses list
      await fetchCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setEnrolling(null)
    }
  }

  const handleUnenroll = async (courseId: string) => {
    try {
      setEnrolling(courseId)
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to unenroll')
      }
      
      // Refresh courses list
      await fetchCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setEnrolling(null)
    }
  }

  const isEnrolled = (course: Course) => {
    return course.studentIds.some(id => id === session?.user?.id)
  }

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
  const isStudent = session.user.role === 'student'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" asChild className="mr-4">
                <Link href={isStudent ? '/student' : '/dashboard'}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">
                {isTeacher ? 'My Courses' : 'Available Courses'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {isTeacher && (
                <Button asChild>
                  <Link href="/courses/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Link>
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {course.code}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {course.activityCount} activities
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{course.studentCount} students</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Instructor:</span>
                      <span className="ml-1">{course.instructorId.name}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button asChild className="flex-1">
                      <Link href={`/courses/${course._id}`}>
                        View Details
                      </Link>
                    </Button>
                    {isStudent && (
                      <>
                        {isEnrolled(course) ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUnenroll(course._id)}
                            disabled={enrolling === course._id}
                          >
                            {enrolling === course._id ? 'Unenrolling...' : 'Unenroll'}
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEnroll(course._id)}
                            disabled={enrolling === course._id}
                          >
                            {enrolling === course._id ? 'Enrolling...' : 'Enroll'}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isTeacher ? 'No courses created yet' : 'No courses available'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isTeacher 
                ? 'Create your first course to get started with teaching.'
                : 'There are no courses available for enrollment at the moment.'
              }
            </p>
            {isTeacher && (
              <Button asChild>
                <Link href="/courses/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
