import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { JWT } from "next-auth/jwt"
import type { AdapterUser } from "next-auth/adapters"
import axios, { AxiosError } from "axios"
import { BACKEND_SERVER_URL } from "@/env"
import { decode } from "jsonwebtoken"

export interface customUser extends AdapterUser {
  id: string
  name: string
  isAdmin: boolean
  isTeacher: boolean
}

export interface customJWT extends JWT {
  id: string
  isTeacher: boolean
  isAdmin: boolean
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { required: true },
        password: { required: true },
      },
      async authorize(credentials) {
        // Make sure credentials are defined before accessing properties
        if (!credentials?.username || !credentials?.password) {
          console.error("Missing credentials")
          return null
        }

        try {
          const userJWT = await handleEmployeeLogin(credentials.username, credentials.password)
          if (!userJWT) return null

          const decodedJWT = decode(userJWT)
          console.log("Decoded JWT", decodedJWT)

          const decodedUser = decodedJWT as customUser

          if (decodedUser) {
            return decodedUser
          }

          return null
        } catch (error) {
          console.error("Error in authorize callback:", error)
          return null
        }
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const customUser = user as customUser
        token.id = customUser.id
        token.isAdmin = customUser.isAdmin
        token.isTeacher = customUser.isTeacher
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        ;(session.user as customUser) = {
          email: token.email || "",
          name: token.name || "",
          emailVerified: null,
          id: (token as customJWT).id,
          isAdmin: Boolean(token.isAdmin),
          isTeacher: Boolean(token.isTeacher),
        }
      }
      return session
    },
    authorized({ request, auth }) {
      console.log("Auth status", auth)
      const isLoggedIn = !!auth?.user

      if (request.nextUrl.pathname === "/" && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl))
      }

      return !!auth
    },
  },

  pages: {
    signIn: "/",
  },
})

async function handleEmployeeLogin(email: string, password: string): Promise<string | null> {
  console.log("Login attempt with:", { email, password: "***" })
  try {
    const response = await axios.post(
      `${BACKEND_SERVER_URL}/v1/employee/login`,
      {
        email: email.toLowerCase(),
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.data || !response.data.token) {
      console.error("Invalid response format:", response.data)
      return null
    }

    return response.data.token as string
  } catch (e) {
    console.error("Error in login:", { email })
    if (e instanceof AxiosError && e.response) {
      console.error("Error response data:", e.response.data)
    } else {
      console.error("Error details:", e)
    }
    return null
  }
}
