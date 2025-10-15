'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Users, 
  Plus, 
  Trash2, 
  Search, 
  User, 
  Mail, 
  GraduationCap,
  Upload,
  X,
  Save
} from 'lucide-react'
import { StudentImportDialog } from './student-import-dialog'

interface Student {
  _id: string
  name: string
  email: string
  studentId?: string
  institution?: string
}

interface StudentManagementProps {
  courseId: string
  students: Student[]
  onStudentAdded: (student: Student) => void
  onStudentRemoved: (studentId: string) => void
  onStudentsImported: () => void
}

export function StudentManagement({ 
  courseId, 
  students, 
  onStudentAdded, 
  onStudentRemoved, 
  onStudentsImported 
}: StudentManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    studentId: '',
    institution: 'PolyU'
  })
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleAddStudent = async () => {
    if (!newStudent.name.trim() || !newStudent.email.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setIsAdding(true)
      const response = await fetch(`/api/courses/${courseId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStudent)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add student')
      }

      const addedStudent = await response.json()
      onStudentAdded(addedStudent)
      
      // Reset form
      setNewStudent({
        name: '',
        email: '',
        studentId: '',
        institution: 'PolyU'
      })
      setIsAddDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add student')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the course?')) {
      return
    }

    try {
      setIsRemoving(studentId)
      const response = await fetch(`/api/courses/${courseId}/students/${studentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to remove student')
      }

      onStudentRemoved(studentId)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to remove student')
    } finally {
      setIsRemoving(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Students ({students.length})
            </CardTitle>
            <CardDescription>
              Manage students enrolled in this course
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <StudentImportDialog 
              courseId={courseId}
              onImportComplete={onStudentsImported}
            >
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </StudentImportDialog>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Add a single student to this course
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter student name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter student email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      value={newStudent.studentId}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, studentId: e.target.value }))}
                      placeholder="Enter student ID (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="institution">Institution</Label>
                    <Input
                      id="institution"
                      value={newStudent.institution}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, institution: e.target.value }))}
                      placeholder="Enter institution"
                    />
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      onClick={handleAddStudent} 
                      disabled={isAdding}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isAdding ? 'Adding...' : 'Add Student'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                      disabled={isAdding}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Students List */}
        {filteredStudents.length > 0 ? (
          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <div key={student._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {student.email}
                      </div>
                      {student.studentId && (
                        <>
                          <span>•</span>
                          <div className="flex items-center">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {student.studentId}
                          </div>
                        </>
                      )}
                    </div>
                    {student.institution && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {student.institution}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemoveStudent(student._id)}
                  disabled={isRemoving === student._id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No students found' : 'No students enrolled'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Add students to this course to get started'
              }
            </p>
            {!searchTerm && (
              <div className="flex space-x-2 justify-center">
                <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
                <StudentImportDialog 
                  courseId={courseId}
                  onImportComplete={onStudentsImported}
                >
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Students
                  </Button>
                </StudentImportDialog>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
