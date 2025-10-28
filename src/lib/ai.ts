import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateActivityFromContent(content: string, activityType: string, topic: string) {
  try {
    const prompt = `Based on the following teaching content, generate a ${activityType} activity about "${topic}".

Teaching Content:
${content}

Please generate:
1. A clear activity title
2. Instructions for students
3. ${activityType === 'quiz' ? '5 multiple choice questions with 4 options each and correct answers' : 
    activityType === 'poll' ? '3 poll questions with multiple options' :
    activityType === 'wordcloud' ? 'A prompt for students to generate words related to the topic' :
    activityType === 'shortanswer' ? '3 open-ended questions for students to answer' :
    'A mini-game concept related to the topic'}

Format the response as JSON with the following structure:
{
  "title": "Activity Title",
  "instructions": "Clear instructions for students",
  "questions": [
    {
      "text": "Question text",
      "type": "multiple-choice",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option 1",
      "points": 1
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Generate engaging, educational activities that help students learn effectively."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from AI')
    }

    return JSON.parse(response)
  } catch (error) {
    console.error('AI generation error:', error)
    throw new Error('Failed to generate activity content')
  }
}

export async function analyzeStudentResponses(responses: string[], activityType: string) {
  try {
    const prompt = `Analyze the following student responses for a ${activityType} activity:

Responses: ${JSON.stringify(responses)}

Please provide:
1. Common themes or patterns
2. Most frequent answers
3. Key insights about student understanding
4. Suggestions for improvement

Format as JSON:
{
  "themes": ["theme1", "theme2"],
  "frequentAnswers": ["answer1", "answer2"],
  "insights": "Key insights about student understanding",
  "suggestions": "Suggestions for improvement"
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert educational analyst. Analyze student responses to provide insights for teachers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from AI')
    }

    return JSON.parse(response)
  } catch (error) {
    console.error('AI analysis error:', error)
    throw new Error('Failed to analyze student responses')
  }
}

export async function generateWordCloudData(responses: string[]) {
  try {
    const prompt = `Analyze the following student responses and extract key words/phrases for a word cloud:

Responses: ${JSON.stringify(responses)}

Extract the most important and frequent words/phrases. Return as JSON:
{
  "words": [
    {"word": "concept1", "count": 5},
    {"word": "concept2", "count": 3}
  ]
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting key concepts from text. Focus on educational terms and concepts."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from AI')
    }

    return JSON.parse(response)
  } catch (error) {
    console.error('AI word cloud error:', error)
    throw new Error('Failed to generate word cloud data')
  }
}

export async function generateQuizFromPDF(pdfFile: File, topic: string, numQuestions: number = 5) {
  try {
    // Convert file to base64
    const arrayBuffer = await pdfFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = pdfFile.type

    const prompt = `Based on the provided PDF document, generate ${numQuestions} multiple-choice quiz questions about "${topic}".

Please create questions that:
1. Test understanding of key concepts from the document
2. Have 4 options each (A, B, C, D)
3. Include one correct answer and three plausible distractors
4. Cover different difficulty levels
5. Are clear and unambiguous

Format the response as JSON with the following structure:
{
  "title": "Quiz Title based on the document content",
  "description": "Brief description of what this quiz covers",
  "questions": [
    {
      "text": "Question text here",
      "type": "multiple-choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "points": 1,
      "explanation": "Brief explanation of why this is the correct answer"
    }
  ]
}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Quiz Generator'
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert educational content creator. Generate high-quality quiz questions based on document content that test student understanding effectively."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "file",
                file: {
                  filename: pdfFile.name,
                  file_data: `data:${mimeType};base64,${base64}`
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        plugins: ["pdf-text"] // Use PDF text extraction plugin
      })
    })

    if (!response.ok) {
      console.error('OpenRouter API error:', response)
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('PDF quiz generation error:', error)
    throw new Error('Failed to generate quiz from PDF')
  }
}
