import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payslips")
    .select(
      "*, employee:employees(id, employee_id, bank_name, bank_account_number, profile:profiles(id, first_name, last_name, email), department:departments(id, name), designation:designations(id, title))"
    )
    .eq("payroll_run_id", id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
}
