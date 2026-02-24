import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/audit-logs?page=1&limit=50&action=&entity_type=
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  // Audit logs are super_admin only
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50"), 10), 100)
  const action = searchParams.get("action") ?? ""
  const entityType = searchParams.get("entity_type") ?? ""

  let query = supabase
    .from("audit_logs")
    .select(
      "*, actor:profiles!audit_logs_actor_id_fkey(id, first_name, last_name, email)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (action) query = query.eq("action", action)
  if (entityType) query = query.eq("entity_type", entityType)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    logs: data ?? [],
    total: count ?? 0,
    page,
    limit,
    total_pages: Math.ceil((count ?? 0) / limit),
  })
}
