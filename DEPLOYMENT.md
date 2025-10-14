# Deployment Guide - Interactive Learning Platform

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- GitHub account
- Vercel account (for deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/lxs1998418-spec/COMP5241_final_project.git
   cd COMP5241_final_project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb_uri
   NEXTAUTH_SECRET=your-secret-key-here-change-in-production
   NEXTAUTH_URL=http://localhost:3000
   OPENAI_API_KEY=your-openai-api-key-here
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   NODE_ENV=development
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1: Next.js application
   npm run dev
   
   # Terminal 2: Socket.io server
   node server.js
   ```

5. **Access the application**
   - Main App: http://localhost:3000
   - Socket.io Server: http://localhost:3001

## 🌐 Vercel Deployment

### Automatic Deployment (Recommended)

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import from GitHub: `lxs1998418-spec/COMP5241_final_project`

2. **Configure Environment Variables**
   In Vercel dashboard, add these environment variables:
   ```
   MONGODB_URI=mongodb_uri
   NEXTAUTH_SECRET=your-production-secret-key
   NEXTAUTH_URL=https://your-app-name.vercel.app
   OPENAI_API_KEY=your-openai-api-key
   NEXT_PUBLIC_SOCKET_URL=https://your-socket-server-url
   NODE_ENV=production
   ```

3. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app
   - Get your public URL: `https://your-app-name.vercel.app`

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables**
   ```bash
   vercel env add MONGODB_URI
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   vercel env add OPENAI_API_KEY
   vercel env add NEXT_PUBLIC_SOCKET_URL
   ```

## 🔧 Socket.io Server Deployment

For real-time features, you need to deploy the Socket.io server separately:

### Option 1: Railway
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy the `server.js` file
4. Update `NEXT_PUBLIC_SOCKET_URL` in your main app

### Option 2: Heroku
1. Create a new Heroku app
2. Add the `server.js` file
3. Deploy and get the URL
4. Update environment variables

### Option 3: Vercel Serverless Functions
Convert `server.js` to Vercel serverless functions for Socket.io.

## 📱 Features Available After Deployment

### For Teachers
- ✅ Create and manage courses
- ✅ Import students with PolyU student IDs
- ✅ Create interactive activities (Polls, Quizzes, Word Clouds, Mini-games)
- ✅ Start live learning sessions
- ✅ View analytics and student performance
- ✅ AI-powered content generation

### For Students
- ✅ Join courses with student ID
- ✅ Participate in live activities
- ✅ Track personal progress
- ✅ View leaderboards and rankings
- ✅ Access mobile-responsive interface

### System Features
- ✅ Real-time collaboration
- ✅ AI-powered insights
- ✅ Comprehensive analytics
- ✅ Mobile responsive design
- ✅ Secure authentication
- ✅ MongoDB data persistence

## 🛠️ Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure `.env.local` is in the root directory
   - Restart the development server
   - Check variable names match exactly

2. **Socket.io Connection Issues**
   - Verify Socket.io server is running on port 3001
   - Check `NEXT_PUBLIC_SOCKET_URL` environment variable
   - Ensure CORS is properly configured

3. **MongoDB Connection Issues**
   - Verify MongoDB URI is correct
   - Check network connectivity
   - Ensure database permissions are set

4. **Build Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check for TypeScript errors
   - Verify all imports are correct

### Performance Optimization

1. **Database Indexing**
   - Ensure proper indexes on frequently queried fields
   - Monitor query performance

2. **Caching**
   - Implement Redis for session storage
   - Use CDN for static assets

3. **Real-time Optimization**
   - Limit concurrent connections
   - Implement connection pooling
   - Use Redis adapter for Socket.io scaling

## 📊 Monitoring and Analytics

### Application Monitoring
- Use Vercel Analytics for performance monitoring
- Implement error tracking with Sentry
- Monitor database performance

### User Analytics
- Track user engagement
- Monitor activity completion rates
- Analyze learning outcomes

## 🔒 Security Considerations

### Production Security
- Use strong, unique secrets for NEXTAUTH_SECRET
- Enable HTTPS in production
- Implement rate limiting
- Regular security updates

### Data Protection
- Encrypt sensitive data
- Implement proper access controls
- Regular backup procedures
- GDPR compliance for EU users

## 📞 Support

For technical support or questions:
- Check the [GitHub Issues](https://github.com/lxs1998418-spec/COMP5241_final_project/issues)
- Review the [README.md](README.md) for detailed documentation
- Contact the development team

---

**Built with ❤️ for Hong Kong University Education**
