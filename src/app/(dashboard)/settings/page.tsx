'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { Home } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    institution: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    // Initialize form with session values when available
    setForm({
      name: session.user.name || '',
      email: session.user.email || '',
      institution: (session.user.institution as string) || 'PolyU'
    })
  }, [session, status, router])

  if (status === 'loading') {
    return null
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={session.user.role === 'student' ? '/student' : '/dashboard'}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  placeholder="Institution"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push('/dashboard')}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    try {
                      setIsLoading(true)
                      const res = await fetch('/api/user', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(form)
                      })
                      const data = await res.json()
                      if (!res.ok) {
                        throw new Error(data.message || 'Failed to save settings')
                      }
                      toast.success('Settings saved successfully')
                      // Update in-memory session so other pages (e.g., Dashboard header) reflect changes immediately
                      await update({
                        name: form.name,
                        email: form.email,
                        institution: form.institution
                      })
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


