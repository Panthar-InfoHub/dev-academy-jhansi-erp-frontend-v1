"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminSignIn } from "@/lib/actions/loginActions"
import { cn } from "@/lib/utils"
import { signInSchema } from "@/lib/validation"
import { LoaderCircle } from "lucide-react"
import { useActionState, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { SCHOOL_NAME } from "@/env"

export function LoginForm({ className, ...props }: { className?: string }) {
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const handleLogin = async (prevState: any, formData: FormData) => {
    try {
      const formValues = {
        username: formData.get("username"),
        password: formData.get("password"),
      }

      await signInSchema.parseAsync(formValues)
      await adminSignIn(formData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors
        setErrors(fieldErrors)
        toast.error("Please check your input and try again.")

        return { ...prevState, error: "Validation Failed", status: "Error" }
      }

      if (error.message === "NEXT_REDIRECT") {
        toast.success("Logged in successfully")
        return { ...prevState, error: "Login Successful", status: "Success" }
      }

      toast.error("Invalid email or password")
      return {
        ...prevState,
        error: "Authentication failed",
        status: "Error",
      }
    }
  }

  const [state, formAction, isPending] = useActionState(handleLogin, { error: "", status: "INITIAL" })

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{SCHOOL_NAME}</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access the ERP system</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Email</Label>
                <Input
                  id="username"
                  name="username"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                />
                {errors?.username && <p className="text-sm text-red-500">{errors.username[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required autoComplete="current-password" />
                {errors?.password && <p className="text-sm text-red-500">{errors.password[0]}</p>}
              </div>
              <Button type="submit" disabled={isPending} className="w-full mt-2">
                {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
