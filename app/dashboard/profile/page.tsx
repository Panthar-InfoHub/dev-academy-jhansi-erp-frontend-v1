import { auth, type customUser } from "@/auth"
import { redirect } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"

export default async function ProfilePage() {
  // Disable caching
  noStore()

  console.log("Minimal ProfilePage: Starting render")

  // Get the session
  const session = await auth()

  // Check if user exists
  if (!session || !session.user) {
    console.log("Minimal ProfilePage: No session or user, redirecting to login")
    return redirect("/")
  }

  const user = session.user as customUser
  console.log("Minimal ProfilePage: User authenticated, ID:", user.id)

  // Return a minimal page with no components that might cause loops
  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Profile Page</h1>
      <p>User ID: {user.id}</p>
      <p>Name: {user.name}</p>
      <p>Email: {user.email || "No email"}</p>
      <p>Admin: {user.isAdmin ? "Yes" : "No"}</p>
      <p>Teacher: {user.isTeacher ? "Yes" : "No"}</p>
    </div>
  )
}
