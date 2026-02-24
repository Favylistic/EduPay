import { createClient } from "@/lib/supabase/server"

export type AuditAction =
  | "payroll_run_created"
  | "payslip_status_updated"
  | "employee_created"
  | "employee_updated"
  | "employee_deleted"
  | "leave_approved"
  | "leave_rejected"
  | "leave_cancelled"
  | "salary_component_created"
  | "salary_component_updated"
  | "salary_component_deleted"
  | "payslip_pdf_downloaded"

export interface AuditMeta {
  [key: string]: string | number | boolean | null | undefined
}

/**
 * Writes a row to `audit_logs`. Silently swallows errors so it never breaks
 * the caller's main flow.
 */
export async function writeAuditLog(
  action: AuditAction,
  entityType: string,
  entityId: string,
  meta: AuditMeta = {}
): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from("audit_logs").insert({
      actor_id: user?.id ?? null,
      actor_profile_id: user?.id ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      meta,
    })
  } catch {
    // Never let audit logging crash the main request
  }
}
