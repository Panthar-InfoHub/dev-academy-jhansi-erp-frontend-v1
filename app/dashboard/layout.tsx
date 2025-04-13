import type React from "react"
import { auth, type customUser } from "@/auth"
import { redirect } from "next/navigation"
import { SidebarNav } from "@/components/sidebar"
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
    <div className="flex min-h-screen">
      <SidebarNav user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 pt-10 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
