import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      nip: string
      role: string
      jabatan: string
      bidang: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    nip: string
    role: string
    jabatan: string
    bidang: string
  }
}
