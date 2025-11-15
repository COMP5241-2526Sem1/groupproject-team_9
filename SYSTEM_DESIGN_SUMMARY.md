# System Design Summary - Interactive Learning Platform

## 1. System Overview

The Interactive Learning Platform is a comprehensive web-based system designed for Hong Kong university lecturers to create, generate, deliver, and manage interactive learning activities for both in-class and remote learning scenarios. The system supports multi-role access (Teachers, Students, Admins) with real-time collaboration features and AI-powered content generation.

## 2. Architecture

### 2.1 Technology Stack

#### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Real-time**: Socket.io Client
- **Charts**: Recharts for analytics visualization
- **UI Components**: Radix UI primitives

#### Backend
- **API**: Next.js API Routes (RESTful)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with JWT strategy
- **Real-time Server**: Express.js with Socket.io (separate server on port 3001)
- **AI Integration**: OpenAI API (GPT-3.5-turbo) and OpenRouter (Gemini 2.5 Pro for PDF processing)
- **File Processing**: Multer for file uploads, XLSX/CSV parsers

#### Infrastructure
- **Hosting**: Vercel (Next.js app)
- **Database**: MongoDB Atlas
- **Real-time Server**: Separate deployment (Railway/Heroku/Vercel Serverless)
- **CDN**: Vercel Edge Network

### 2.2 System Architecture Pattern

The system follows a **hybrid architecture**:
- **Monolithic Frontend**: Next.js app with integrated API routes
- **Microservice for Real-time**: Separate Socket.io server for real-time features
- **Serverless Functions**: Next.js API routes deployed as serverless functions on Vercel

## 3. Database Schema

### 3.1 Core Entities

#### User Model
```typescript
{
  email: string (unique, indexed)
  name: string
  role: 'teacher' | 'student' | 'admin'
  institution: string (default: 'PolyU')
  studentId?: string (unique, sparse index)
  avatar?: string
  password?: string (required for non-students)
  createdAt, updatedAt: Date
}
```

#### Course Model
```typescript
{
  title: string
  description: string
  code: string (unique)
  instructorId: ObjectId (ref: User, indexed)
  studentIds: ObjectId[] (ref: User, indexed)
  createdAt, updatedAt: Date
}
```

#### Activity Model
```typescript
{
  courseId: ObjectId (ref: Course, indexed)
  type: 'poll' | 'quiz' | 'wordcloud' | 'shortanswer' | 'minigame'
  title: string
  content: {
    questions?: Question[]
    options?: string[]
    instructions?: string
    timeLimit?: number
    allowMultiple?: boolean
    wordCloudSettings?: {...}
    gameSettings?: {...}
  }
  settings: {
    isAnonymous: boolean
    showResults: boolean
    allowMultipleAttempts: boolean
    shuffleQuestions: boolean
    timeLimit?: number
    dueDate?: Date
  }
  status: 'draft' | 'active' | 'completed' (indexed)
  createdAt, updatedAt: Date
}
```

#### ActivityResponse Model
```typescript
{
  activityId: ObjectId (ref: Activity, indexed)
  studentId: ObjectId (ref: User, indexed)
  responseData: any (Mixed type)
  submittedAt: Date
  score?: number
  feedback?: string
  createdAt, updatedAt: Date
}
// Unique index on (activityId, studentId)
```

#### Session Model
```typescript
{
  courseId: ObjectId (ref: Course, indexed)
  activityId: ObjectId (ref: Activity, indexed)
  status: 'waiting' | 'active' | 'paused' | 'completed' (indexed)
  startedAt: Date
  endedAt?: Date
  participants: ObjectId[] (ref: User)
  results?: any (Mixed type)
  createdAt, updatedAt: Date
}
```

### 3.2 Database Design Principles
- **Indexing**: Strategic indexes on frequently queried fields (role, courseId, activityId, studentId, status)
- **Relationships**: References using ObjectId with Mongoose population
- **Data Integrity**: Unique constraints on email, studentId, course code
- **Timestamps**: Automatic createdAt/updatedAt tracking

## 4. API Architecture

### 4.1 API Route Structure

