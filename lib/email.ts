import { Resend } from 'resend'

interface EmployeeInvitationData {
  email: string
  firstName: string
  lastName: string
  employeeId: string
  tempPassword: string
}

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Send employee invitation email with temporary credentials
 * Uses Resend email service
 */
export async function sendEmployeeInvitationEmail(
  data: EmployeeInvitationData
) {
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev'

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
      .credentials { background-color: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; }
      .credentials-label { font-weight: bold; color: #1f2937; margin-top: 8px; margin-bottom: 3px; font-size: 12px; }
      .credentials-value { font-family: 'Courier New', monospace; background-color: #f3f4f6; padding: 8px; border-radius: 4px; word-break: break-all; }
      .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; }
      .steps { background-color: white; padding: 15px; margin: 15px 0; }
      .steps-list { counter-reset: step-counter; }
      .step { counter-increment: step-counter; margin: 10px 0; padding-left: 30px; position: relative; }
      .step:before { content: counter(step-counter); position: absolute; left: 0; background-color: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
      .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
      .button { background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block; margin: 15px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">Welcome to EduPay!</h1>
      </div>
      
      <div class="content">
        <p>Dear ${data.firstName} ${data.lastName},</p>
        
        <p>Your account has been created by your system administrator. You can now access EduPay and manage your payroll information.</p>

        <div class="warning">
          <strong>⚠️ IMPORTANT:</strong> Please keep your login credentials secure and do not share them with anyone.
        </div>

        <div class="credentials">
          <div class="credentials-label">Email Address:</div>
          <div class="credentials-value">${data.email}</div>
          
          <div class="credentials-label">Temporary Password:</div>
          <div class="credentials-value">${data.tempPassword}</div>
          
          <div class="credentials-label">Employee ID:</div>
          <div class="credentials-value">${data.employeeId}</div>
        </div>

        <h3>Getting Started:</h3>
        <div class="steps">
          <div class="steps-list">
            <div class="step">Visit <a href="${appUrl}/auth/login">${appUrl}/auth/login</a> to sign in</div>
            <div class="step">Use your email and temporary password from above</div>
            <div class="step">You'll be prompted to change your password on first login</div>
            <div class="step">Complete your profile information</div>
            <div class="step">You're all set! Start using EduPay</div>
          </div>
        </div>

        <a href="${appUrl}/auth/login" class="button">Sign In to EduPay</a>

        <h3>Security Tips:</h3>
        <ul>
          <li>Your password is temporary and must be changed on first login</li>
          <li>Never share your password or credentials with anyone</li>
          <li>Use a strong, unique password when you update it</li>
          <li>If you did not request this account, contact your IT department immediately</li>
        </ul>

        <p>If you need any assistance, please contact your HR or IT department.</p>

        <p>Best regards,<br><strong>EduPay System</strong></p>
      </div>

      <div class="footer">
        <p>This is an automated message from EduPay. Please do not reply to this email.</p>
      </div>
    </div>
  </body>
</html>
  `.trim()

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: data.email,
      subject: `Welcome to EduPay - Your Account is Ready`,
      html: htmlContent,
    })

    if (response.error) {
      console.error('[v0] Resend email error:', response.error)
      return {
        success: false,
        error: response.error.message,
      }
    }

    console.log('[v0] Invitation email sent successfully:', response.data?.id)
    return {
      success: true,
      message: `Invitation email sent to ${data.email}`,
    }
  } catch (error) {
    console.error('[v0] Error in sendEmployeeInvitationEmail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
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
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev'

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
      .button { background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block; margin: 15px 0; }
      .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">Reminder: Complete Your Setup</h1>
      </div>
      
      <div class="content">
        <p>Dear ${firstName} ${lastName},</p>
        
        <p>This is a friendly reminder that you haven't completed your first login setup yet.</p>

        <p>To fully activate your account, please complete these simple steps:</p>
        <ul>
          <li>Change your temporary password</li>
          <li>Complete your profile information</li>
        </ul>

        <a href="${appUrl}/auth/login" class="button">Complete Setup Now</a>

        <p>If you need any assistance, please contact your HR or IT department.</p>

        <p>Best regards,<br><strong>EduPay System</strong></p>
      </div>

      <div class="footer">
        <p>This is an automated message from EduPay. Please do not reply to this email.</p>
      </div>
    </div>
  </body>
</html>
  `.trim()

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Reminder: Complete Your EduPay Setup`,
      html: htmlContent,
    })

    if (response.error) {
      console.error('[v0] Resend email error:', response.error)
      return {
        success: false,
        error: response.error.message,
      }
    }

    console.log('[v0] Reminder email sent successfully:', response.data?.id)
    return {
      success: true,
      message: `Reminder email sent to ${email}`,
    }
  } catch (error) {
    console.error('[v0] Error sending reminder email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
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
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev'

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
      .details { background-color: white; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
      .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
      .detail-label { font-weight: bold; color: #1f2937; }
      .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">Account Created Successfully</h1>
      </div>
      
      <div class="content">
        <p>Dear ${adminName},</p>
        
        <p>This confirms that you have successfully created a new employee account in EduPay.</p>

        <div class="details">
          <div class="detail-row">
            <span class="detail-label">Employee Name:</span>
            <span>${employeeName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span>${employeeEmail}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Employee ID:</span>
            <span>${employeeId}</span>
          </div>
        </div>

        <p>The employee will receive an invitation email with their temporary credentials and login instructions.</p>

        <p>If you need any further assistance, please contact support.</p>

        <p>Best regards,<br><strong>EduPay System</strong></p>
      </div>

      <div class="footer">
        <p>This is an automated message from EduPay. Please do not reply to this email.</p>
      </div>
    </div>
  </body>
</html>
  `.trim()

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `Account Created: ${employeeName}`,
      html: htmlContent,
    })

    if (response.error) {
      console.error('[v0] Resend email error:', response.error)
      return {
        success: false,
        error: response.error.message,
      }
    }

    console.log('[v0] Admin notification email sent:', response.data?.id)
    return {
      success: true,
      message: `Notification sent to admin`,
    }
  } catch (error) {
    console.error('[v0] Error sending admin notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification',
    }
  }
}
