'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { FileUpload } from './ui/file-upload'
import { Badge } from './ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog'
import { 
  Upload, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  FileText
} from 'lucide-react'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
  students: Array<{
    name: string
    email: string
    studentId?: string
    institution?: string
  }>
}

interface StudentImportDialogProps {
  courseId: string
  onImportComplete?: (result: ImportResult) => void
  children?: React.ReactNode
}

export function StudentImportDialog({ 
  courseId, 
  onImportComplete,
  children 
}: StudentImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setImportResult(null)
    setError(null)
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setImportResult(null)
    setError(null)
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`/api/courses/${courseId}/import-students`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Import failed')
      }

      setImportResult(data.result)
      onImportComplete?.(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedFile(null)
    setImportResult(null)
    setError(null)
  }

  const downloadTemplate = () => {
    const csvContent = 'name,email,studentId,institution\nJohn Doe,john.doe@example.com,123456,PolyU\nJane Smith,jane.smith@example.com,789012,PolyU'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Students
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import students into this course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Download our template to see the required format for student data.
              </p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <FileUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={selectedFile}
            maxSize={10}
          />

          {/* Import Button */}
          {selectedFile && !importResult && (
            <div className="flex justify-end">
              <Button 
                onClick={handleImport} 
                disabled={isUploading}
                className="min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Students
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center text-red-600">
                  <XCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Import Failed</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Import Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {importResult.success}
                      </div>
                      <div className="text-sm text-gray-600">Successfully Added</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <XCircle className="h-8 w-8 text-red-500" />
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {importResult.failed}
                      </div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {importResult.students.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Students</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Successfully Added Students */}
              {importResult.students.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Successfully Added Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {importResult.students.map((student, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <div>
                            <div className="font-medium text-sm">{student.name}</div>
                            <div className="text-xs text-gray-600">{student.email}</div>
                            {student.studentId && (
                              <div className="text-xs text-gray-500">ID: {student.studentId}</div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            Added
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                      Errors ({importResult.errors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="p-2 bg-red-50 rounded text-sm text-red-600">
                          {error}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Close Button */}
              <div className="flex justify-end">
                <Button onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