```
/api/
├── auth/
│   ├── [...nextauth]/     # NextAuth.js authentication
│   └── register/          # User registration
├── courses/
│   ├── route.ts           # GET (list), POST (create)
│   ├── [id]/
│   │   ├── route.ts       # GET, PUT, DELETE
│   │   ├── enroll/        # POST enrollment
│   │   ├── import-students/ # POST CSV import
│   │   └── students/       # GET list, [studentId] operations
├── activities/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts       # GET, PUT, DELETE
│       ├── responses/     # GET all responses
│       └── my-response/   # GET/POST student's response
├── ai/
│   ├── generate-activity/ # POST - Generate from content
│   └── generate-from-pdf/ # POST - Generate quiz from PDF
├── analytics/
│   └── route.ts           # GET analytics data
├── dashboard/
│   └── route.ts           # GET dashboard data
└── student/
    └── dashboard/
        └── route.ts       # GET student dashboard
```

### 4.2 Authentication & Authorization

- **Strategy**: NextAuth.js with Credentials Provider
- **Session**: JWT-based sessions
- **Password Hashing**: bcryptjs
- **Role-Based Access Control**: 
  - Teachers: Full course/activity management
  - Students: Participation and viewing own data
  - Admins: System-wide access
- **Route Protection**: Server-side session checks in dashboard layout

## 5. Real-time Communication

### 5.1 Socket.io Server Architecture

**Separate Express Server** (`server.js` on port 3001):
- **Connection Management**: Tracks active connections and activity rooms
- **Room System**: Activity-based rooms (`activity-${activityId}`)
- **Session Management**: In-memory session storage with Map data structures

### 5.2 Real-time Events

#### Client → Server
- `join-activity`: Join an activity room
- `leave-activity`: Leave an activity room
- `join-as-student`: Student-specific join with studentId
- `start-session`: Instructor starts a live session
- `pause-session`: Pause an active session
- `end-session`: End a session
- `submit-response`: Submit student response
- `get-session-status`: Request current session status
- `request-results`: Request real-time results

#### Server → Client
- `participant-count`: Broadcast participant count updates
- `session-started`: Notify session start
- `session-updated`: Broadcast session state changes
- `session-ended`: Notify session end
- `response-received`: Confirm response submission
- `results-updated`: Broadcast aggregated results

### 5.3 Real-time Features
- Live participant tracking
- Real-time response collection
- Instant result broadcasting
- Session state synchronization
- Connection/disconnection handling

## 6. AI Integration

### 6.1 AI Services

#### OpenAI Integration (`lib/ai.ts`)
- **Model**: GPT-3.5-turbo
- **Use Cases**:
  - Activity generation from teaching content
  - Student response analysis
  - Word cloud data generation

#### OpenRouter Integration
- **Model**: Google Gemini 2.5 Pro
- **Use Case**: PDF document parsing and quiz generation
- **Features**: File upload support with PDF text extraction

### 6.2 AI Features

1. **Activity Generation** (`generateActivityFromContent`)
   - Input: Teaching content, activity type, topic
   - Output: Structured activity with questions, options, answers
   - Supports: Quiz, Poll, Word Cloud, Short Answer, Mini-game

2. **Response Analysis** (`analyzeStudentResponses`)
   - Input: Array of student responses, activity type
   - Output: Themes, frequent answers, insights, suggestions

3. **Word Cloud Generation** (`generateWordCloudData`)
   - Input: Student responses
   - Output: Extracted keywords with frequency counts

4. **PDF Quiz Generation** (`generateQuizFromPDF`)
   - Input: PDF file, topic, number of questions
   - Output: Complete quiz with questions, options, correct answers, explanations

## 7. Frontend Architecture

### 7.1 Routing Structure

```
app/
├── (dashboard)/           # Protected routes
│   ├── layout.tsx        # Auth guard
│   ├── dashboard/        # Main dashboard
│   ├── courses/          # Course management
│   ├── activities/       # Activity management
│   ├── analytics/        # Analytics dashboard
│   ├── leaderboard/      # Leaderboard view
│   └── student/          # Student-specific views
├── auth/
│   ├── login/           # Login page
│   └── register/        # Registration page
├── api/                 # API routes
└── layout.tsx           # Root layout with providers
```

### 7.2 Component Architecture

- **UI Components**: Reusable shadcn/ui components in `components/ui/`
- **Feature Components**: Activity-specific, dashboard, student management
- **Providers**: NextAuth, Socket.io, Toast notifications
- **Layouts**: Role-based layouts with navigation

### 7.3 State Management

- **Server State**: Next.js Server Components and API routes
- **Client State**: React hooks, Zustand (for global state)
- **Form State**: React Hook Form with Zod validation
- **Real-time State**: Socket.io client hooks

## 8. Security Features

### 8.1 Authentication Security
- JWT tokens with secure session management
- Password hashing with bcryptjs
- Session expiration and refresh mechanisms
- Protected API routes with server-side validation

