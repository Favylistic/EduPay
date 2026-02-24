"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface DownloadPdfButtonProps {
  payslipId: string
  filename?: string
}

export function DownloadPdfButton({ payslipId, filename }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(`/api/payroll/payslips/${payslipId}/pdf`)
      if (!res.ok) throw new Error("Failed to generate payslip")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename ?? `payslip-${payslipId}.html`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success("Payslip downloaded successfully")
    } catch {
      toast.error("Could not download payslip. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Download
    </Button>
  )
}
