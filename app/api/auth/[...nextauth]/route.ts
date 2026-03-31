import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { getRequestContext } from "@cloudflare/next-on-pages"

export const runtime = 'edge'

export async function GET(request: Request) {
  const { env } = getRequestContext()
  const clientId = (env as Record<string, string>).GOOGLE_CLIENT_ID
  const clientSecret = (env as Record<string, string>).GOOGLE_CLIENT_SECRET

  const { handlers } = NextAuth({
    providers: [
      Google({
        clientId: clientId!,
        clientSecret: clientSecret!,
      }),
    ],
  })

  return handlers.GET(request)
}

export async function POST(request: Request) {
  const { env } = getRequestContext()
  const clientId = (env as Record<string, string>).GOOGLE_CLIENT_ID
  const clientSecret = (env as Record<string, string>).GOOGLE_CLIENT_SECRET

  const { handlers } = NextAuth({
    providers: [
      Google({
        clientId: clientId!,
        clientSecret: clientSecret!,
      }),
    ],
  })

  return handlers.POST(request)
}
