# Resend Email Integration Setup

## Overview

The EduPay application now uses **Resend** as the email provider instead of Supabase's built-in email service. This provides better reliability, no rate limits, and professional HTML email templates.

## Changes Made

### 1. **Email Domain Whitelist**
- Database migration added to allow specific email domains
- Pre-configured domains: `gmail.com`, `outlook.com`, `yahoo.com`, `test.com`
- Admins can manage allowed domains via the `email_domain_whitelist` table

### 2. **Email Service Implementation** (`lib/email.ts`)
- Migrated from Supabase email to Resend
- Three email templates implemented:
  - **Employee Invitation**: Welcome email with login credentials
  - **Password Change Reminder**: Prompted when setup incomplete
  - **Admin Notification**: Confirmation when accounts are created

### 3. **API Updates** (`app/api/admin/create-employee/route.ts`)
- Added email domain validation against whitelist
- Integrated Resend email sending (non-blocking)
- Sends emails to both employee and admin
- Better error messages for email domain restrictions

### 4. **Dependencies**
- Added `resend@^3.0.0` to `package.json`

## Required Environment Variables

Add the following to your Vercel project settings or `.env.local`:

```
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com (optional, defaults to noreply@resend.dev)
```

## How to Get Resend API Key

1. Visit [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Go to the API Keys section in your dashboard
4. Copy your API key
5. Add it to your Vercel project environment variables

## Testing Gmail Accounts

Gmail is now whitelisted by default. You can test with:
- `testuser@gmail.com`
- `youremail@gmail.com`
- Any valid Gmail address

To add more domains, insert into the `email_domain_whitelist` table:

```sql
INSERT INTO email_domain_whitelist (domain, description, is_active)
VALUES ('yourdomain.edu', 'School domain', true);
```

## Email Flow

### When Admin Creates an Employee:

1. ✅ Super admin verification
2. ✅ Email domain validation against whitelist
3. ✅ Auth user creation in Supabase
4. ✅ Employee profile created
5. ✅ Temporary password generated
6. ✅ **Invitation email sent to employee** (via Resend)
7. ✅ **Confirmation email sent to admin** (via Resend)
8. ✅ Audit log recorded

### Email Templates

All emails include:
- Professional HTML styling
- Clear call-to-action buttons
- Security warnings and tips
- Footer with branding

## Email Sending Process

- **Non-blocking**: Email sending failures don't prevent account creation
- **Async**: Emails are sent in the background
- **Logged**: Email sending errors are logged to console for debugging
- **Retried**: Resend automatically retries failed emails

## Troubleshooting

### "Email domain is not allowed"
- The email domain is not in the whitelist
- Add the domain to `email_domain_whitelist` table
- Or use a whitelisted domain (gmail.com, outlook.com, etc.)

### "Email not being received"
- Check RESEND_API_KEY is correctly set
- Verify sender email matches your Resend account
- Check spam/junk folder
- Review Resend dashboard for delivery status

### "RESEND_API_KEY not found"
- Set the environment variable in Vercel project settings
- Restart the development server
- Re-run the application

## Customizing Email Templates

Edit email templates in `lib/email.ts`:
- `sendEmployeeInvitationEmail()` - Main invitation
- `sendPasswordChangeReminderEmail()` - Reminder email
- `sendAccountCreationNotificationToAdmin()` - Admin confirmation

Each function contains the HTML template that can be customized with your branding.

## Managing Allowed Domains

### Add a domain:
```sql
INSERT INTO email_domain_whitelist (domain, description, is_active)
VALUES ('newdomain.com', 'Test domain', true);
```

### Remove a domain:
```sql
UPDATE email_domain_whitelist 
SET is_active = false 
WHERE domain = 'domain.com';
```

### List all domains:
```sql
SELECT domain, description, is_active 
FROM email_domain_whitelist 
WHERE is_active = true;
```

## Security Notes

- Temporary passwords are only sent via email, never displayed in UI
- Email addresses are validated before user creation
- All account creation events are logged in audit table
- Admin access is verified before creating accounts

## Rate Limiting

Resend provides:
- 3,000 emails/day on free plan
- Unlimited on paid plans
- No rate limiting on API calls

This is significantly better than Supabase's rate limits.
