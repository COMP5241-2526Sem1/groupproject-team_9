'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Filter, Play, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Activity {
  _id: string
  title: string
  type: string
  status: string
  courseId: {
    title: string
    code: string
  }
  createdAt: string
  participants?: number
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for demonstration
  const mockActivities: Activity[] = [
    {
      _id: '1',
      title: 'Week 1 Software Engineering Quiz',
      type: 'quiz',
      status: 'active',
      courseId: { title: 'Software Engineering', code: 'COMP 5241' },
      createdAt: '2024-01-15',
      participants: 45
    },
    {
      _id: '2',
      title: 'Requirements Gathering Poll',
      type: 'poll',
      status: 'completed',
      courseId: { title: 'Software Engineering', code: 'COMP 5241' },
      createdAt: '2024-01-14',
      participants: 42
    },
    {
      _id: '3',
      title: 'Database Concepts Word Cloud',
      type: 'wordcloud',
      status: 'draft',
      courseId: { title: 'Database Systems', code: 'COMP 5242' },
      createdAt: '2024-01-13',
      participants: 0
    },
    {
      _id: '4',
      title: 'SQL Practice Mini Game',
      type: 'minigame',
      status: 'active',
      courseId: { title: 'Database Systems', code: 'COMP 5242' },
      createdAt: '2024-01-12',
      participants: 38
    }
  ]

  useEffect(() => {
    setActivities(mockActivities)
    setFilteredActivities(mockActivities)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let filtered = activities

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.courseId.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(activity => activity.status === statusFilter)
    }

    setFilteredActivities(filtered)
  }, [activities, searchTerm, typeFilter, statusFilter])

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'text-blue-600'
      case 'poll': return 'text-green-600'
      case 'wordcloud': return 'text-purple-600'
      case 'shortanswer': return 'text-orange-600'
      case 'minigame': return 'text-pink-600'
      default: return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
              <p className="text-gray-600">Manage and participate in learning activities</p>
            </div>
            <Button asChild>
              <Link href="/activities/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Activity
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => (
            <Card key={activity._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                    <div>
                      <CardTitle className="text-lg">{activity.title}</CardTitle>
                      <CardDescription className="capitalize">
                        {activity.type} • {activity.courseId.code}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(activity.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-medium">{activity.courseId.title}</span>
                  </div>
                  
                  {activity.participants !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Participants:</span>
                      <span className="font-medium">{activity.participants}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex space-x-2">
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
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/activities/${activity._id}/edit`}>
                        <Edit className="h-3 w-3" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first activity to get started'
              }
            </p>
            <Button asChild>
              <Link href="/activities/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Activity
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
