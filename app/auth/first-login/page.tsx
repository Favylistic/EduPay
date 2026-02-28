import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FirstLoginForm } from "@/components/auth/first-login-form"

export const metadata: Metadata = {
  title: "Complete Your Setup - EduPay",
  description: "Set up your account on first login",
}

export default async function FirstLoginPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile to check if they need to complete setup
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_temporary_password, password_changed_at")
    .eq("id", user.id)
    .single()

  // If not a first-login user, redirect to dashboard
  if (!profile?.is_temporary_password) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-[960px] overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="hidden w-1/2 flex-col justify-between bg-blue-600 p-10 text-white lg:flex">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">EduPay</h1>
            <p className="mt-1 text-sm opacity-80">School Payroll Management</p>
          </div>
          <div>
            <blockquote className="space-y-2">
              <p className="text-lg leading-relaxed">
                {"\"Secure your account and complete your profile to get started.\""}
              </p>
              <footer className="text-sm opacity-70">
                Welcome to EduPay
              </footer>
            </blockquote>
          </div>
          <div className="text-xs opacity-60">
            Secure. Reliable. Built for schools.
          </div>
        </div>
        <div className="flex w-full flex-col justify-center p-8 lg:w-1/2 lg:p-10">
          <div className="mx-auto w-full max-w-[340px]">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-card-foreground">
                Complete Your Setup
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Change your temporary password and complete your profile
              </p>
            </div>
            <FirstLoginForm userId={user.id} />
          </div>
        </div>
      </div>
    </main>
  )
}
