import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Sign In",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-[960px] overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">EduPay</h1>
            <p className="mt-1 text-sm opacity-80">School Payroll Management</p>
          </div>
          <div>
            <blockquote className="space-y-2">
              <p className="text-lg leading-relaxed">
                {"\"Streamline your school's payroll operations with a modern, secure, and efficient management system.\""}
              </p>
              <footer className="text-sm opacity-70">
                Trusted by educational institutions
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
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to your EduPay account
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}
