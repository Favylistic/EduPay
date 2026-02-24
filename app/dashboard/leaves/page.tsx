import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MyLeavesTable } from "@/components/leave/my-leaves-table"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "My Leaves | EduPay",
  description: "Submit and track leave requests",
}

export default async function MyLeavesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: employee } = await supabase
    .from("employees")
    .select("id, employee_id")
    .eq("profile_id", user.id)
    .maybeSingle()

  if (!employee) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Leaves</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No employee record is linked to your account. Please contact HR.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Leaves</h1>
        <p className="text-sm text-muted-foreground">
          Request and manage your time-off.
        </p>
      </div>
      <MyLeavesTable employeeId={employee.id} />
    </div>
  )
}
