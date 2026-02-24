"use client"

import { Suspense } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbItemUI,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { NotificationBell } from "./notification-bell"

interface BreadcrumbEntry {
  label: string
  href?: string
}

interface DashboardHeaderProps {
  breadcrumbs: BreadcrumbEntry[]
}

function HeaderContent({ breadcrumbs }: DashboardHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1
            return (
              <span key={item.label} className="flex items-center gap-1.5">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItemUI>
                  {isLast ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={item.href}>
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItemUI>
              </span>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <Suspense fallback={<div className="h-9 w-9" />}>
        <NotificationBell />
      </Suspense>
    </header>
  )
}

export function DashboardHeader({ breadcrumbs }: DashboardHeaderProps) {
  return (
    <Suspense fallback={<div className="h-14 border-b bg-background" />}>
      <HeaderContent breadcrumbs={breadcrumbs} />
    </Suspense>
  )
}
