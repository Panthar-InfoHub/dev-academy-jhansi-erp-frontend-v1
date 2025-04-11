import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "next-auth/react"
import { auth, type customUser } from "@/auth"
import { CommandPalette } from "@/components/command-palette"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "School ERP System",
  description: "Enterprise Resource Planning System for Schools",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  const user = session?.user as customUser

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster position="top-right" />
            {/* Conditionally render CommandPalette based on user role */}
            {user && <CommandPalette user={user} />}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
