"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserX, Clock, Mail } from "lucide-react"

interface AdminOverviewCardsProps {
  presentEmployees: number
  absentEmployees: number
  pendingLeaves: number
  unreadMessages: number
}

export function AdminOverviewCards({
  presentEmployees,
  absentEmployees,
  pendingLeaves,
  unreadMessages,
}: AdminOverviewCardsProps) {
  const metrics = [
    {
      title: "Present Today",
      value: presentEmployees.toString(),
      icon: Users,
      description: "Employees checked in",
      className: "border-l-4 border-l-green-500",
    },
    {
      title: "Absent Today",
      value: absentEmployees.toString(),
      icon: UserX,
      description: "Employees absent",
      className: "border-l-4 border-l-red-500",
    },
    {
      title: "Pending Leaves",
      value: pendingLeaves.toString(),
      icon: Clock,
      description: "Awaiting approval",
      className: "border-l-4 border-l-amber-500",
    },
    {
      title: "Unread Messages",
      value: unreadMessages.toString(),
      icon: Mail,
      description: "From employees",
      className: "border-l-4 border-l-blue-500",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title} className={`${metric.className} transition-shadow hover:shadow-md`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