### 8.2 Data Security
- Input validation and sanitization (Zod schemas)
- MongoDB injection prevention (Mongoose ODM)
- XSS protection (React's built-in escaping)
- CORS configuration for Socket.io server
- Environment variable protection

### 8.3 Access Control
- Role-based access control (RBAC)
- Route-level protection
- API endpoint authorization checks
- Student data privacy (only own data access)

## 9. Key Features

### 9.1 Course Management
- Create and manage courses
- Bulk student import via CSV/Excel
- Student enrollment system
- Course code generation

### 9.2 Activity Types
1. **Polls**: Real-time voting with multiple options
2. **Quizzes**: Multiple choice, true/false, custom questions
3. **Word Clouds**: Collaborative vocabulary building
4. **Short Answer**: Open-ended questions with AI analysis
5. **Mini-games**: Educational games for engagement

### 9.3 Live Sessions
- Synchronous activity delivery
- Real-time participant tracking
- Instant response collection
- Live result broadcasting
- Session state management (waiting/active/paused/completed)

### 9.4 Analytics & Reporting
- Teacher dashboard with activity performance
- Student dashboard with personal progress
- Leaderboard system
- Participation metrics
- Response analysis and insights

### 9.5 AI-Powered Features
- Content generation from teaching materials
- Automatic quiz generation from PDFs
- Student response analysis and grouping
- Learning insights and recommendations

## 10. Deployment Architecture

### 10.1 Production Setup
- **Frontend + API**: Vercel (Next.js serverless functions)
- **Database**: MongoDB Atlas (cloud-hosted)
- **Real-time Server**: Separate deployment (Railway/Heroku)
- **CDN**: Vercel Edge Network
- **Environment**: Environment variables in Vercel dashboard

### 10.2 Scalability Considerations
- **Database**: MongoDB Atlas with connection pooling
- **API**: Serverless functions auto-scale
- **Real-time**: Socket.io with Redis adapter (for horizontal scaling)
- **Caching**: MongoDB connection caching, API response caching
- **Load Balancing**: Vercel's built-in load balancing

## 11. Data Flow

### 11.1 Activity Creation Flow
1. Teacher creates activity (manual or AI-generated)
2. Activity saved to MongoDB
3. Activity appears in course activities list
4. Teacher can start live session

### 11.2 Live Session Flow
1. Teacher starts session → Socket.io emits `start-session`
2. Students join activity room → `join-as-student`
3. Students submit responses → `submit-response`
4. Server aggregates responses → broadcasts `response-received`
5. Teacher views real-time results
6. Teacher ends session → `end-session`

### 11.3 AI Generation Flow
1. Teacher provides content/PDF
2. Frontend calls `/api/ai/generate-activity` or `/api/ai/generate-from-pdf`
3. API calls OpenAI/OpenRouter
4. AI processes and returns structured data
5. Frontend displays generated activity
6. Teacher can edit and save

## 12. Performance Optimizations

### 12.1 Frontend
- Next.js Image optimization
- Code splitting and lazy loading
- Server Components for reduced client bundle
- Static generation where possible

### 12.2 Backend
- MongoDB connection pooling and caching
- Database query optimization with indexes
- API response caching strategies
- Efficient Socket.io room management

### 12.3 Real-time
- Connection pooling
- Efficient broadcasting (room-based)
- In-memory session storage
- Graceful disconnection handling

## 13. Development Workflow

### 13.1 Local Development
1. Install dependencies: `npm install`
2. Set up `.env.local` with required variables
3. Start Next.js dev server: `npm run dev` (port 3000)
4. Start Socket.io server: `node server.js` (port 3001)

### 13.2 Environment Variables
```
MONGODB_URI=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
OPENAI_API_KEY=...
OPENROUTER_API_KEY=...
NEXT_PUBLIC_SOCKET_URL=...
```

## 14. Future Enhancements

- Advanced analytics with machine learning
- LMS integration (Moodle, Canvas)
- Mobile app development
- Offline functionality
- Advanced AI features (personalized learning paths)
- Multi-institutional support
- VR/AR integration

## 15. System Strengths

1. **Scalable Architecture**: Serverless functions, separate real-time server
2. **Type Safety**: Full TypeScript implementation
3. **Real-time Capabilities**: Robust Socket.io implementation
4. **AI Integration**: Multiple AI services for content generation
5. **User Experience**: Modern UI with responsive design
6. **Security**: Comprehensive authentication and authorization
7. **Flexibility**: Support for multiple activity types
8. **Analytics**: Comprehensive tracking and reporting

---

**Last Updated**: Based on current codebase analysis
**Version**: 0.1.0



