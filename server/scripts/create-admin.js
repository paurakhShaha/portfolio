// Creates an admin, or resets an existing admin's password.
// Usage: npm run create-admin -- <username>   (the password is asked for, hidden)
import readline from 'node:readline'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'

const username = (process.argv[2] || '').trim().toLowerCase()
if (!username) {
  console.error('Usage: npm run create-admin -- <username>')
  process.exit(1)
}
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set (put it in .env)')
  process.exit(1)
}

function askHidden(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
    // Echo nothing while the password is typed.
    rl._writeToOutput = (s) => {
      if (s.startsWith(question)) rl.output.write(question)
    }
  })
}

const password = await askHidden(`Password for ${username} (min 12 characters): `)
if (password.length < 12) {
  console.error('Password must be at least 12 characters')
  process.exit(1)
}
if ((await askHidden('Repeat password: ')) !== password) {
  console.error('Passwords do not match')
  process.exit(1)
}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 })
const passwordHash = await bcrypt.hash(password, 12)
const existing = await User.findOne({ username })
if (existing) {
  existing.passwordHash = passwordHash
  await existing.save()
  console.log(`Password updated for ${username}`)
} else {
  await User.create({ username, passwordHash, role: 'admin' })
  console.log(`Admin ${username} created`)
}
await mongoose.disconnect()
