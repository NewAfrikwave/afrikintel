import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Note: GitHub OAuth requires GITHUB_ID and GITHUB_SECRET env vars.
// If not set, the provider is skipped (login page only shows credentials).

const providers: any[] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email', placeholder: 'you@company.com' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null
      const user = await db.user.findUnique({ where: { email: credentials.email } })
      if (!user || !user.active) return null
      if (!user.password) return null
      const valid = await bcrypt.compare(credentials.password, user.password)
      if (!valid) return null
      // Update lastLogin
      await db.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } })
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar,
        role: user.role,
      }
    },
  }),
]

// Conditionally add GitHub OAuth if env vars are set
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  )
}

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: process.env.SMTP_FROM || 'alerts@afrikintel.com',
    }),
  )
}

export const authOptions: NextAuthOptions = {
  // PrismaAdapter requires a User, Account, VerificationToken model.
  // We don't use sessions table (using JWT strategy).
  adapter: PrismaAdapter(db as any),
  session: { strategy: 'jwt' },
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      // First-time sign-in: persist user role into the token
      if (user) {
        const dbUser = await db.user.findUnique({ where: { email: user.email! } })
        token.id = dbUser?.id || user.id
        token.role = dbUser?.role || 'viewer'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
    async signIn({ user, account }) {
      // For OAuth providers, auto-create a user record if not exists
      if (account?.provider !== 'credentials' && user.email) {
        const existing = await db.user.findUnique({ where: { email: user.email } })
        if (!existing) {
          await db.user.create({
            data: {
              email: user.email,
              name: user.name || user.email.split('@')[0],
              avatar: user.image,
              role: 'viewer', // default role for new OAuth users
            },
          })
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
