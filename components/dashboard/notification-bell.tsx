"use client"

import { useEffect } from "react"
import useSWR from "swr"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, CheckCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/lib/types"
import { cn } from "@/lib/utils"

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : []))

const TYPE_ICONS: Record<string, string> = {
  leave_approved: "✓",
  leave_rejected: "✗",
  leave_pending: "!",
  leave_cancelled: "—",
  general: "•",
}

export function NotificationBell() {
  const { data: notifications, mutate } = useSWR<Notification[]>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 30000 }
  )

  const unread = (notifications ?? []).filter((n) => !n.is_read).length

  // Supabase Realtime: subscribe to new notifications for the current user
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => { mutate() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [mutate])

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" })
    mutate()
  }

  const markOneRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" })
    mutate()
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {(notifications ?? []).length === 0 ? (
            <div className="flex h-full items-center justify-center py-12 text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <div className="divide-y">
              {(notifications ?? []).map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && markOneRead(n.id)}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    !n.is_read && "bg-primary/5"
                  )}
                >
                  <span className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    n.type === "leave_approved" && "bg-green-500/10 text-green-700",
                    n.type === "leave_rejected" && "bg-destructive/10 text-destructive",
                    n.type === "leave_pending" && "bg-yellow-500/10 text-yellow-700",
                    (n.type === "leave_cancelled" || n.type === "general") && "bg-muted text-muted-foreground",
                  )}>
                    {TYPE_ICONS[n.type] ?? "•"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm leading-snug", !n.is_read && "font-semibold")}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {n.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
