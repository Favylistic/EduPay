import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials, STAFF_TYPE_LABELS } from "@/lib/types"
import type { Employee } from "@/lib/types"

interface RecentEmployeesProps {
  employees: Employee[]
}

export function RecentEmployees({ employees }: RecentEmployeesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Employees</CardTitle>
        <CardDescription>
          Latest employees added to the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No employees added yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(emp.profile?.first_name ?? null, emp.profile?.last_name ?? null)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">
                    {emp.profile?.first_name ?? ""} {emp.profile?.last_name ?? ""}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {emp.profile?.email ?? emp.employee_id}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {STAFF_TYPE_LABELS[emp.staff_type] ?? emp.staff_type}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
