'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { useSocket } from '@/components/socket-provider'
import { toast } from 'react-hot-toast'
import { 
  Clock, 
  Users, 
  CheckCircle, 
  Play, 
  Pause, 
  Square, 
  Send,
  BarChart3,
  MessageSquare,
  Target,
  AlertCircle
} from 'lucide-react'

interface Activity {
  _id: string
  title: string
  type: 'poll' | 'quiz' | 'wordcloud' | 'shortanswer' | 'minigame'
  content: {
    questions?: Array<{
      id: string
      text: string
      type: 'multiple-choice' | 'true-false'
      options?: string[]
      correctAnswer?: string
      points: number
    }>
    options?: string[]
    instructions?: string
    timeLimit?: number
    allowMultiple?: boolean
  }
  settings: {
    isAnonymous: boolean
    showResults: boolean
    allowMultipleAttempts: boolean
    timeLimit?: number
  }
  status: 'draft' | 'active' | 'completed'
}

interface Session {
  id: string
  activityId: string
  status: 'waiting' | 'active' | 'paused' | 'completed'
  startedAt?: Date
  endedAt?: Date
  participants: string[]
  results?: any
}

interface ResponseData {
  questionId?: string
  answer?: string | string[]
  text?: string
  selectedOptions?: string[]
  // For quizzes: store all question answers as { [questionId]: answer }
  [key: string]: any
}

