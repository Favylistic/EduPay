"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import type { Profile, UserRole } from "@/lib/types"
import { ROLE_LABELS, getInitials } from "@/lib/types"

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    const json = await r.json()
    if (!r.ok) throw new Error(json.error || "Failed to fetch")
    return json
  })

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  super_admin: "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400",
  hr_manager: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  teacher: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
  staff: "bg-muted text-muted-foreground",
}

interface UsersTableProps {
  currentUserId: string
  isSuperAdmin: boolean
}

export function UsersTable({ currentUserId, isSuperAdmin }: UsersTableProps) {
  const { data: users, error, mutate } = useSWR<Profile[]>("/api/users", fetcher)
  const [search, setSearch] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const safeUsers = Array.isArray(users) ? users : []
  const filtered = safeUsers.filter((u) => {
    if (!search) return true
    const fullName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase()
    return (
      fullName.includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
  })

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingId(userId)
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      toast.success("Role updated successfully")
      mutate()
    } else {
      const data = await res.json()
      toast.error(data.error || "Failed to update role")
    }
    setUpdatingId(null)
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        Failed to load users. Please refresh.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Email</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!users ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {search ? "No users match your search." : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const isCurrentUser = u.id === currentUserId
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(u.first_name, u.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {u.first_name ?? ""} {u.last_name ?? ""}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground sm:hidden truncate max-w-[160px]">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      {isSuperAdmin && !isCurrentUser ? (
                        <Select
                          value={u.role}
                          onValueChange={(v) => handleRoleChange(u.id, v as UserRole)}
                          disabled={updatingId === u.id}
                        >
                          <SelectTrigger className="w-[140px] h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                              <SelectItem key={role} value={role} className="text-xs">
                                {ROLE_LABELS[role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={ROLE_BADGE_STYLES[u.role]}>
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
