"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">Failed to load analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Something went wrong while fetching analytics data. Please try again.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
