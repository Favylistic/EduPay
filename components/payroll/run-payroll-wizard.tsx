"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2, AlertCircle } from "lucide-react"
import { MONTHS, formatCurrency, getInitials } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type WizardStep = "configure" | "review" | "confirm"

interface CalculationResult {
  month: number
  year: number
  working_days: number
  employee_count: number
  total_gross: number
  total_deductions: number
  total_net: number
  payslips: Array<{
    employee_id: string
    employee_code: string
    profile: { first_name: string | null; last_name: string | null } | null
    department: { name: string } | null
    base_salary: number
    gross_salary: number
    total_deductions: number
    net_salary: number
    breakdown: {
      absent_days: number
      late_days: number
      attendance_deduction: number
      earnings: Array<{ name: string; computed_amount: number }>
      deductions: Array<{ name: string; computed_amount: number }>
    }
  }>
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "configure", label: "Configure" },
  { key: "review", label: "Review" },
  { key: "confirm", label: "Confirm" },
]

export function RunPayrollWizard() {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>("configure")
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1))
  const [year, setYear] = useState<string>(String(CURRENT_YEAR))
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [calculating, setCalculating] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [result, setResult] = useState<CalculationResult | null>(null)

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  async function handleCalculate() {
    if (!month || !year) return toast.error("Please select month and year")
    const runTitle = title.trim() || `${MONTHS[Number(month) - 1]} ${year} Payroll`
    setTitle(runTitle)
    setCalculating(true)
    try {
      const res = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: Number(month), year: Number(year) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.employee_count === 0) throw new Error("No active employees found for payroll.")
      setResult(data)
      setStep("review")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Calculation failed")
    } finally {
      setCalculating(false)
    }
  }

  async function handleCommit() {
    if (!result) return
    setCommitting(true)
    try {
      const res = await fetch("/api/payroll/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || `${MONTHS[result.month - 1]} ${result.year} Payroll`,
          month: result.month,
          year: result.year,
          notes: notes || null,
          payslips: result.payslips.map((p) => ({
            employee_id: p.employee_id,
            base_salary: p.base_salary,
            gross_salary: p.gross_salary,
            total_deductions: p.total_deductions,
            net_salary: p.net_salary,
            breakdown: p.breakdown,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep("confirm")
      toast.success("Payroll run committed successfully!")
      setTimeout(() => router.push(`/dashboard/payroll/runs/${data.id}`), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to commit payroll")
    } finally {
      setCommitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              stepIndex === i
                ? "bg-primary text-primary-foreground"
                : stepIndex > i
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            }`}>
              {stepIndex > i
                ? <CheckCircle2 className="h-3.5 w-3.5" />
                : <span className="h-3.5 w-3.5 flex items-center justify-center text-xs">{i + 1}</span>
              }
              {s.label}
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Configure */}
      {step === "configure" && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Payroll Run</CardTitle>
            <CardDescription>Select the pay period and provide an optional title.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Run Title <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder={`${MONTHS[Number(month) - 1]} ${year} Payroll`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                rows={2}
                className="resize-none"
                placeholder="Any notes for this payroll run..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCalculate} disabled={calculating}>
                {calculating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculating...</> : <>Calculate <ChevronRight className="h-4 w-4 ml-2" /></>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review */}
      {step === "review" && result && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Review — {MONTHS[result.month - 1]} {result.year}</CardTitle>
              <CardDescription>{result.employee_count} employees · {result.working_days} working days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Gross</p>
                  <p className="text-xl font-bold">{formatCurrency(result.total_gross)}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Deductions</p>
                  <p className="text-xl font-bold text-destructive">{formatCurrency(result.total_deductions)}</p>
                </div>
                <div className="rounded-lg border p-4 text-center bg-primary/5">
                  <p className="text-xs text-muted-foreground mb-1">Net Payable</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(result.total_net)}</p>
                </div>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Employee</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">Dept</TableHead>
                      <TableHead className="font-semibold">Base</TableHead>
                      <TableHead className="font-semibold hidden sm:table-cell">Gross</TableHead>
                      <TableHead className="font-semibold">Deductions</TableHead>
                      <TableHead className="font-semibold">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.payslips.map((p) => (
                      <TableRow key={p.employee_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(p.profile?.first_name ?? null, p.profile?.last_name ?? null)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{p.profile?.first_name} {p.profile?.last_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{p.employee_code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.department?.name ?? "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{formatCurrency(p.base_salary)}</TableCell>
                        <TableCell className="hidden sm:table-cell font-mono text-sm">{formatCurrency(p.gross_salary)}</TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-destructive">-{formatCurrency(p.total_deductions)}</span>
                          {p.breakdown.absent_days > 0 && (
                            <Badge variant="outline" className="ml-1 text-xs bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                              {p.breakdown.absent_days}d absent
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono font-semibold">{formatCurrency(p.net_salary)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("configure")}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button onClick={handleCommit} disabled={committing}>
              {committing
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                : <>Commit Payroll Run <ChevronRight className="h-4 w-4 ml-2" /></>}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmed */}
      {step === "confirm" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-full bg-green-500/10 p-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Payroll Committed!</h2>
            <p className="text-muted-foreground text-center">
              The payroll run has been saved and payslips have been generated. Redirecting to run details...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
