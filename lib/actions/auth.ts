"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  // Block unverified users from signing in
  if (authData.user && !authData.user.email_confirmed_at) {
    await supabase.auth.signOut()
    return {
      error:
        "Your email has not been verified yet. Please check your inbox and click the confirmation link before signing in.",
    }
  }

  // Check if this is a first login with temporary password
  if (authData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_temporary_password, password_changed_at")
      .eq("id", authData.user.id)
      .single()

    if (profile?.is_temporary_password) {
      redirect("/auth/first-login")
    }
  }

  redirect("/dashboard")
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("first_name") as string
  const lastName = formData.get("last_name") as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/dashboard`,
      data: {
        first_name: firstName,
        last_name: lastName,
        role: "staff",
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/auth/sign-up-success")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function getCurrentProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return profile
}
