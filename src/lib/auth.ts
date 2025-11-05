import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import connectDB from './mongodb'
import User from '@/models/User'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()

        const user = await User.findOne({ email: credentials.email })
        if (!user) {
          return null
        }

        if (user.password) {
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            return null
          }
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          institution: user.institution,
          studentId: user.studentId
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On initial sign in, copy properties from user to token
      if (user) {
        token.name = user.name
        token.email = user.email
        token.role = user.role
        token.institution = user.institution
        token.studentId = user.studentId
      }

      // When session.update is called, merge updated fields into token
      if (trigger === 'update' && session) {
        if (session.name !== undefined) token.name = session.name as string
        if (session.email !== undefined) token.email = session.email as string
        if (session.institution !== undefined) token.institution = session.institution as string
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.name = (token.name as string) || session.user.name
        session.user.email = (token.email as string) || session.user.email
        session.user.role = token.role as string
        session.user.institution = token.institution as string
        session.user.studentId = token.studentId as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login'
  }
}
