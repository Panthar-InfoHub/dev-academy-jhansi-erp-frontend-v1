import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "next-auth/react"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "School ERP System",
  description: "Enterprise Resource Planning System for Schools",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster position="top-right" />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
