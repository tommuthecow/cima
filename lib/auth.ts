import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        isSignUp: { type: 'text' }
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string
        const password = credentials?.password as string
        const name = credentials?.name as string
        const isSignUp = credentials?.isSignUp === 'true'

        if (!email || !password) {
          throw new Error('Email and password are required')
        }

        if (isSignUp) {
          if (!name) {
            throw new Error('Name is required')
          }

          const existing = await prisma.user.findUnique({
            where: { email }
          })

          if (existing) {
            throw new Error('User already exists')
          }

          const passwordHash = await bcrypt.hash(password, 10)
          const user = await prisma.user.create({
            data: {
              email,
              passwordHash,
              name
            }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name
          }
        } else {
          const user = await prisma.user.findUnique({
            where: { email }
          })

          if (!user) {
            throw new Error('Invalid credentials')
          }

          const isValid = await bcrypt.compare(password, user.passwordHash)
          if (!isValid) {
            throw new Error('Invalid credentials')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name
          }
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin'
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})
