'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Play, 
  Edit, 
  Trash2, 
  Users, 
  Clock, 
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  Pause
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Activity {
  _id: string
  title: string
  description?: string
  type: 'poll' | 'quiz' | 'wordcloud' | 'shortanswer' | 'minigame'
  status: 'draft' | 'active' | 'completed'
  courseId: {
    _id: string
    title: string
    code: string
  }
  content: {
    questions?: Array<{
      id: string
      text: string
      type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay'
      options?: string[]
      correctAnswer?: string | string[]
      points: number
    }>
    options?: string[]
    instructions?: string
    timeLimit?: number
    allowMultiple?: boolean
    wordCloudSettings?: {
      maxWords: number
      minWordLength: number
      excludeCommon: boolean
      colorScheme: string
    }
    gameSettings?: {
      gameType: 'memory' | 'matching' | 'puzzle' | 'trivia'
      difficulty: 'easy' | 'medium' | 'hard'
      timeLimit?: number
      maxPlayers?: number
    }
  }
  settings: {
    isAnonymous: boolean
    showResults: boolean
    allowMultipleAttempts: boolean
    shuffleQuestions: boolean
    timeLimit?: number
    dueDate?: Date
  }
  createdAt: string
  updatedAt: string
  participants?: number
}

export default function ActivityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    fetchActivity()
  }, [session, status, router, params.id])

  const fetchActivity = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/activities/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Activity not found')
        }
        throw new Error('Failed to fetch activity details')
      }
      
      const data = await response.json()
      setActivity(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
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

  const getTypeColor = (type: string) => {
    const colors = {
      quiz: 'text-blue-600',
      poll: 'text-green-600',
      wordcloud: 'text-purple-600',
      shortanswer: 'text-orange-600',
      minigame: 'text-pink-600'
    }
    return colors[type as keyof typeof colors] || 'text-gray-600'
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/activities/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete activity')
      }

      toast.success('Activity deleted successfully')
      router.push('/activities')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete activity')
    }
  }

  const handleStatusUpdate = async (newStatus: 'draft' | 'active' | 'completed') => {
    if (!activity) return

    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/activities/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update activity status')
      }

      const updatedActivity = await response.json()
      setActivity(updatedActivity)
      
      const statusMessages = {
        draft: 'Activity moved to draft',
        active: 'Activity activated successfully',
        completed: 'Activity marked as completed'
      }
      
      toast.success(statusMessages[newStatus])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update activity status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading activity details...</p>
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
          <div className="text-red-600 text-xl mb-4">Error loading activity</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchActivity}>Retry</Button>
            <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Activity not found</div>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
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
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="ml-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getActivityIcon(activity.type)}</span>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <span className="capitalize">{activity.type}</span>
                      <span>•</span>
                      <span>{activity.courseId.code} - {activity.courseId.title}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(activity.status)}
              {isTeacher && (
                <div className="flex items-center space-x-2 ml-4">
                  {/* Status Management Buttons */}
                  {activity.status === 'draft' && (
                    <Button 
                      onClick={() => handleStatusUpdate('active')}
                      disabled={updatingStatus}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {updatingStatus ? 'Activating...' : 'Activate'}
                    </Button>
                  )}
                  
                  {activity.status === 'active' && (
                    <>
                      <Button asChild>
                        <Link href={`/activities/${activity._id}/live`}>
                          <Play className="h-4 w-4 mr-2" />
                          Start Session
                        </Link>
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleStatusUpdate('completed')}
                        disabled={updatingStatus}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        {updatingStatus ? 'Completing...' : 'Complete'}
                      </Button>
                    </>
                  )}
                  
                  {activity.status === 'completed' && (
                    <Button 
                      variant="outline"
                      onClick={() => handleStatusUpdate('active')}
                      disabled={updatingStatus}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {updatingStatus ? 'Reactivating...' : 'Reactivate'}
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/activities/${activity._id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {activity.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{activity.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Questions */}
            {activity.content.questions && activity.content.questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Questions ({activity.content.questions.length})</CardTitle>
                  <CardDescription>
                    Preview of questions in this activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activity.content.questions.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <Badge variant="outline">{question.points} pts</Badge>
                        </div>
                        <p className="text-gray-700 mb-3">{question.text}</p>
                        {question.options && question.options.length > 0 && (
                          <div className="space-y-1">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2 text-sm">
                                <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center">
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>
                                <span className="text-gray-600">{option}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {activity.content.instructions && (
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{activity.content.instructions}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Activity Info */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium">Participants</span>
                  </div>
                  <span className="text-lg font-bold">{activity.participants || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium">Time Limit</span>
                  </div>
                  <span className="text-lg font-bold">
                    {activity.settings.timeLimit ? `${activity.settings.timeLimit} min` : 'No limit'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {activity.settings.isAnonymous ? (
                      <EyeOff className="h-5 w-5 text-orange-600 mr-2" />
                    ) : (
                      <Eye className="h-5 w-5 text-blue-600 mr-2" />
                    )}
                    <span className="text-sm font-medium">Responses</span>
                  </div>
                  <span className="text-lg font-bold">
                    {activity.settings.isAnonymous ? 'Anonymous' : 'Named'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium">Results</span>
                  </div>
                  <span className="text-lg font-bold">
                    {activity.settings.showResults ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Multiple Attempts</span>
                  <Badge variant={activity.settings.allowMultipleAttempts ? 'default' : 'outline'}>
                    {activity.settings.allowMultipleAttempts ? 'Allowed' : 'Not Allowed'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Shuffle Questions</span>
                  <Badge variant={activity.settings.shuffleQuestions ? 'default' : 'outline'}>
                    {activity.settings.shuffleQuestions ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                {activity.settings.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Due Date</span>
                    <span className="text-sm font-medium">
                      {new Date(activity.settings.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Link */}
            <Card>
              <CardHeader>
                <CardTitle>Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{activity.courseId.title}</p>
                  <p className="text-sm text-gray-600">{activity.courseId.code}</p>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/courses/${activity.courseId._id}`}>
                      View Course
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
