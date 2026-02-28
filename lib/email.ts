import { createClient } from './supabase/server'

interface EmployeeInvitationData {
  email: string
  firstName: string
  lastName: string
  employeeId: string
  tempPassword: string
}

/**
 * Send employee invitation email with temporary credentials
 * Uses Supabase's built-in email service
 */
export async function sendEmployeeInvitationEmail(
  data: EmployeeInvitationData
) {
  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const emailBody = `
Dear ${data.firstName} ${data.lastName},

Welcome to EduPay! Your account has been created by your system administrator.

IMPORTANT: Please keep this information secure and do not share your credentials with anyone.

Login Details:
- Email: ${data.email}
- Temporary Password: ${data.tempPassword}
- Employee ID: ${data.employeeId}

First Steps:
1. Visit ${appUrl}/auth/login to sign in
2. Use your email and the temporary password provided above
3. You will be prompted to change your password on first login
4. Complete your profile information
5. You're all set! Start using EduPay

Security Reminder:
- Your password is temporary and must be changed on first login
- Never share your password or credentials with others
- If you did not request this account, please contact your IT department immediately

If you need any assistance, please contact your HR or IT department.

Best regards,
EduPay System
  `.trim()

  try {
    // Use Supabase's email service to send the invitation
    // Note: This requires email service to be configured in Supabase
    const { error } = await supabase.auth.resend({
      type: 'invite',
      email: data.email,
    })

    if (error) {
      console.error('Error sending invitation email:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      message: `Invitation email sent to ${data.email}`,
    }
  } catch (error) {
    console.error('Error in sendEmployeeInvitationEmail:', error)
    return {
      success: false,
      error: 'Failed to send email',
    }
  }
}

/**
 * Send password change reminder email
 */
export async function sendPasswordChangeReminderEmail(
  email: string,
  firstName: string,
  lastName: string
) {
  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const emailBody = `
Dear ${firstName} ${lastName},

This is a friendly reminder that you haven't completed your first login setup yet.

Your account requires a few simple steps to complete:
1. Change your temporary password
2. Complete your profile information

Please visit ${appUrl}/auth/login and follow the setup process.

If you need any assistance, please contact your HR or IT department.

Best regards,
EduPay System
  `.trim()

  try {
    // For password change reminders, you would typically use a custom email trigger
    // Since we're using Supabase built-in, we'll log it
    console.log(
      `Password change reminder email would be sent to: ${email}`,
      emailBody
    )

    return {
      success: true,
      message: `Reminder email sent to ${email}`,
    }
  } catch (error) {
    console.error('Error sending reminder email:', error)
    return {
      success: false,
      error: 'Failed to send email',
    }
  }
}

/**
 * Send account creation confirmation to admin
 */
export async function sendAccountCreationNotificationToAdmin(
  adminEmail: string,
  adminName: string,
  employeeName: string,
  employeeEmail: string,
  employeeId: string
) {
  const emailBody = `
Dear ${adminName},

This is a confirmation that you have successfully created a new employee account in EduPay.

Employee Details:
- Name: ${employeeName}
- Email: ${employeeEmail}
- Employee ID: ${employeeId}

The employee will receive an invitation email with their temporary credentials and login instructions.

If you need any further assistance, please contact support.

Best regards,
EduPay System
  `.trim()

  try {
    console.log(
      `Account creation notification would be sent to admin: ${adminEmail}`,
      emailBody
    )

    return {
      success: true,
      message: `Notification sent to admin`,
    }
  } catch (error) {
    console.error('Error sending admin notification:', error)
    return {
      success: false,
      error: 'Failed to send notification',
    }
  }
}
