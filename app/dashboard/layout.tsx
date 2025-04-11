import type React from "react"
import { auth, type customUser } from "@/auth"
import { redirect } from "next/navigation"
import { SidebarNav } from "@/components/sidebar"
import { SCHOOL_NAME } from "@/env"
import { Toaster } from "sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const user = session.user as customUser

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav user={user} />
      <div className="flex-1 flex flex-col overflow-auto">
        <header className="border-b bg-background p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{SCHOOL_NAME} ERP</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
        <Toaster position="top-right" richColors />
      </div>
    </div>
  )
}
