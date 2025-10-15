'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

export default function CreateActivityPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'poll',
    courseId: '',
    timeLimit: 0,
    isAnonymous: false,
    showResults: true
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const router = useRouter()

  // Fetch courses on component mount
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
      setLoadingCourses(true)
      const response = await fetch('/api/courses')
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      
      const data = await response.json()
      setCourses(data)
      
      // Pre-select course if courseId is provided in URL params
      const courseIdFromUrl = searchParams.get('courseId')
      if (courseIdFromUrl && data.some((course: Course) => course._id === courseIdFromUrl)) {
        setFormData(prev => ({ ...prev, courseId: courseIdFromUrl }))
      }
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
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ))
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
        ...formData,
        content: {
          questions: questions.map(q => ({
            ...q,
            options: q.options?.filter(opt => opt.trim() !== '')
          }))
        }
      }

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      })

      if (response.ok) {
        toast.success('Activity created successfully!')
        router.push('/dashboard')
      } else {
        const error = await response.json()
        console.error('Activity creation error:', error)
        
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
          toast.error(error.message || 'Failed to create activity')
        }
      }
    } catch (error) {
      console.error('Activity creation error:', error)
      toast.error('An error occurred while creating the activity')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create Activity</h1>
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
                Set up the basic details for your activity
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
                      <SelectItem value="wordcloud">Word Cloud</SelectItem>
                      <SelectItem value="shortanswer">Short Answer</SelectItem>
                      <SelectItem value="minigame">Mini Game</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                {courses.length === 0 && !loadingCourses && (
                  <p className="text-sm text-gray-500">
                    No courses found. Please create a course first.
                  </p>
                )}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      Add questions for your activity
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

                          {(question.type === 'multiple-choice' || question.type === 'true-false') && (
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
                                  {question.options && question.options.length > 2 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newOptions = question.options?.filter((_, idx) => idx !== optionIndex)
                                        updateQuestion(question.id, 'options', newOptions)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
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
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Creating...' : 'Create Activity'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
