import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Award, UserCheck } from "lucide-react"

interface StatsCardsProps {
  totalEmployees: number
  activeEmployees: number
  totalDepartments: number
  totalDesignations: number
}

export function StatsCards({
  totalEmployees,
  activeEmployees,
  totalDepartments,
  totalDesignations,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: Users,
      description: "All registered employees",
    },
    {
      title: "Active Employees",
      value: activeEmployees,
      icon: UserCheck,
      description: "Currently active staff",
    },
    {
      title: "Departments",
      value: totalDepartments,
      icon: Building2,
      description: "Active departments",
    },
    {
      title: "Designations",
      value: totalDesignations,
      icon: Award,
      description: "Job titles defined",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
