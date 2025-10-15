'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  BookOpen, 
  Users, 
  Activity, 
  BarChart3, 
  Plus, 
  Settings, 
  Edit,
  Trash2,
  Play,
  Clock,
  User,
  X,
  Save,
  Upload
} from 'lucide-react'
import Link from 'next/link'
import { StudentImportDialog } from '@/components/student-import-dialog'
import { StudentManagement } from '@/components/student-management'

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
    institution?: string
  }>
  activities: Activity[]
  createdAt: string
  updatedAt: string
}

interface Activity {
  _id: string
  title: string
  type: 'poll' | 'quiz' | 'wordcloud' | 'shortanswer' | 'minigame'
  status: 'draft' | 'active' | 'completed'
  createdAt: string
  participants?: number
}

interface CourseDetailProps {
  params: {
    id: string
  }
}

export default function CourseDetailPage({ params }: CourseDetailProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    code: ''
  })
  const [editLoading, setEditLoading] = useState(false)
  const [showStudentManagement, setShowStudentManagement] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    fetchCourseDetail()
  }, [session, status, router, params.id])

  const fetchCourseDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/courses/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Course not found')
        }
        throw new Error('Failed to fetch course details')
      }
      
      const data = await response.json()
      setCourse(data)
      // Initialize edit form with current course data
      setEditForm({
        title: data.title,
        description: data.description,
        code: data.code
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    // Reset form to original values
    if (course) {
      setEditForm({
        title: course.title,
        description: course.description,
        code: course.code
      })
    }
  }

  const handleEditSave = async () => {
    try {
      setEditLoading(true)
      const response = await fetch(`/api/courses/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        throw new Error('Failed to update course')
      }

      const updatedCourse = await response.json()
      setCourse(updatedCourse)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course')
    } finally {
      setEditLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleStudentAdded = (newStudent: any) => {
    if (course) {
      setCourse(prev => ({
        ...prev!,
        students: [...(prev?.students || []), newStudent],
        studentIds: [...(prev?.studentIds || []), newStudent._id]
      }))
    }
  }

  const handleStudentRemoved = (studentId: string) => {
    if (course) {
      setCourse(prev => ({
        ...prev!,
        students: prev?.students?.filter(s => s._id !== studentId) || [],
        studentIds: prev?.studentIds?.filter(id => id !== studentId) || []
      }))
    }
  }

  const handleStudentsImported = () => {
    // Refresh course data after import
    fetchCourseDetail()
  }

  const getActivityIcon = (type: string) => {
    const icons = {
      poll: '📊',
      quiz: '❓',
      wordcloud: '☁️',
      shortanswer: '✍️',
      minigame: '🎮'
    }
    return icons[type as keyof typeof icons] || '📝'
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      active: 'default',
      completed: 'outline'
    } as const
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
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
          <div className="text-red-600 text-xl mb-4">Error loading course</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchCourseDetail}>Retry</Button>
            <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Course not found</div>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const isTeacher = session.user.role === 'teacher'
  const isInstructor = isTeacher && session.user.id === course.instructorId

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                ← Back
              </Button>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-gray-600">{course.code}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isInstructor && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowStudentManagement(!showStudentManagement)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {showStudentManagement ? 'Hide Students' : 'Manage Students'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleEditClick}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Course
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/courses/${course._id}/analytics`}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Course Description */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Course Description</CardTitle>
                  {isInstructor && !isEditing && (
                    <Button variant="ghost" size="sm" onClick={handleEditClick}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Course Title</Label>
                      <Input
                        id="title"
                        value={editForm.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter course title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="code">Course Code</Label>
                      <Input
                        id="code"
                        value={editForm.code}
                        onChange={(e) => handleInputChange('code', e.target.value)}
                        placeholder="Enter course code"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Enter course description"
                        rows={4}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleEditSave} 
                        disabled={editLoading}
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {editLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleEditCancel}
                        disabled={editLoading}
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-700 leading-relaxed">{course.description}</p>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      Created on {new Date(course.createdAt).toLocaleDateString()}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Course Stats */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium">Students</span>
                  </div>
                  <span className="text-lg font-bold">{course.studentIds?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium">Activities</span>
                  </div>
                  <span className="text-lg font-bold">{course.activities?.length || 0}</span>
                </div>
                {isInstructor && (
                  <div className="pt-4 border-t space-y-2">
                    <StudentImportDialog 
                      courseId={course._id}
                      onImportComplete={() => {
                        // Refresh course data after import
                        fetchCourseDetail()
                      }}
                    >
                      <Button variant="outline" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Students
                      </Button>
                    </StudentImportDialog>
                    <Button className="w-full" asChild>
                      <Link href="/activities/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Activity
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Student Management Section */}
        {isInstructor && showStudentManagement && (
          <div className="mb-8">
            <StudentManagement
              courseId={course._id}
              students={course.students || []}
              onStudentAdded={handleStudentAdded}
              onStudentRemoved={handleStudentRemoved}
              onStudentsImported={handleStudentsImported}
            />
          </div>
        )}

        {/* Activities Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activities</CardTitle>
                <CardDescription>
                  {course.activities?.length || 0} activities in this course
                </CardDescription>
              </div>
              {isInstructor && (
                <Button asChild>
                  <Link href="/activities/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Activity
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(course.activities?.length || 0) > 0 ? (
              <div className="space-y-4">
                {course.activities?.map((activity) => (
                  <div key={activity._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                      <div>
                        <h4 className="font-medium">{activity.title}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span className="capitalize">{activity.type}</span>
                          <span>•</span>
                          <span>{activity.participants || 0} participants</span>
                          <span>•</span>
                          <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(activity.status)}
                      <div className="flex space-x-1">
                        {activity.status === 'active' && (
                          <Button size="sm" asChild>
                            <Link href={`/activities/${activity._id}/live`}>
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Link>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/activities/${activity._id}`}>
                            View
                          </Link>
                        </Button>
                        {isInstructor && (
                          <>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
                <p className="text-gray-600 mb-4">
                  {isInstructor 
                    ? 'Create your first activity to get started'
                    : 'No activities have been created for this course yet'
                  }
                </p>
                {isInstructor && (
                  <Button asChild>
                    <Link href="/activities/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Activity
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
