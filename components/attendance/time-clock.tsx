"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import useSWR from "swr"
import { Clock, LogIn, LogOut, MapPin, MapPinOff, Loader2 } from "lucide-react"
import type { AttendanceRecord } from "@/lib/types"
import { ATTENDANCE_STATUS_COLORS, ATTENDANCE_STATUS_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface TimeClockProps {
  employeeId: string
  employeeName: string
}

export function TimeClock({ employeeId, employeeName }: TimeClockProps) {
  const [now, setNow] = useState(new Date())
  const [notes, setNotes] = useState("")
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { data: todayRecord, mutate } = useSWR<AttendanceRecord | null>(
    `/api/attendance/today?employee_id=${employeeId}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.")
      return
    }
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationEnabled(true)
        setLocationLoading(false)
        toast.success("Location captured.")
      },
      () => {
        toast.error("Could not get location. Check browser permissions.")
        setLocationLoading(false)
      }
    )
  }, [])

  const handleCheckIn = async () => {
    setSubmitting(true)
    try {
      const now = new Date()
      const timeStr = now.toTimeString().split(" ")[0] // HH:MM:SS
      const dateStr = now.toISOString().split("T")[0]

      // Determine status — late if after 9:00 AM
      const hour = now.getHours()
      const status = hour >= 9 ? "late" : "present"

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          date: dateStr,
          check_in: `${dateStr}T${timeStr}`,
          status,
          latitude: location?.lat ?? null,
          longitude: location?.lng ?? null,
          notes: notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to check in")
      }

      toast.success("Checked in successfully!")
      setNotes("")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check-in failed")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckOut = async () => {
    if (!todayRecord) return
    setSubmitting(true)
    try {
      const now = new Date()
      const timeStr = now.toTimeString().split(" ")[0]
      const dateStr = now.toISOString().split("T")[0]

      const res = await fetch(`/api/attendance/${todayRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_out: `${dateStr}T${timeStr}`,
          status: todayRecord.status,
          notes: notes.trim() || todayRecord.notes,
          latitude: location?.lat ?? todayRecord.latitude,
          longitude: location?.lng ?? todayRecord.longitude,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to check out")
      }

      toast.success("Checked out successfully!")
      setNotes("")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check-out failed")
    } finally {
      setSubmitting(false)
    }
  }

  const isCheckedIn = !!todayRecord?.check_in
  const isCheckedOut = !!todayRecord?.check_out

  function formatTime(isoString: string | null) {
    if (!isoString) return "--:--"
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  function formatDuration(checkIn: string | null, checkOut: string | null) {
    if (!checkIn) return null
    const end = checkOut ? new Date(checkOut) : new Date()
    const diffMs = end.getTime() - new Date(checkIn).getTime()
    const h = Math.floor(diffMs / 3600000)
    const m = Math.floor((diffMs % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Live clock card */}
      <Card className="flex flex-col items-center justify-center py-8 gap-3">
        <Clock className="h-8 w-8 text-primary" />
        <p className="text-5xl font-mono font-bold tracking-tight tabular-nums text-foreground">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
        <p className="text-sm text-muted-foreground">
          {now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <p className="text-sm font-medium text-foreground">{employeeName}</p>
        {todayRecord && (
          <Badge
            variant="outline"
            className={cn("mt-1", ATTENDANCE_STATUS_COLORS[todayRecord.status])}
          >
            {ATTENDANCE_STATUS_LABELS[todayRecord.status]}
          </Badge>
        )}
      </Card>

      {/* Check-in/out card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s Attendance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Status row */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Check In</p>
              <p className="font-mono font-semibold text-foreground">
                {formatTime(todayRecord?.check_in ?? null)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Check Out</p>
              <p className="font-mono font-semibold text-foreground">
                {formatTime(todayRecord?.check_out ?? null)}
              </p>
            </div>
          </div>

          {isCheckedIn && (
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="font-semibold tabular-nums">
                {formatDuration(todayRecord?.check_in ?? null, todayRecord?.check_out ?? null)}
              </p>
            </div>
          )}

          {/* Notes */}
          {!isCheckedOut && (
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any notes for today..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-20 resize-none text-sm"
              />
            </div>
          )}

          {/* Location toggle */}
          {!isCheckedOut && (
            <Button
              variant="outline"
              size="sm"
              onClick={locationEnabled ? () => { setLocation(null); setLocationEnabled(false) } : requestLocation}
              disabled={locationLoading}
              className="gap-2 self-start text-xs"
            >
              {locationLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : locationEnabled ? (
                <MapPin className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <MapPinOff className="h-3.5 w-3.5" />
              )}
              {locationEnabled ? "Location captured" : "Enable geolocation"}
            </Button>
          )}

          {/* Action button */}
          {!isCheckedIn ? (
            <Button onClick={handleCheckIn} disabled={submitting} className="gap-2 mt-auto">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Check In
            </Button>
          ) : !isCheckedOut ? (
            <Button onClick={handleCheckOut} disabled={submitting} variant="outline" className="gap-2 mt-auto">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Check Out
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground text-center mt-auto py-2">
              You have completed attendance for today.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
