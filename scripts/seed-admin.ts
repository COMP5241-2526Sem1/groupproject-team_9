import { existsSync, readFileSync } from 'fs'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

const loadEnvFile = (process as NodeJS.Process & {
  loadEnvFile?: (path?: string) => boolean
}).loadEnvFile

function hydrateEnvFromFile(filePath: string) {
  if (!existsSync(filePath)) {
    return
  }

  const content = readFileSync(filePath, 'utf8')

  content.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith('#')) {
      return
    }

    const idx = line.indexOf('=')
    if (idx === -1) {
      return
    }

    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  })
}

if (loadEnvFile) {
  loadEnvFile('.env')
  loadEnvFile('.env.local')
} else {
  hydrateEnvFromFile('.env')
  hydrateEnvFromFile('.env.local')
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI. Please set it before running this script.')
    process.exit(1)
  }

  const name = process.env.ADMIN_NAME || 'Platform Admin'
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
  const institution = process.env.ADMIN_INSTITUTION || 'PolyU'

  await connectDB()

  const existingUser = await User.findOne({ email })

  if (existingUser) {
    console.log(`ℹ️ Admin user already exists for ${email}`)
    process.exit(0)
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
    institution
  })

  console.log('✅ Admin user created successfully')
  console.log(`Email: ${email}`)
  console.log(`Temporary password: ${password}`)
}

main().catch((error) => {
  console.error('Failed to seed admin user:', error)
  process.exit(1)
})

