'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy, Medal, Award, TrendingUp, Users, Star, LogOut } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  name: string
  score: number
  activitiesCompleted: number
  streak: number
  avatar?: string
  isCurrentUser?: boolean
}

export default function LeaderboardPage() {
  const [timeRange, setTimeRange] = useState('all')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState(0)

  // Mock data for demonstration
  const mockLeaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'Alice Chen', score: 98, activitiesCompleted: 15, streak: 12, isCurrentUser: false },
    { rank: 2, name: 'Bob Wong', score: 95, activitiesCompleted: 14, streak: 10, isCurrentUser: false },
    { rank: 3, name: 'You', score: 92, activitiesCompleted: 13, streak: 8, isCurrentUser: true },
    { rank: 4, name: 'Carol Lee', score: 89, activitiesCompleted: 12, streak: 7, isCurrentUser: false },
    { rank: 5, name: 'David Liu', score: 87, activitiesCompleted: 11, streak: 6, isCurrentUser: false },
    { rank: 6, name: 'Eva Zhang', score: 85, activitiesCompleted: 10, streak: 5, isCurrentUser: false },
    { rank: 7, name: 'Frank Wang', score: 83, activitiesCompleted: 9, streak: 4, isCurrentUser: false },
    { rank: 8, name: 'Grace Ho', score: 81, activitiesCompleted: 8, streak: 3, isCurrentUser: false },
    { rank: 9, name: 'Henry Kim', score: 79, activitiesCompleted: 7, streak: 2, isCurrentUser: false },
    { rank: 10, name: 'Ivy Tan', score: 77, activitiesCompleted: 6, streak: 1, isCurrentUser: false }
  ]

  useEffect(() => {
    setLeaderboard(mockLeaderboard)
    setCurrentUserRank(3)
  }, [timeRange])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 10) return 'text-orange-600'
    if (streak >= 5) return 'text-blue-600'
    return 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
              <p className="text-gray-600">See how you rank among your classmates</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top 3 Podium */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Top Performers</h2>
          <div className="flex justify-center items-end space-x-4">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-6 mb-4">
                  <Medal className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2"></div>
                  <h3 className="font-bold text-lg">{leaderboard[1].name}</h3>
                  <p className="text-gray-600">{leaderboard[1].score}%</p>
                </div>
                <Badge variant="secondary">#2</Badge>
              </div>
            )}

            {/* 1st Place */}
            {leaderboard[0] && (
              <div className="text-center">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-4">
                  <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                  <div className="w-20 h-20 bg-yellow-200 rounded-full mx-auto mb-2"></div>
                  <h3 className="font-bold text-xl">{leaderboard[0].name}</h3>
                  <p className="text-gray-600 text-lg">{leaderboard[0].score}%</p>
                </div>
                <Badge className="bg-yellow-500 text-white">#1</Badge>
              </div>
            )}

            {/* 3rd Place */}
            {leaderboard[2] && (
              <div className="text-center">
                <div className="bg-amber-50 rounded-lg p-6 mb-4">
                  <Award className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <div className="w-16 h-16 bg-amber-200 rounded-full mx-auto mb-2"></div>
                  <h3 className="font-bold text-lg">{leaderboard[2].name}</h3>
                  <p className="text-gray-600">{leaderboard[2].score}%</p>
                </div>
                <Badge variant="secondary">#3</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Full Leaderboard</CardTitle>
            <CardDescription>
              Complete ranking of all students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    entry.isCurrentUser 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                      <div>
                        <h4 className={`font-medium ${entry.isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}>
                          {entry.name}
                          {entry.isCurrentUser && <span className="ml-2 text-blue-600">(You)</span>}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{entry.activitiesCompleted} activities</span>
                          <div className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            <span className={getStreakColor(entry.streak)}>{entry.streak} day streak</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(entry.score)}`}>
                      {entry.score}%
                    </div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Your Performance */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Performance</CardTitle>
            <CardDescription>
              How you're doing compared to your classmates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">#{currentUserRank}</div>
                <div className="text-gray-600">Current Rank</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">92%</div>
                <div className="text-gray-600">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">8</div>
                <div className="text-gray-600">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