export default function StudentActivityParticipationPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()
  
  const [activity, setActivity] = useState<Activity | null>(null)
  const [sessionData, setSessionData] = useState<Session | null>(null)
  const [participants, setParticipants] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [response, setResponse] = useState<ResponseData>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [realTimeResults, setRealTimeResults] = useState<any[]>([])
  const [showRealTimeResults, setShowRealTimeResults] = useState(false)
  const [connectionTimeout, setConnectionTimeout] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previousResponse, setPreviousResponse] = useState<any>(null)

  // 连接Socket并加入活动房间
  useEffect(() => {
    if (!socket) {
      console.log('❌ Socket not available')
      return
    }

    console.log('🔌 Socket available, connection status:', isConnected)

    // 确保Socket连接
    if (!isConnected) {
      console.log('🔄 Attempting to connect socket...')
      socket.connect()
    }

    // 等待连接建立后再加入房间
    const handleConnect = () => {
      console.log('✅ Socket connected, joining activity:', params.id)
      socket.emit('join-activity', params.id)
    }

    if (isConnected) {
      console.log('✅ Socket already connected, joining activity immediately')
      handleConnect()
    } else {
      console.log('⏳ Waiting for socket connection...')
      socket.on('connect', handleConnect)
    }

    // 监听活动更新
    socket.on('activity-updated', (data: Activity) => {
      setActivity(data)
    })

    // 监听会话状态更新
    socket.on('session-updated', (data: Session) => {
      console.log('📊 Session updated:', data)
      setSessionData(data)
      if (data.status === 'completed') {
        setShowResults(true)
      }
    })

    // 监听会话开始
    socket.on('session-started', (data: Session) => {
      setSessionData(data)
      toast.success('Activity started!')
    })

    // 监听会话结束
    socket.on('session-ended', (data: Session) => {
      setSessionData(data)
      setShowResults(true)
      toast.success('Activity completed!')
    })

    // 监听参与者数量
    socket.on('participant-count', (count: number) => {
      setParticipants(count)
    })

    // 监听响应接收确认
    socket.on('response-received', (data: any) => {
      toast.success('Response submitted successfully!')
      setIsSubmitted(true)
    })

    // 监听实时结果更新
    socket.on('results-updated', (data: any) => {
      setRealTimeResults(data.results || [])
      setShowRealTimeResults(true)
    })

    // 监听其他学生的响应
    socket.on('response-received', (data: any) => {
      if (data.participantId !== socket.id) {
        setRealTimeResults(prev => {
          const existing = prev.find(r => r.participantId === data.participantId)
          if (existing) {
            return prev.map(r => 
              r.participantId === data.participantId 
                ? { ...r, response: data.response, submittedAt: new Date() }
                : r
            )
          } else {
            return [...prev, {
              participantId: data.participantId,
              response: data.response,
              submittedAt: new Date()
            }]
          }
        })
      }
    })

    // 监听错误
    socket.on('error', (error: any) => {
      toast.error(error.message || 'An error occurred')
    })

    // 获取会话状态
    console.log('🔍 Requesting session status for activity:', params.id)
    socket.emit('get-session-status', params.id)

    // 设置连接超时
    const timeoutId = setTimeout(() => {
      if (!isConnected) {
        console.log('⏰ Connection timeout')
        setConnectionTimeout(true)
      }
    }, 10000) // 10秒超时

    return () => {
      clearTimeout(timeoutId)
      socket.emit('leave-activity', params.id)
      socket.off('connect', handleConnect)
      socket.off('activity-updated')
      socket.off('session-updated')
      socket.off('session-started')
      socket.off('session-ended')
      socket.off('participant-count')
      socket.off('response-received')
      socket.off('error')
    }
  }, [socket, isConnected, params.id])

  // 加载上次的答案到表单
  const loadPreviousAnswers = (responseData: any, activityData: Activity) => {
    if (!responseData) return

    if (activityData.type === 'quiz' && activityData.content.questions) {
      // Quiz: responseData is an object with questionId as keys
      const quizAnswers: any = {}
      activityData.content.questions.forEach((question) => {
        if (responseData[question.id]) {
          quizAnswers[question.id] = responseData[question.id]
        }
      })
      setResponse(quizAnswers)
    } else if (activityData.type === 'poll') {
      // Poll: can have answer or selectedOptions
      if (responseData.selectedOptions) {
        setResponse({
          answer: activityData.content.allowMultiple ? undefined : responseData.answer,
          selectedOptions: responseData.selectedOptions
        })
      } else if (responseData.answer) {
        setResponse({ answer: responseData.answer })
      }
    } else if (activityData.type === 'shortanswer' || activityData.type === 'wordcloud') {
      // Short answer / Word cloud: has text field
      if (responseData.text) {
        setResponse({ text: responseData.text })
      }
    }
  }

  // 获取活动数据
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/activities/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setActivity(data)
          
          // 如果允许多次参与，加载上次的答案
          if (data.settings.allowMultipleAttempts && session?.user?.id) {
            try {
              const prevResponse = await fetch(`/api/activities/${params.id}/my-response`)
              if (prevResponse.ok) {
                const prevData = await prevResponse.json()
                if (prevData.response) {
                  setPreviousResponse(prevData.response)
                  loadPreviousAnswers(prevData.response.responseData, data)
                }
              }
            } catch (error) {
              console.error('Failed to load previous response:', error)
            }
          }
        } else {
          toast.error('Failed to load activity')
          router.push('/student')
        }
      } catch (error) {
        toast.error('Failed to load activity')
        router.push('/student')
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivity()
  }, [params.id, router, session?.user?.id])

  // 倒计时功能
  useEffect(() => {
    if (!sessionData || !sessionData.startedAt || sessionData.status !== 'active') {
      setTimeRemaining(null)
      return
    }

    const startTime = new Date(sessionData.startedAt).getTime()
    const timeLimit = activity?.settings.timeLimit || activity?.content.timeLimit || 0
    
    if (timeLimit <= 0) {
      setTimeRemaining(null)
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      const remaining = Math.max(0, timeLimit - elapsed)
      
      setTimeRemaining(remaining)
      
      if (remaining === 0) {
        toast.error('Time is up!')
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [sessionData, activity])

  // 提交响应
  const submitResponse = async () => {
    if (!activity || isSubmitted) return

    // 先保存到数据库
    try {
      // 格式化响应数据
      let responseData: any = {}
      let calculatedScore: number | undefined = undefined

      if (activity.type === 'quiz') {
        // Quiz: response is an object with questionId as keys
        responseData = { ...response }
        
        // 计算分数
        const scoreResult = calculateQuizScore()
        calculatedScore = scoreResult.totalPoints > 0 
          ? Math.round((scoreResult.score / scoreResult.totalPoints) * 100)
          : 0
        
        toast.success(`提交成功！得分: ${scoreResult.score}/${scoreResult.totalPoints} (${calculatedScore}%)`)
      } else if (activity.type === 'poll') {
        // Poll: can have answer or selectedOptions
        if (response.selectedOptions) {
          responseData.selectedOptions = response.selectedOptions
        } else {
          responseData.answer = response.answer
        }
      } else if (activity.type === 'shortanswer' || activity.type === 'wordcloud') {
        // Short answer / Word cloud: has text field
        responseData.text = response.text || ''
      }

      // 保存到数据库
      const apiResponse = await fetch(`/api/activities/${params.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responseData,
          score: calculatedScore
        })
      })

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json()
        toast.error(errorData.error || '提交失败')
        return
      }

      // 如果socket可用，也通过socket发送（用于实时显示）
      if (socket) {
        const socketData = {
          activityId: params.id,
          response: {
            ...responseData,
            submittedAt: new Date(),
            studentId: session?.user?.id
          }
        }
        socket.emit('submit-response', socketData)
      }

      setIsSubmitted(true)
      if (activity.type !== 'quiz') {
        toast.success('答案已提交')
      }
    } catch (error) {
      console.error('Error submitting response:', error)
      toast.error('提交失败')
    }
  }

  // 处理选择题选择
  const handleOptionSelect = (questionId: string, option: string, isMultiple: boolean = false) => {
    console.log('🎯 Option selected:', { questionId, option, isMultiple, currentResponse: response })
    
    if (activity?.type === 'quiz') {
      // Quiz: store answer by questionId
      setResponse({
        ...response,
        [questionId]: option
      })
    } else if (activity?.type === 'poll') {
      // Poll: can be multiple choice
      if (isMultiple) {
        const currentOptions = (response.selectedOptions || []) as string[]
        const newOptions = currentOptions.includes(option)
          ? currentOptions.filter(opt => opt !== option)
          : [...currentOptions, option]
        
        setResponse({
          ...response,
          selectedOptions: newOptions
        })
      } else {
        setResponse({
          ...response,
          answer: option
        })
      }
    }
  }

  // 处理文本输入
  const handleTextInput = (questionId: string, text: string) => {
    if (activity?.type === 'quiz') {
      // Quiz: store text answer by questionId
      setResponse({
        ...response,
        [questionId]: text
      })
    } else {
      // Short answer / Word cloud: store in text field
      setResponse({
        ...response,
        text
      })
    }
  }

  // 计算 quiz 分数
  const calculateQuizScore = (): { score: number; totalPoints: number } => {
    if (!activity || activity.type !== 'quiz' || !activity.content.questions) {
      return { score: 0, totalPoints: 0 }
    }

    let totalPoints = 0
    let earnedPoints = 0

    activity.content.questions.forEach((question) => {
      totalPoints += question.points || 1
      
      const studentAnswer = response[question.id]
      const correctAnswer = question.correctAnswer

      if (!studentAnswer || !correctAnswer) {
        return // 没有答案或没有正确答案，不计分
      }

      // 比较答案（不区分大小写）
      // correctAnswer 在接口中定义为 string，所以这里只处理字符串类型
      if (typeof correctAnswer === 'string' && typeof studentAnswer === 'string') {
        // 单选题或 True/False
        if (studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
          earnedPoints += question.points || 1
        }
      }
    })

    return { score: earnedPoints, totalPoints }
  }

  // 检查按钮是否应该被禁用
  const isButtonDisabled = () => {
    if (!activity || !response) return true

    if (activity.type === 'quiz') {
      // Quiz: 检查是否有任何问题的答案
      const hasAnswer = Object.keys(response).some(key => {
        const answer = response[key]
        return answer && answer.trim() !== ''
      })
      return !hasAnswer
    } else if (activity.type === 'poll') {
      // Poll: 检查是否有answer或selectedOptions
      return !response.answer && (!response.selectedOptions || response.selectedOptions.length === 0)
    } else if (activity.type === 'shortanswer' || activity.type === 'wordcloud') {
      // Short answer / Word cloud: 检查是否有text
      return !response.text || response.text.trim() === ''
    }

    return true
  }

  // 保存答案到数据库（不提交）
  const saveResponse = async () => {
    if (!activity || !session?.user?.id) return

    try {
      setIsSaving(true)

      // 格式化响应数据
      let responseData: any = {}

      if (activity.type === 'quiz') {
        // Quiz: response is an object with questionId as keys
        responseData = { ...response }
      } else if (activity.type === 'poll') {
        // Poll: can have answer or selectedOptions
        if (response.selectedOptions) {
          responseData.selectedOptions = response.selectedOptions
        } else {
          responseData.answer = response.answer
        }
      } else if (activity.type === 'shortanswer' || activity.type === 'wordcloud') {
        // Short answer / Word cloud: has text field
        responseData.text = response.text || ''
      }

      const apiResponse = await fetch(`/api/activities/${params.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responseData,
          score: undefined,
          feedback: undefined
        })
      })

      if (apiResponse.ok) {
        toast.success('答案已保存')
      } else {
        const errorData = await apiResponse.json()
        toast.error(errorData.error || '保存失败')
      }
    } catch (error) {
      console.error('Error saving response:', error)
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading activity...</p>
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Activity not found</p>
          <Button onClick={() => router.push('/student')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // 检查活动是否已完成或处于草稿状态
  if (activity.status === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span>Activity Completed</span>
            </CardTitle>
            <CardDescription>
              This activity has been completed and is no longer available for participation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                You can view the results if you participated in this activity.
              </p>
              <div className="flex space-x-4 justify-center">
                <Button 
                  onClick={() => router.push(`/student/activities/${params.id}/results`)}
                  variant="default"
                >
                  View Results
                </Button>
                <Button 
                  onClick={() => router.push('/student/activities')}
                  variant="outline"
                >
                  Back to Activities
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 检查活动是否处于草稿状态
  if (activity.status === 'draft') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span>Activity Not Available</span>
            </CardTitle>
            <CardDescription>
              This activity is still in draft mode and is not available for participation yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Please wait for the instructor to activate this activity.
              </p>
              <Button 
                onClick={() => router.push('/student/activities')}
                variant="outline"
                className="w-full"
              >
                Back to Activities
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <span className="text-3xl">{getActivityIcon(activity.type)}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
                <p className="text-gray-600 capitalize">{activity.type} Activity</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {sessionData && (
                <Badge className={getStatusColor(sessionData.status)}>
                  {sessionData.status.toUpperCase()}
                </Badge>
              )}
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="h-5 w-5" />
                <span>{participants} participants</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        {!isConnected && !connectionTimeout && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-orange-800">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span>Connecting to activity...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Success */}
        {isConnected && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Connected to activity successfully!</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Timeout */}
        {connectionTimeout && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-red-800 mb-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium">Connection Failed</span>
                </div>
                <p className="text-red-700 mb-4">
                  Unable to connect to the activity server. Please check your internet connection and try again.
                </p>
                <Button 
                  onClick={() => {
                    setConnectionTimeout(false)
                    if (socket) {
                      socket.connect()
                    }
                  }}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Retry Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timer */}
        {timeRemaining !== null && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-red-800">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Time Remaining:</span>
                  <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
                </div>
                <Progress 
                  value={(timeRemaining / ((activity.settings.timeLimit || activity.content.timeLimit || 60) * 60)) * 100} 
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Activity Instructions</CardTitle>
            {activity.content.instructions && (
              <CardDescription>{activity.content.instructions}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {activity.type === 'poll' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {activity.content.instructions || 
                   (activity.content.questions && activity.content.questions.length > 0 ? activity.content.questions[0].text : 'Select your answer:')}
                </h3>
                <div className="space-y-2">
                  {/* Handle new poll structure (content.options) */}
                  {activity.content.options && activity.content.options.length > 0 ? (
                    activity.content.options.map((option, index) => (
                      <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type={activity.content.allowMultiple ? "checkbox" : "radio"}
                          name="poll-option"
                          value={option}
                          checked={
                            activity.content.allowMultiple 
                              ? (response.selectedOptions || []).includes(option)
                              : response.answer === option
                          }
                          onChange={() => handleOptionSelect('poll', option, activity.content.allowMultiple)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))
                  ) : (
                    /* Handle old poll structure (content.questions) */
                    activity.content.questions && activity.content.questions.length > 0 && activity.content.questions[0].options ? (
                      activity.content.questions[0].options.map((option, index) => (
                        <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type={activity.content.questions![0].type === 'multiple-choice' ? "checkbox" : "radio"}
                            name="poll-option"
                            value={option}
                            checked={
                              activity.content.questions![0].type === 'multiple-choice'
                                ? (response.selectedOptions || []).includes(option)
                                : response.answer === option
                            }
                            onChange={() => handleOptionSelect('poll', option, activity.content.questions![0].type === 'multiple-choice')}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>{option}</span>
                        </label>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No poll options available</p>
                        <div className="text-sm text-gray-400">
                          <p>Debug info:</p>
                          <p>Content options: {JSON.stringify(activity.content.options)}</p>
                          <p>Content questions: {JSON.stringify(activity.content.questions)}</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {activity.type === 'quiz' && activity.content.questions && (
              <div className="space-y-6">
                {activity.content.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">
                      {index + 1}. {question.text}
                    </h3>
                    <div className="space-y-2">
                      {question.options?.map((option, optIndex) => (
                        <label key={optIndex} className="flex items-center space-x-3 p-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type={question.type === 'multiple-choice' ? "radio" : "checkbox"}
                            name={`question-${question.id}`}
                            value={option}
                            checked={response[question.id] === option}
                            onChange={() => handleOptionSelect(question.id, option, question.type === 'multiple-choice')}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activity.type === 'shortanswer' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Your Response:</h3>
                <Textarea
                  placeholder="Enter your answer..."
                  value={response.text || ''}
                  onChange={(e) => setResponse({ ...response, text: e.target.value })}
                  rows={6}
                  className="w-full"
                />
              </div>
            )}

            {activity.type === 'wordcloud' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Enter words for the word cloud:</h3>
                <Input
                  placeholder="Type words separated by commas..."
                  value={response.text || ''}
                  onChange={(e) => setResponse({ ...response, text: e.target.value })}
                  className="w-full"
                />
                <p className="text-sm text-gray-600">
                  Example: "learning, fun, interactive, engaging"
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Previous Answer Notice */}
        {previousResponse && activity?.settings.allowMultipleAttempts && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-blue-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">已加载您上次的答案，可以修改后重新保存</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save and Submit Buttons - Show in all states (except submitted) */}
        {activity && !isSubmitted && (
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={saveResponse}
              variant="outline"
              size="lg"
              className="px-8"
              disabled={isSaving || isButtonDisabled()}
            >
              {isSaving ? '保存中...' : '保存答案'}
            </Button>
            <Button 
              onClick={submitResponse}
              size="lg"
              className="px-8"
              disabled={isButtonDisabled()}
            >
              <Send className="h-5 w-5 mr-2" />
              提交答案
            </Button>
          </div>
        )}

        {/* Submitted Status */}
        {isSubmitted && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Response submitted successfully!</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waiting for Activity to Start */}
        {sessionData?.status === 'waiting' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-yellow-800 mb-4">
                  <Play className="h-6 w-6" />
                  <span className="text-lg font-medium">Waiting for activity to start...</span>
                </div>
                <p className="text-yellow-700">
                  The instructor will start the activity soon. Please wait.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Paused */}
        {sessionData?.status === 'paused' && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-orange-800 mb-4">
                  <Pause className="h-6 w-6" />
                  <span className="text-lg font-medium">Activity is paused</span>
                </div>
                <p className="text-orange-700">
                  The instructor has paused the activity. Please wait for it to resume.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real-time Results */}
        {showRealTimeResults && realTimeResults.length > 0 && activity.settings.showResults && (
          <Card className="mb-6 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Live Results</span>
              </CardTitle>
              <CardDescription>
                Real-time responses from other participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {realTimeResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600">
                          {result.participantId === 'Anonymous' ? '?' : result.participantId.slice(-2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {result.participantId === 'Anonymous' ? 'Anonymous' : `Student ${result.participantId.slice(-4)}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(result.submittedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {typeof result.response === 'string' 
                          ? result.response 
                          : JSON.stringify(result.response)
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {showResults && sessionData?.status === 'completed' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Activity Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-blue-800 mb-4">
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-lg font-medium">Activity Completed!</span>
                </div>
                <p className="text-blue-700 mb-4">
                  Thank you for participating. Results will be available soon.
                </p>
                <div className="flex space-x-4 justify-center">
                  <Button onClick={() => router.push(`/student/activities/${params.id}/results`)} variant="outline">
                    View Detailed Results
                  </Button>
                  <Button onClick={() => router.push('/student')} variant="outline">
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
