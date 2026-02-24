import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const direction = url.searchParams.get("direction") ?? "sent" // 'sent' or 'received'

  let query = supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(id, first_name, last_name), recipient:profiles!messages_recipient_id_fkey(id, first_name, last_name)")
    .order("created_at", { ascending: false })

  if (direction === "sent") {
    query = query.eq("sender_id", user.id)
  } else {
    query = query.eq("recipient_id", user.id)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { recipient_id, subject, body: messageBody } = body

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      recipient_id,
      subject,
      body: messageBody,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
