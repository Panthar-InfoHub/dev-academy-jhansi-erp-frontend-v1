import { redirect } from "next/navigation"

export default function AddStudentRedirect() {
  redirect("/dashboard/students")
}
