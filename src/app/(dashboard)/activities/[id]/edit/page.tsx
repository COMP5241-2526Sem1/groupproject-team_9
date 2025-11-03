'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Question {
  id: string
  text: string
  type: 'multiple-choice' | 'true-false' | 'short-answer'
  options?: string[]
  correctAnswer?: string
  points: number
}

interface Course {
  _id: string
  title: string
  code: string
  description: string
}

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
    questions?: Question[]
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

export default function EditActivityPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'poll',
    courseId: '',
    timeLimit: 0,
    isAnonymous: false,
    showResults: true,
    allowMultipleAttempts: false,
    shuffleQuestions: false,
    status: 'draft' as 'draft' | 'active' | 'completed'
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [loadingCourses, setLoadingCourses] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    fetchActivity()
    fetchCourses()
  }, [session, status, router, params.id])

  const fetchActivity = async () => {
    try {
      setLoadingActivity(true)
      const response = await fetch(`/api/activities/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Activity not found')
        }
        throw new Error('Failed to fetch activity details')
      }
      
      const data = await response.json()
      setActivity(data)
      
      // Populate form with existing data
      // Only allow poll and quiz types
      const activityType = data.type === 'poll' || data.type === 'quiz' ? data.type : 'poll'
      setFormData({
        title: data.title || '',
        description: data.description || '',
        type: activityType,
        courseId: data.courseId._id || '',
        timeLimit: data.settings?.timeLimit || 0,
        isAnonymous: data.settings?.isAnonymous || false,
        showResults: data.settings?.showResults || true,
        allowMultipleAttempts: data.settings?.allowMultipleAttempts || false,
        shuffleQuestions: data.settings?.shuffleQuestions || false,
        status: data.status || 'draft'
      })
      
      // Set questions if they exist
      if (data.content?.questions) {
        setQuestions(data.content.questions)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load activity')
      console.error('Error fetching activity:', err)
    } finally {
      setLoadingActivity(false)
    }
  }

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true)
      const response = await fetch('/api/courses')
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      
      const data = await response.json()
      setCourses(data)
    } catch (error) {
      toast.error('Failed to load courses')
      console.error('Error fetching courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      type: 'multiple-choice',
      options: ['', ''],
      points: 1
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        const updatedQuestion = { ...q, [field]: value }
        
        // Auto-set options for true-false questions
        if (field === 'type' && value === 'true-false') {
          updatedQuestion.options = ['True', 'False']
        } else if (field === 'type' && value === 'multiple-choice' && (!q.options || q.options.length === 0)) {
          updatedQuestion.options = ['', '']
        }
        
        return updatedQuestion
      }
      return q
    }))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: [...(q.options || []), ''] }
        : q
    ))
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options?.map((opt, idx) => idx === optionIndex ? value : opt) 
          }
        : q
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate required fields
    if (!formData.courseId) {
      toast.error('Please select a course')
      setIsLoading(false)
      return
    }

    try {
      const activityData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        courseId: formData.courseId,
        status: formData.status,
        content: {
          questions: questions.map(q => ({
            ...q,
            options: q.options?.filter(opt => opt.trim() !== '')
          }))
        },
        settings: {
          isAnonymous: formData.isAnonymous,
          showResults: formData.showResults,
          allowMultipleAttempts: formData.allowMultipleAttempts,
          shuffleQuestions: formData.shuffleQuestions,
          timeLimit: formData.timeLimit || undefined
        }
      }

      const response = await fetch(`/api/activities/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      })

      if (response.ok) {
        toast.success('Activity updated successfully!')
        router.push(`/activities/${params.id}`)
      } else {
        const error = await response.json()
        console.error('Activity update error:', error)
        
        if (error.details) {
          // Handle validation errors
          if (Array.isArray(error.details)) {
            error.details.forEach((detail: any) => {
              toast.error(`${detail.field}: ${detail.message}`)
            })
          } else if (typeof error.details === 'object') {
            Object.values(error.details).forEach((message: any) => {
              if (message) toast.error(message)
            })
          }
        } else {
          toast.error(error.message || 'Failed to update activity')
        }
      }
    } catch (error) {
      console.error('Activity update error:', error)
      toast.error('An error occurred while updating the activity')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || loadingActivity || loadingCourses) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href={`/activities/${params.id}`}>
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Activity
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Activity</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Information</CardTitle>
              <CardDescription>
                Update the basic details for your activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Activity Title</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Weekly Quiz"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Activity Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poll">Poll</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseId">Course</Label>
                  <Select 
                    value={formData.courseId} 
                    onValueChange={(value) => setFormData({...formData, courseId: value})}
                    disabled={loadingCourses}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a course"} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.code} - {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({...formData, status: value as 'draft' | 'active' | 'completed'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this activity is about..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    placeholder="0 for no limit"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({...formData, timeLimit: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Settings</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAnonymous"
                        checked={formData.isAnonymous}
                        onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})}
                      />
                      <Label htmlFor="isAnonymous">Anonymous responses</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showResults"
                        checked={formData.showResults}
                        onChange={(e) => setFormData({...formData, showResults: e.target.checked})}
                      />
                      <Label htmlFor="showResults">Show results immediately</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowMultipleAttempts"
                        checked={formData.allowMultipleAttempts}
                        onChange={(e) => setFormData({...formData, allowMultipleAttempts: e.target.checked})}
                      />
                      <Label htmlFor="allowMultipleAttempts">Allow multiple attempts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="shuffleQuestions"
                        checked={formData.shuffleQuestions}
                        onChange={(e) => setFormData({...formData, shuffleQuestions: e.target.checked})}
                      />
                      <Label htmlFor="shuffleQuestions">Shuffle questions</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Section */}
          {(formData.type === 'quiz' || formData.type === 'poll') && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Questions</CardTitle>
                    <CardDescription>
                      Add or edit questions for your activity
                    </CardDescription>
                  </div>
                  <Button type="button" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No questions added yet. Click "Add Question" to get started.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeQuestion(question.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Question Text</Label>
                            <Input
                              placeholder="Enter your question..."
                              value={question.text}
                              onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Question Type</Label>
                              <Select 
                                value={question.type} 
                                onValueChange={(value) => updateQuestion(question.id, 'type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                  <SelectItem value="true-false">True/False</SelectItem>
                                  <SelectItem value="short-answer">Short Answer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Points</Label>
                              <Input
                                type="number"
                                value={question.points}
                                onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 1)}
                              />
                            </div>
                          </div>

                          {question.type === 'true-false' && (
                            <div className="space-y-2">
                              <Label>Correct Answer</Label>
                              <div className="flex space-x-4">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name={`correctAnswer-${question.id}`}
                                    checked={question.correctAnswer === 'True'}
                                    onChange={() => updateQuestion(question.id, 'correctAnswer', 'True')}
                                    className="w-4 h-4"
                                  />
                                  <span>True</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name={`correctAnswer-${question.id}`}
                                    checked={question.correctAnswer === 'False'}
                                    onChange={() => updateQuestion(question.id, 'correctAnswer', 'False')}
                                    className="w-4 h-4"
                                  />
                                  <span>False</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {question.type === 'short-answer' && (
                            <div className="space-y-2">
                              <Label>Correct Answer</Label>
                              <Input
                                placeholder="Enter the correct answer..."
                                value={question.correctAnswer || ''}
                                onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                              />
                              <p className="text-sm text-gray-500">
                                Students' answers will be compared to this text (case-insensitive)
                              </p>
                            </div>
                          )}

                          {question.type === 'multiple-choice' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Options</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOption(question.id)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Option
                                </Button>
                              </div>
                              {question.options?.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <Input
                                    placeholder={`Option ${optionIndex + 1}`}
                                    value={option}
                                    onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                  />
                                  {formData.type === 'quiz' && (
                                    <input
                                      type="radio"
                                      name={`correctAnswer-${question.id}`}
                                      checked={question.correctAnswer === option}
                                      onChange={() => updateQuestion(question.id, 'correctAnswer', option)}
                                      className="w-4 h-4"
                                    />
                                  )}
                                  {question.options && question.options.length > 2 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newOptions = question.options?.filter((_, idx) => idx !== optionIndex)
                                        updateQuestion(question.id, 'options', newOptions)
                                        // Clear correct answer if it was the deleted option
                                        if (question.correctAnswer === option) {
                                          updateQuestion(question.id, 'correctAnswer', '')
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              {formData.type === 'quiz' && question.options && question.options.length > 0 && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                  <Label className="text-sm font-medium text-blue-800">
                                    Select the correct answer by clicking the radio button next to the option
                                  </Label>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Updating...' : 'Update Activity'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
