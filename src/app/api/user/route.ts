import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      institution: user.institution,
      role: user.role
    })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Only teachers update via this endpoint per current requirement
    if (session.user.role !== 'teacher') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { name, email, institution } = await request.json()

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { message: 'Name and email are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    await connectDB()

    // Ensure email uniqueness if email changed
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing && existing._id.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'Email is already in use' },
        { status: 400 }
      )
    }

    const updated = await User.findByIdAndUpdate(
      session.user.id,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        institution: institution?.trim() || 'PolyU'
      },
      { new: true }
    )

    if (!updated) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      institution: updated.institution,
      role: updated.role
    })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}


