import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        nip: { label: "NIP", type: "text", placeholder: "Masukkan NIP" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.nip || !credentials?.password) {
          return null
        }

        const userResults = await db.select().from(users).where(eq(users.nip, credentials.nip))
        const user = userResults[0]

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id.toString(),
          nip: user.nip,
          name: user.nama,
          role: user.role || 'pegawai',
          jabatan: user.jabatan,
          bidang: user.bidang
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.nip = user.nip
        token.role = user.role
        token.jabatan = user.jabatan
        token.bidang = user.bidang
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.nip = token.nip as string
        session.user.role = token.role as string
        session.user.jabatan = token.jabatan as string
        session.user.bidang = token.bidang as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET || "default_secret_key"
}
