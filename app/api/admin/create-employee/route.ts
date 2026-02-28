import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdminAccess, logAuditEvent, generateTemporaryPassword } from '@/lib/security'
import { sendEmployeeInvitationEmail, sendAccountCreationNotificationToAdmin } from '@/lib/email'

// Generate Employee ID using the sequence
async function generateEmployeeId(supabase: any): Promise<string> {
  const { data: sequence, error } = await supabase
    .from('employee_id_sequence')
    .select('next_id')
    .single()

  if (error) {
    throw new Error('Failed to generate Employee ID')
  }

  const nextId = sequence.next_id
  const employeeId = `EMP-${String(nextId).padStart(3, '0')}`

  // Update the sequence
  await supabase
    .from('employee_id_sequence')
    .update({ next_id: nextId + 1 })
    .eq('id', sequence.id)

  return employeeId
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify super admin access
    const adminAccess = await verifySuperAdminAccess()

    if (!adminAccess.isAuthorized || !adminAccess.profile) {
      // Log unauthorized access attempt
      if (adminAccess.profile) {
        await logAuditEvent(
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          adminAccess.profile.id,
          undefined,
          { endpoint: '/api/admin/create-employee', reason: 'Insufficient permissions' }
        )
      }

      return NextResponse.json(
        { error: adminAccess.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const currentUserId = adminAccess.profile.id

    // Parse request body
    const {
      email,
      firstName,
      lastName,
      department,
      designation,
      salary,
    } = await request.json()

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Check if email domain is whitelisted
    const emailDomain = email.split('@')[1].toLowerCase()
    const { data: domainWhitelist } = await supabase
      .from('email_domain_whitelist')
      .select('domain')
      .eq('domain', emailDomain)
      .single()

    if (!domainWhitelist) {
      return NextResponse.json(
        { error: `Email domain '@${emailDomain}' is not allowed. Please use an authorized domain.` },
        { status: 400 }
      )
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false, // Don't auto-confirm - let admin send invitation
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'staff',
      },
    })

    if (authError) {
      console.error('[v0] Auth creation error:', authError)
      
      // Provide more helpful error messages
      let errorMessage = authError.message
      
      if (authError.message.includes('User not allowed')) {
        errorMessage = 'Email domain is not allowed. Please use a different email address or contact Supabase support to whitelist this domain.'
      } else if (authError.message.includes('already registered')) {
        errorMessage = 'This email address is already registered in the system.'
      } else if (authError.message.includes('invalid email')) {
        errorMessage = 'Please provide a valid email address.'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // Generate Employee ID
    const employeeId = await generateEmployeeId(supabase)

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        employee_id: employeeId,
        role: 'staff',
        is_temporary_password: true,
        password_changed_at: null,
        profile_completed_at: null,
      })

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Create employee record if department/designation/salary provided
    if (department || designation || salary) {
      await supabase.from('employees').insert({
        user_id: userId,
        department,
        designation,
        salary: salary ? parseFloat(salary) : null,
        employee_id: employeeId,
      })
    }

    // Log account creation via audit system
    await logAuditEvent(
      'ACCOUNT_CREATED',
      currentUserId,
      userId,
      {
        email,
        firstName,
        lastName,
        employeeId,
        department,
        designation,
        salary: salary ? 'SET' : 'NOT_SET',
      }
    )

    // Create user setup status record
    await supabase
      .from('user_setup_status')
      .insert({
        user_id: userId,
        password_changed: false,
        profile_completed: false,
      })

    // Send invitation email to employee (non-blocking)
    sendEmployeeInvitationEmail({
      email,
      firstName,
      lastName,
      employeeId,
      tempPassword,
    }).catch((err) => {
      console.error('[v0] Failed to send invitation email:', err)
      // Don't fail the account creation if email fails
    })

    // Send notification to admin (non-blocking)
    sendAccountCreationNotificationToAdmin(
      adminAccess.profile.email || 'admin@edupay.app',
      `${adminAccess.profile.first_name} ${adminAccess.profile.last_name}`,
      `${firstName} ${lastName}`,
      email,
      employeeId
    ).catch((err) => {
      console.error('[v0] Failed to send admin notification:', err)
    })

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        employeeId,
        firstName,
        lastName,
      },
      message: 'Employee account created successfully. Invitation email is being sent.',
    })
  } catch (error) {
    console.error('[v0] Error creating employee account:', error)

    // Log the error for security monitoring
    await logAuditEvent(
      'SUSPICIOUS_ACTIVITY',
      'SYSTEM',
      undefined,
      {
        endpoint: '/api/admin/create-employee',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    ).catch(() => {
      // Fail silently if logging fails
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
