import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Course from '@/models/Course'
import Activity from '@/models/Activity'
import ActivityResponse from '@/models/ActivityResponse'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Activity as ActivityIcon,
  BookOpen,
  LineChart,
  Users
} from 'lucide-react'

type RecentUser = {
  id: string
  name: string
  email: string
  role: string
  institution?: string
  createdAt: string
}

type RecentActivity = {
  id: string
  title: string
  type: string
  status: string
  createdAt: string
}

type AdminOverview = {
  stats: {
    totalUsers: number
    totalCourses: number
    totalActivities: number
    activeActivities: number
    totalResponses: number
  }
  roles: {
    admins: number
    teachers: number
    students: number
  }
  recentUsers: RecentUser[]
  recentActivities: RecentActivity[]
  refreshedAt: string
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-Hans', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

async function getAdminOverview(): Promise<AdminOverview> {
  await connectDB()

  const [
    totalUsers,
    admins,
    teachers,
    students,
    totalCourses,
    totalActivities,
    activeActivities,
    totalResponses,
    recentUsersRaw,
    recentActivitiesRaw
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ role: 'student' }),
    Course.countDocuments({}),
    Activity.countDocuments({}),
    Activity.countDocuments({ status: 'active' }),
    ActivityResponse.countDocuments({}),
    User.find({}, 'name email role institution createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Activity.find({}, 'title type status createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ])

  return {
    stats: {
      totalUsers,
      totalCourses,
      totalActivities,
      activeActivities,
      totalResponses
    },
    roles: {
      admins,
      teachers,
      students
    },
    recentUsers: recentUsersRaw.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      createdAt: new Date(user.createdAt).toISOString()
    })),
    recentActivities: recentActivitiesRaw.map((activity) => ({
      id: activity._id.toString(),
      title: activity.title,
      type: activity.type,
      status: activity.status,
      createdAt: new Date(activity.createdAt).toISOString()
    })),
    refreshedAt: new Date().toISOString()
  }
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  if (!session.user || session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const overview = await getAdminOverview()
  const statCards = [
    {
      label: '平台用户',
      value: overview.stats.totalUsers,
      subLabel: `${overview.roles.admins} 管理员 · ${overview.roles.teachers} 教师 · ${overview.roles.students} 学生`,
      icon: Users
    },
    {
      label: '课程总数',
      value: overview.stats.totalCourses,
      subLabel: '已创建并可分配的课程',
      icon: BookOpen
    },
    {
      label: '活动总数',
      value: overview.stats.totalActivities,
      subLabel: `${overview.stats.activeActivities} 个正在运行`,
      icon: ActivityIcon
    },
    {
      label: '互动提交',
      value: overview.stats.totalResponses,
      subLabel: '累计 ActivityResponses',
      icon: LineChart
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              最后同步 · {formatDateTime(overview.refreshedAt)}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">admin管理页面</h1>
            <p className="mt-1 text-base text-gray-600">
              欢迎回来，{session.user.name || '管理员'}。这里可以洞察全平台的运行情况。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="uppercase tracking-wide">
              Admin
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <div className="rounded-full bg-blue-50 p-2 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{card.value.toLocaleString('zh-Hans')}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{card.subLabel}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>最近注册用户</CardTitle>
            <CardDescription>最新 5 个账号及其角色</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.recentUsers.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                暂无用户数据
              </div>
            ) : (
              <div className="divide-y">
                {overview.recentUsers.map((user) => (
                  <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="capitalize">
                        {user.role}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(user.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>最新活动</CardTitle>
              <CardDescription>最近 5 个学习活动及其状态</CardDescription>
            </CardHeader>
            <CardContent>
              {overview.recentActivities.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  暂无活动数据
                </div>
              ) : (
                <div className="space-y-4">
                  {overview.recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          类型：{activity.type} · 发布于 {formatDateTime(activity.createdAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          activity.status === 'active'
                            ? 'default'
                            : activity.status === 'completed'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="capitalize"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>互动概览</CardTitle>
              <CardDescription>基于 ActivityResponse 的提交情况</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">累计提交</p>
                <p className="mt-2 text-2xl font-semibold">
                  {overview.stats.totalResponses.toLocaleString('zh-Hans')}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">正在运行的活动</p>
                <p className="mt-2 text-2xl font-semibold">
                  {overview.stats.activeActivities.toLocaleString('zh-Hans')}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">下一步推荐</p>
                <p className="mt-2 text-sm text-gray-600">
                  优先检查正在运行的活动，确保出题内容合规且反馈及时。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

