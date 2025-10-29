# PDF Quiz Generation Feature

This feature allows teachers to upload PDF documents and automatically generate multiple-choice quiz questions using OpenRouter's multimodal AI capabilities.

## Setup

### 1. Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Get OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Go to your API keys section
4. Create a new API key
5. Add it to your environment variables

## Features

### PDF Upload
- Supports PDF files up to 10MB
- Drag and drop or click to upload
- File validation and error handling
- Visual feedback during upload

### AI Quiz Generation
- Uses OpenRouter's multimodal capabilities
- Processes PDF content using the "pdf-text" plugin
- Generates multiple-choice questions with 4 options each
- Includes correct answers and explanations
- Configurable number of questions (1-20)

### Integration
- Seamlessly integrates with existing quiz creation workflow
- Generated questions are added to the existing question list
- Auto-populates quiz title and description from PDF content
- Maintains all existing quiz functionality

## Usage

1. **Create a New Quiz Activity**
   - Navigate to Activities → Create Activity
   - Select "Quiz" as the activity type

2. **Upload PDF Document**
   - Scroll to the "Generate Quiz from PDF" section
   - Upload your PDF file by dragging and dropping or clicking to browse
   - Enter a topic for the quiz
   - Specify the number of questions (default: 5)

3. **Generate Questions**
   - Click "Generate Quiz from PDF"
   - Wait for the AI to process the document and generate questions
   - Generated questions will appear in the Questions section below

4. **Review and Edit**
   - Review the generated questions
   - Edit questions, options, or answers as needed
   - Add additional questions manually if desired
   - Save the quiz when ready

## Technical Details

### API Endpoint
- **POST** `/api/ai/generate-from-pdf`
- Accepts FormData with file, topic, and numQuestions
- Returns generated quiz data in JSON format

### AI Model
- Uses `anthropic/claude-3.5-sonnet` via OpenRouter
- Optimized for educational content generation
- Temperature: 0.7 for balanced creativity and accuracy

### File Processing
- PDF files are converted to base64 for API transmission
- Uses OpenRouter's "pdf-text" plugin for text extraction
- Supports both text-based and scanned PDFs

## Error Handling

The system includes comprehensive error handling for:
- Invalid file types (only PDF allowed)
- File size limits (10MB maximum)
- API errors and timeouts
- Malformed responses from AI
- Network connectivity issues

## Cost Considerations

- OpenRouter charges based on model usage
- PDF processing may incur additional costs
- Consider the document size and number of questions when generating quizzes
- Monitor your OpenRouter usage in their dashboard

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**
   - Ensure you're logged in as a teacher
   - Check that your session is valid

2. **"File size must be less than 10MB"**
   - Compress your PDF or split it into smaller sections
   - Use online PDF compressors if needed

3. **"Failed to generate quiz from PDF"**
   - Check your OpenRouter API key
   - Ensure you have sufficient credits
   - Try with a different PDF file

4. **Generated questions seem irrelevant**
   - Provide a more specific topic
   - Ensure the PDF contains relevant content
   - Try adjusting the number of questions

### Support

For technical issues or feature requests, please contact the development team or create an issue in the project repository.
