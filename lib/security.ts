import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/lib/types"

/**
 * Verify that the current user is a super admin
 * Used for protecting admin-only endpoints and operations
 */
export async function verifySuperAdminAccess(): Promise<{
  isAuthorized: boolean
  profile: Profile | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        isAuthorized: false,
        profile: null,
        error: "Unauthorized - User not authenticated",
      }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return {
        isAuthorized: false,
        profile: null,
        error: "Unauthorized - Profile not found",
      }
    }

    // Check if super admin
    if (profile.role !== "super_admin") {
      return {
        isAuthorized: false,
        profile,
        error: "Forbidden - Super admin access required",
      }
    }

    return {
      isAuthorized: true,
      profile,
      error: null,
    }
  } catch (error) {
    console.error("[v0] Super admin verification error:", error)
    return {
      isAuthorized: false,
      profile: null,
      error: "Internal server error during authorization check",
    }
  }
}

/**
 * Log security audit events for compliance and monitoring
 */
export async function logAuditEvent(
  eventType:
    | "ACCOUNT_CREATED"
    | "ACCOUNT_DELETED"
    | "PASSWORD_CHANGED"
    | "PROFILE_UPDATED"
    | "ROLE_CHANGED"
    | "UNAUTHORIZED_ACCESS_ATTEMPT"
    | "SUSPICIOUS_ACTIVITY",
  userId: string,
  targetUserId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("account_creation_audit").insert({
      event_type: eventType,
      performed_by_id: userId,
      target_user_id: targetUserId,
      details: details || {},
      ip_address: null, // Can be enhanced to capture IP from request headers
      user_agent: null, // Can be enhanced to capture browser info
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Error logging audit event:", error)
    }
  } catch (error) {
    console.error("[v0] Audit logging error:", error)
  }
}

/**
 * Generate a secure temporary password
 */
export function generateTemporaryPassword(length: number = 16): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * Check if user's password is marked as temporary
 */
export async function isTemporaryPassword(
  userId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_temporary_password")
      .eq("id", userId)
      .single()

    if (error || !profile) {
      return false
    }

    return profile.is_temporary_password === true
  } catch (error) {
    console.error("[v0] Error checking temporary password status:", error)
    return false
  }
}

/**
 * Mark password as changed (no longer temporary)
 */
export async function markPasswordAsChanged(userId: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        is_temporary_password: false,
        password_changed_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("[v0] Error updating password status:", error)
    }

    // Log the password change audit event
    await logAuditEvent("PASSWORD_CHANGED", userId)
  } catch (error) {
    console.error("[v0] Error marking password as changed:", error)
  }
}

/**
 * Verify that password change is required
 * Returns true if password hasn't been changed yet
 */
export async function isPasswordChangeRequired(
  userId: string
): Promise<boolean> {
  const isTemp = await isTemporaryPassword(userId)
  return isTemp
}

/**
 * Rate limiting helper to prevent brute force attacks
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 300
): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  try {
    const supabase = await createClient()
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowSeconds * 1000)

    // Get recent attempts
    const { data: attempts, error } = await supabase
      .from("security_events")
      .select("id")
      .eq("event_key", key)
      .gte("created_at", windowStart.toISOString())
      .lte("created_at", now.toISOString())

    if (error) {
      // If there's an error, allow the request to proceed
      console.error("[v0] Rate limit check error:", error)
      return {
        allowed: true,
        remaining: maxAttempts,
        resetAt: new Date(now.getTime() + windowSeconds * 1000),
      }
    }

    const attemptCount = attempts?.length || 0
    const allowed = attemptCount < maxAttempts
    const remaining = Math.max(0, maxAttempts - attemptCount)
    const resetAt = new Date(now.getTime() + windowSeconds * 1000)

    if (!allowed) {
      // Log rate limit exceeded
      console.warn(`[v0] Rate limit exceeded for key: ${key}`)
    }

    return { allowed, remaining, resetAt }
  } catch (error) {
    console.error("[v0] Rate limiting error:", error)
    return {
      allowed: true,
      remaining: maxAttempts,
      resetAt: new Date(),
    }
  }
}
