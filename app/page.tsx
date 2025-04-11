import { LoginForm } from "@/components/login-form"
import { auth, type customUser } from "@/auth"
import { redirect } from "next/navigation"
import { SCHOOL_NAME } from "@/env"

export default async function Home() {
  const session = await auth()

  if (session && session.user) {
    const user = session.user as customUser

    if (user.isAdmin) {
      redirect(`/dashboard`)
    }

    if (user.isTeacher) {
      redirect(`/dashboard/employee/${user.id}`)
    }

    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} {SCHOOL_NAME}. All rights reserved.
      </footer>
    </div>
  )
}
