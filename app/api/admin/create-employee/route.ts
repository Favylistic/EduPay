import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Generate a secure temporary password
function generateTemporaryPassword(): string {
  return crypto.randomBytes(8).toString('hex').slice(0, 12)
}

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

    // Verify admin access
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is super admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (adminProfile?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can create employee accounts' },
        { status: 403 }
      )
    }

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

    // Generate temporary password
    const tempPassword = generateTemporaryPassword()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'staff',
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
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

    // Log account creation
    await supabase
      .from('account_creation_audit')
      .insert({
        admin_id: currentUser.id,
        created_user_id: userId,
        employee_id: employeeId,
        email,
        first_name: firstName,
        last_name: lastName,
        department: department || null,
        designation: designation || null,
        created_at: new Date().toISOString(),
      })

    // Create user setup status record
    await supabase
      .from('user_setup_status')
      .insert({
        user_id: userId,
        password_changed: false,
        profile_completed: false,
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
      message: 'Employee account created successfully. Email notification will be sent.',
    })
  } catch (error) {
    console.error('Error creating employee account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
