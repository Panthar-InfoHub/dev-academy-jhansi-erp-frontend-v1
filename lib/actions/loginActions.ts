"use server"

import {signIn, signOut} from "@/auth"

export const adminSignIn = async (formData: FormData) => {
    console.log("Form data username : ", formData.get("username"))
    console.log("Form data password : ", formData.get("password"))
    await signIn("credentials", {
        username: formData.get("username"),
        password: formData.get("password"),
        redirectTo: "/dashboard"
    })
}

export const handleSignOut = async () => {
    await signOut({
        redirectTo: "/"
    })
}