import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateQuizFromPDF } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const topic = formData.get('topic') as string
    const numQuestions = parseInt(formData.get('numQuestions') as string) || 5

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      )
    }

    if (!topic) {
      return NextResponse.json(
        { message: 'Topic is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { message: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    // Validate file size (max 3MB)
    const maxSize = 3 * 1024 * 1024 // 3MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: '文件过大，请重新上传（文件大小不超过3MB）' },
        { status: 400 }
      )
    }

    const generatedQuiz = await generateQuizFromPDF(file, topic, numQuestions)

    return NextResponse.json(generatedQuiz)
  } catch (error) {
    console.error('PDF quiz generation error:', error)
    return NextResponse.json(
      { message: 'Failed to generate quiz from PDF' },
      { status: 500 }
    )
  }
}
