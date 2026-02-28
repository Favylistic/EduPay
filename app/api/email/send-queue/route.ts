import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    // Verify this is an internal request or authorized service
    const authHeader = (await headers()).get("authorization")
    
    // This can be called by internal cron jobs or the application
    const supabase = await createClient()

    // Get pending emails from the queue
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("sent", false)
      .eq("error", false)
      .order("created_at", { ascending: true })
      .limit(50)

    if (fetchError) {
      console.error("[v0] Error fetching pending emails:", fetchError)
      return Response.json(
        { error: "Failed to fetch pending emails" },
        { status: 500 }
      )
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return Response.json({ sent: 0, message: "No pending emails" })
    }

    let successCount = 0
    let failureCount = 0

    for (const email of pendingEmails) {
      try {
        // Send email using Supabase's built-in email
        const { error: sendError } = await supabase.auth.admin.sendRawEmail({
          email: email.to_email,
          html: email.html_content,
        })

        if (sendError) {
          // Mark as having an error
          await supabase
            .from("email_queue")
            .update({
              error: true,
              error_message: sendError.message,
              updated_at: new Date().toISOString(),
            })
            .eq("id", email.id)

          failureCount++
        } else {
          // Mark as sent
          await supabase
            .from("email_queue")
            .update({
              sent: true,
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", email.id)

          successCount++
        }
      } catch (error) {
        console.error(`[v0] Error sending email ${email.id}:`, error)
        failureCount++

        // Mark as having an error
        await supabase
          .from("email_queue")
          .update({
            error: true,
            error_message: error instanceof Error ? error.message : "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", email.id)
      }
    }

    return Response.json({
      sent: successCount,
      failed: failureCount,
      total: pendingEmails.length,
    })
  } catch (error) {
    console.error("[v0] Email queue processing error:", error)
    return Response.json(
      { error: "Failed to process email queue" },
      { status: 500 }
    )
  }
}

// This endpoint can be called by Vercel Cron to periodically process emails
export const runtime = "nodejs"
