"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"
import { ROLE_LABELS, getInitials } from "@/lib/types"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Users,
  Building2,
  Award,
  LogOut,
  ChevronsUpDown,
  GraduationCap,
  ShieldCheck,
  Clock,
  History,
  BarChart2,
  CalendarDays,
  ClipboardCheck,
  DollarSign,
  Play,
  Settings2,
  ListOrdered,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_MAIN: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Employees", href: "/dashboard/employees", icon: Users },
      { title: "Departments", href: "/dashboard/departments", icon: Building2 },
      { title: "Designations", href: "/dashboard/designations", icon: Award },
    ],
  },
  {
    label: "Attendance",
    items: [
      { title: "Time Clock", href: "/dashboard/attendance", icon: Clock },
      { title: "History", href: "/dashboard/attendance/history", icon: History },
      { title: "Monthly Summary", href: "/dashboard/attendance/summary", icon: BarChart2 },
    ],
  },
  {
    label: "Leave",
    items: [
      { title: "My Leaves", href: "/dashboard/leaves", icon: CalendarDays },
      { title: "Approvals", href: "/dashboard/leaves/approvals", icon: ClipboardCheck, adminOnly: true },
    ],
  },
  {
    label: "Payroll",
    items: [
      { title: "Overview", href: "/dashboard/payroll", icon: DollarSign, adminOnly: true },
      { title: "Run Payroll", href: "/dashboard/payroll/run", icon: Play, adminOnly: true },
      { title: "History", href: "/dashboard/payroll/history", icon: ListOrdered, adminOnly: true },
      { title: "Components", href: "/dashboard/payroll/components", icon: Settings2, adminOnly: true },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "User Management", href: "/dashboard/users", icon: ShieldCheck, adminOnly: true },
    ],
  },
]

interface AppSidebarProps {
  profile: Profile
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">EduPay</span>
                  <span className="text-xs text-sidebar-foreground/60">
                    Payroll Management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {NAV_MAIN.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.adminOnly || profile.role === "super_admin" || profile.role === "hr_manager"
          )
          if (visibleItems.length === 0) return null
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const exactMatch = ["/dashboard", "/dashboard/payroll"].includes(item.href)
                    const isActive = exactMatch
                      ? pathname === item.href
                      : pathname.startsWith(item.href)
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-md">
                      <AvatarFallback className="rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                        {getInitials(profile.first_name, profile.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {profile.first_name} {profile.last_name}
                      </span>
                      <span className="truncate text-xs text-sidebar-foreground/60">
                        {ROLE_LABELS[profile.role]}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-md">
                        <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-xs">
                          {getInitials(profile.first_name, profile.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {profile.first_name} {profile.last_name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {profile.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton size="lg">
                <Avatar className="h-8 w-8 rounded-md">
                  <AvatarFallback className="rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {getInitials(profile.first_name, profile.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {profile.first_name} {profile.last_name}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/60">
                    {ROLE_LABELS[profile.role]}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4" />
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
