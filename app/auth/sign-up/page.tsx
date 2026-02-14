import type { Metadata } from "next"
import { SignUpForm } from "@/components/auth/sign-up-form"

export const metadata: Metadata = {
  title: "Sign Up",
}

export default function SignUpPage() {
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
                {"\"Join hundreds of schools managing payroll efficiently with EduPay's comprehensive platform.\""}
              </p>
              <footer className="text-sm opacity-70">
                Get started in minutes
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
                Create an account
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your details to get started
              </p>
            </div>
            <SignUpForm />
          </div>
        </div>
      </div>
    </main>
  )
}
