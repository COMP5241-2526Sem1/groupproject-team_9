'use client'

import { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface PDFUploadProps {
  onQuizGenerated: (quizData: any) => void
  className?: string
}

export function PDFUpload({ onQuizGenerated, className = '' }: PDFUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Please upload PDF files only'
    }

    // Check file size (max 3MB)
    const maxSize = 3 * 1024 * 1024 // 3MB
    if (file.size > maxSize) {
      return '文件过大，请重新上传（文件大小不超过3MB）'
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemoveFile = () => {
    setError(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleGenerateQuiz = async () => {
    if (!selectedFile || !topic.trim()) {
      toast.error('Please select a PDF file and enter a topic')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('topic', topic.trim())
      formData.append('numQuestions', numQuestions.toString())

      const response = await fetch('/api/ai/generate-from-pdf', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate quiz')
      }

      const quizData = await response.json()
      onQuizGenerated(quizData)
      toast.success('Quiz generated successfully!')
    } catch (error: any) {
      console.error('Quiz generation error:', error)
      setError(error.message || 'Failed to generate quiz')
      toast.error(error.message || 'Failed to generate quiz')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={className}>
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : selectedFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6">
          {selectedFile ? (
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <div className="flex items-center justify-center mb-2">
                <File className="h-5 w-5 text-gray-500 mr-2" />
                <span className="font-medium text-gray-900">{selectedFile.name}</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                className="text-red-600 hover:text-red-700 mb-4"
              >
                <X className="h-4 w-4 mr-2" />
                Remove File
              </Button>
              
              {/* Quiz generation form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="topic">Quiz Topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter the main topic for the quiz"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="numQuestions">Number of Questions</Label>
                  <Input
                    id="numQuestions"
                    type="number"
                    min="1"
                    max="20"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                    className="mt-1"
                  />
                </div>
                
                <Button
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    'Generate Quiz from PDF'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Upload className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload PDF Document
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop your PDF file here, or click to browse
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Supports PDF files (max 3MB)
              </p>
              <Button onClick={handleClick} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Choose PDF File
              </Button>
            </div>
          )}
          
          {error && (
            <div className="mt-4 flex items-center justify-center text-red-600">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
}
