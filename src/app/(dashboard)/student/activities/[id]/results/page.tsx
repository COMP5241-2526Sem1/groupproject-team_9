'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useSocket } from '@/components/socket-provider'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeft,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  Award,
  TrendingUp,
  Target,
  MessageSquare,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'

interface Activity {
  _id: string
  title: string
  type: 'poll' | 'quiz' | 'wordcloud' | 'shortanswer' | 'minigame'
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
  }
  settings: {
    isAnonymous: boolean
    showResults: boolean
    timeLimit?: number
  }
  status: 'draft' | 'active' | 'completed'
}

interface ActivityResponse {
  _id: string
  activityId: string
  studentId: string
  responseData: any
  submittedAt: string
  score?: number
  feedback?: string
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

interface ResultData {
  participantId: string
  response: any
  submittedAt: Date
}

export default function StudentActivityResultsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()
  
  const [activity, setActivity] = useState<Activity | null>(null)
  const [sessionData, setSessionData] = useState<Session | null>(null)
  const [myResponse, setMyResponse] = useState<ActivityResponse | null>(null)
  const [allResponses, setAllResponses] = useState<ActivityResponse[]>([])
  const [realTimeResults, setRealTimeResults] = useState<ResultData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showRealTimeResults, setShowRealTimeResults] = useState(false)

  // 获取活动数据
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/activities/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setActivity(data)
        } else {
          toast.error('Failed to load activity')
          router.push('/student/activities')
        }
      } catch (error) {
        toast.error('Failed to load activity')
        router.push('/student/activities')
      }
    }

    fetchActivity()
  }, [params.id, router])

  // 获取学生响应数据
  useEffect(() => {
    const fetchResponses = async () => {
      if (!session?.user?.id) return

      try {
        const response = await fetch(`/api/activities/${params.id}/responses`)
        if (response.ok) {
          const data = await response.json()
          setAllResponses(data)
          
          // 找到当前学生的响应
          const myResp = data.find((resp: ActivityResponse) => 
            resp.studentId === session.user.id
          )
          setMyResponse(myResp)
        }
      } catch (error) {
        console.error('Failed to fetch responses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResponses()
  }, [params.id, session?.user?.id])

  // Socket连接和实时结果
  useEffect(() => {
    if (!socket || !isConnected || !activity) return

    // 加入活动房间
    socket.emit('join-activity', params.id)

    // 监听会话状态更新
    socket.on('session-updated', (data: Session) => {
      setSessionData(data)
    })

    // 监听实时结果更新
    socket.on('results-updated', (data: any) => {
      setRealTimeResults(data.results || [])
      setShowRealTimeResults(true)
    })

    // 监听响应接收
    socket.on('response-received', (data: any) => {
      // 更新实时结果
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
    })

    // 请求实时结果
    if (activity.settings.showResults) {
      socket.emit('request-results', params.id)
    }

    return () => {
      socket.emit('leave-activity', params.id)
      socket.off('session-updated')
      socket.off('results-updated')
      socket.off('response-received')
    }
  }, [socket, isConnected, params.id, activity])

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
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 计算统计信息
  const getStatistics = () => {
    if (!allResponses.length) return null

    const totalResponses = allResponses.length
    const myScore = myResponse?.score || 0
    const averageScore = allResponses.reduce((sum, resp) => sum + (resp.score || 0), 0) / totalResponses
    const highestScore = Math.max(...allResponses.map(resp => resp.score || 0))
    const myRank = allResponses
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .findIndex(resp => resp.studentId === session?.user?.id) + 1

    return {
      totalResponses,
      myScore,
      averageScore: Math.round(averageScore),
      highestScore,
      myRank
    }
  }

  // 分析投票结果
  const analyzePollResults = () => {
    if (activity?.type !== 'poll' || !allResponses.length) return null

    const optionCounts: { [key: string]: number } = {}
    const totalResponses = allResponses.length

    allResponses.forEach(response => {
      const answer = response.responseData?.answer || response.responseData?.selectedOptions
      if (Array.isArray(answer)) {
        answer.forEach(option => {
          optionCounts[option] = (optionCounts[option] || 0) + 1
        })
      } else if (answer) {
        optionCounts[answer] = (optionCounts[answer] || 0) + 1
      }
    })

    return Object.entries(optionCounts).map(([option, count]) => ({
      option,
      count,
      percentage: Math.round((count / totalResponses) * 100)
    }))
  }

  // 分析词云结果
  const analyzeWordCloudResults = () => {
    if (activity?.type !== 'wordcloud' || !allResponses.length) return null

    const wordCounts: { [key: string]: number } = {}
    
    allResponses.forEach(response => {
      const text = response.responseData?.text || ''
      const words = text.toLowerCase()
        .split(/[,\s]+/)
        .filter((word: string) => word.length > 2)
      
      words.forEach((word: string) => {
        wordCounts[word] = (wordCounts[word] || 0) + 1
      })
    })

    return Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }))
  }

  const statistics = getStatistics()
  const pollResults = analyzePollResults()
  const wordCloudResults = analyzeWordCloudResults()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Activity not found</p>
          <Button onClick={() => router.push('/student/activities')} className="mt-4">
            Back to Activities
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/student/activities">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <span className="text-3xl">{getActivityIcon(activity.type)}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
                <p className="text-gray-600">Activity Results</p>
              </div>
            </div>
            {sessionData && (
              <Badge className={getStatusColor(sessionData.status)}>
                {sessionData.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* My Response */}
        {myResponse && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Your Response</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Submitted:</span>
                  <span className="font-medium">
                    {new Date(myResponse.submittedAt).toLocaleString()}
                  </span>
                </div>
                
                {myResponse.score !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Score:</span>
                    <span className="font-bold text-green-600">{myResponse.score}%</span>
                  </div>
                )}

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Your Answer:</h4>
                  <div className="bg-white p-4 rounded-lg border">
                    {activity.type === 'poll' && (
                      <p>{myResponse.responseData?.answer || myResponse.responseData?.selectedOptions?.join(', ')}</p>
                    )}
                    {activity.type === 'quiz' && (
                      <div className="space-y-2">
                        {Object.entries(myResponse.responseData || {}).map(([questionId, answer]) => (
                          <div key={questionId}>
                            <span className="font-medium">Q{questionId}:</span> {String(answer)}
                          </div>
                        ))}
                      </div>
                    )}
                    {activity.type === 'shortanswer' && (
                      <p>{myResponse.responseData?.text}</p>
                    )}
                    {activity.type === 'wordcloud' && (
                      <p>{myResponse.responseData?.text}</p>
                    )}
                  </div>
                </div>

                {myResponse.feedback && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Feedback:</h4>
                    <div className="bg-white p-4 rounded-lg border">
                      <p>{myResponse.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Responses</p>
                    <p className="text-2xl font-bold">{statistics.totalResponses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Your Score</p>
                    <p className="text-2xl font-bold">{statistics.myScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold">{statistics.averageScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Your Rank</p>
                    <p className="text-2xl font-bold">#{statistics.myRank}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Poll Results */}
        {pollResults && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Poll Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pollResults.map((result, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.option}</span>
                      <span className="text-sm text-gray-600">
                        {result.count} votes ({result.percentage}%)
                      </span>
                    </div>
                    <Progress value={result.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Word Cloud Results */}
        {wordCloudResults && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Word Cloud</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {wordCloudResults.map((result, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className="text-sm"
                    style={{ 
                      fontSize: `${Math.min(16 + result.count * 2, 24)}px`,
                      opacity: Math.min(0.5 + result.count * 0.1, 1)
                    }}
                  >
                    {result.word} ({result.count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real-time Results */}
        {showRealTimeResults && realTimeResults.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Real-time Results</span>
              </CardTitle>
              <CardDescription>
                Live updates from other participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {realTimeResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
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

        {/* All Responses (if not anonymous) */}
        {!activity.settings.isAnonymous && allResponses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>All Responses</CardTitle>
              <CardDescription>
                Complete list of all participant responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allResponses.map((response, index) => (
                  <div key={response._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Response #{index + 1}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {new Date(response.submittedAt).toLocaleString()}
                        </span>
                        {response.score !== undefined && (
                          <Badge variant="outline">{response.score}%</Badge>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(response.responseData, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
