# Interactive Learning Platform

A comprehensive web-based system that empowers Hong Kong university lecturers to create, generate, deliver, and manage interactive learning activities for both in-class and remote learning scenarios.

## 🚀 Features

### Core Functionality
- **Multi-role Authentication**: Teachers, Students, and Admins with role-based access control
- **Course Management**: Create courses and import students with PolyU student IDs
- **Interactive Activities**: Polls, quizzes, word clouds, short-answer questions, and mini-games
- **Real-time Delivery**: Synchronous learning activities with live participation
- **GenAI Integration**: AI-powered content generation and response analysis
- **Analytics & Reporting**: Comprehensive dashboards and performance tracking
- **Leaderboards**: Gamification elements to boost student engagement
- **Mobile Responsive**: Works perfectly on all devices

### AI-Powered Features
- **Activity Generation**: Create activities from teaching content using AI
- **Answer Analysis**: Automatic grouping and analysis of student responses
- **Content Enhancement**: AI suggestions for improving activities
- **Smart Recommendations**: Personalized learning insights

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** with shadcn/ui components
- **React Hook Form** for form management
- **Recharts** for data visualization
- **Socket.io Client** for real-time features

### Backend
- **Next.js API Routes** with tRPC
- **MongoDB** with Mongoose ODM
- **NextAuth.js** for authentication
- **Socket.io** for real-time communication
- **OpenAI API** for AI features

### Database
- **MongoDB Atlas** for data storage
- **Mongoose** for object modeling

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/COMP5241-2526Sem1/groupproject-team_9.git
   cd groupproject-team_9
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with:
   ```env
   MONGODB_URI=your-mongo-uri
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   OPENAI_API_KEY=your-openai-api-key-here
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Start the Socket.io server** (in a separate terminal)
   ```bash
   node server.js
   ```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect your repository to Vercel
   - Set environment variables in Vercel dashboard

2. **Environment Variables for Production**
   ```
   MONGODB_URI=your-mongodb-connection-string
   NEXTAUTH_SECRET=your-production-secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   OPENAI_API_KEY=your-openai-api-key
   NEXT_PUBLIC_SOCKET_URL=https://your-socket-server-url
   ```

3. **Deploy**
   - Vercel will automatically deploy on every push to main branch
   - Your app will be available at `https://your-project.vercel.app`

## 📱 Usage

### For Teachers
1. **Register/Login** with teacher credentials
2. **Create Courses** and import student lists
3. **Generate Activities** using AI or create manually
4. **Deliver Live Sessions** with real-time participation
5. **View Analytics** and student performance reports

### For Students
1. **Join with Student ID** or get invited by teachers
2. **Participate in Activities** during live sessions
3. **Track Progress** on personal dashboard
4. **Compete on Leaderboards** with classmates

### For Admins
1. **Manage Users** and system settings
2. **View Platform Analytics** and usage statistics
3. **Moderate Content** and ensure quality

## 🎯 Key Features in Detail

### Interactive Activities
- **Polls**: Real-time voting and opinion gathering
- **Quizzes**: Multiple choice, true/false, and custom questions
- **Word Clouds**: Collaborative vocabulary and concept mapping
- **Short Answer**: Open-ended responses with AI analysis
- **Mini Games**: Educational games for engagement

### Real-time Features
- **Live Sessions**: Synchronous activity delivery
- **Instant Results**: Real-time response collection and display
- **Participant Tracking**: Monitor student engagement
- **Session Management**: Start, pause, and end sessions

### AI Integration
- **Content Generation**: Create activities from teaching materials
- **Response Analysis**: Automatic grouping of similar answers
- **Insights Generation**: AI-powered learning analytics
- **Smart Recommendations**: Personalized suggestions

## 📊 Analytics & Reporting

### Teacher Dashboard
- Activity performance metrics
- Student engagement statistics
- Participation rates and trends
- Detailed response analysis

### Student Dashboard
- Personal progress tracking
- Activity completion status
- Performance scores and rankings
- Learning streak tracking

### Admin Dashboard
- Platform-wide usage statistics
- User management and analytics
- System health monitoring
- Content moderation tools

## 🔒 Security Features

- **JWT Authentication** with secure session management
- **Role-based Access Control** for different user types
- **Input Validation** and sanitization
- **Rate Limiting** for API endpoints
- **Data Encryption** for sensitive information

## 📱 Mobile Responsiveness

- **Responsive Design** for all screen sizes
- **Touch-friendly Interface** for mobile devices
- **Offline Capabilities** for basic functionality
- **Progressive Web App** features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **PolyU** for providing the educational context
- **Next.js** team for the amazing framework
- **Vercel** for seamless deployment
- **OpenAI** for AI capabilities
- **MongoDB** for database services

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---

**Built with ❤️ for Hong Kong University Education**
