import type { Metadata } from "next"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

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
                {"\"Secure employee account creation managed by your administrator.\""}
              </p>
              <footer className="text-sm opacity-70">
                Streamlined onboarding for enterprise security
              </footer>
            </blockquote>
          </div>
          <div className="text-xs opacity-60">
            Secure. Reliable. Built for schools.
          </div>
        </div>
        <div className="flex w-full flex-col justify-center p-8 lg:w-1/2 lg:p-10">
          <div className="mx-auto w-full max-w-[340px]">
            <div className="mb-8 flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-card-foreground">
                  Access Restricted
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Public registration is disabled
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  New employee accounts are created exclusively by your system administrator. Self-registration is not available.
                </p>
              </div>

              <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">If you are a new employee:</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  Contact your HR or IT department. They will create your account and send you login credentials via email.
                </p>
              </div>

              <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Already have an account?</h3>
                <Link 
                  href="/auth/login"
                  className="text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 underline"
                >
                  Go to Login →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
