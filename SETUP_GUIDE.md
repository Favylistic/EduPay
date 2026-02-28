# Account Creation Workflow - Quick Setup Guide

## What Changed

Your EduPay system now uses **admin-only account creation** instead of public sign-up. Here's what you need to know:

### For Super Admins

#### Creating New Employee Accounts
1. Go to **Dashboard → Users Management**
2. Click the **"Create Employee"** button (top right)
3. Fill in the form:
   - Email address
   - First name & last name
   - Department
   - Designation
   - Salary (optional)
4. Click **"Create Account"**
5. Employee ID auto-generates (EMP-001, EMP-002, etc.)
6. Invitation email automatically sent to employee

#### What Happens Next
- New employee receives email with login instructions
- On first login, they must change their temporary password
- They must complete their profile setup
- Dashboard shows a warning banner if setup is incomplete

### For New Employees

#### First Login
1. Receive email with login credentials
2. Go to login page and enter email + temporary password
3. You'll be redirected to "First Login" setup page
4. **Step 1**: Change your password to something secure
5. **Step 2**: Complete your profile (name, contact info, etc.)
6. Click **"Complete Setup"**
7. Access full dashboard with warning banner gone

#### Password Security
- Temporary passwords are sent via email only (never shown in admin panel)
- You MUST change your password on first login
- Use a strong password with mix of letters, numbers, and symbols

### Database Migrations

Two SQL migrations were executed:

#### 1. `010_account_creation_workflow.sql`
- Adds tracking fields to profiles table
- Creates employee ID sequence for auto-generation
- Sets up audit logging table
- Configures Row-Level Security (RLS)

#### 2. `011_email_triggers.sql`
- Creates email queue infrastructure
- Sets up automatic trigger to queue emails
- Adds email status tracking

**Status**: ✅ Already executed

### Email Sending Setup

The system queues emails automatically. To actually send them, you need to set up a periodic job:

#### Option 1: Vercel Cron (Recommended)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/email/send-queue",
    "schedule": "*/5 * * * *"
  }]
}
```

This calls `/api/email/send-queue` every 5 minutes to process pending emails.

#### Option 2: External Service
Call this endpoint from your external scheduler:
```
POST /api/email/send-queue
Authorization: Bearer YOUR_API_KEY
```

#### Option 3: Manual Testing
```bash
curl -X POST http://localhost:3000/api/email/send-queue
```

### Key Components Created

| Component | Location | Purpose |
|-----------|----------|---------|
| Create Employee Dialog | `components/users/create-employee-dialog.tsx` | Admin UI for creating accounts |
| First Login Form | `components/auth/first-login-form.tsx` | Multi-step password & profile setup |
| Setup Warning | `components/dashboard/setup-warning.tsx` | Non-blocking setup reminder |
| Security Utils | `lib/security.ts` | Audit logging, role checks, password utils |
| Admin API | `app/api/admin/create-employee/route.ts` | Backend endpoint for account creation |
| Email Queue API | `app/api/email/send-queue/route.ts` | Process queued emails |

### Security Features

✅ **Super-Admin Verification**: Only super admins can create accounts  
✅ **Audit Logging**: All account creation logged with creator, timestamp, details  
✅ **Secure Passwords**: Auto-generated temporary passwords, users must change  
✅ **First-Login Enforcement**: Users must change password before dashboard access  
✅ **Rate Limiting**: Protection against brute force attacks  
✅ **Profile Completion**: Optional setup warning until profile completed  
✅ **Email Security**: Passwords sent only via email, never shown in UI  

### Troubleshooting

#### Emails Not Sending
- Check email queue: `SELECT * FROM email_queue WHERE sent = false;`
- Verify `/api/email/send-queue` is being called
- Check Supabase email settings in project settings
- View error messages in `email_queue.error_message`

#### User Can't Login
- Check if account created successfully: `SELECT * FROM auth.users WHERE email = 'user@example.com';`
- Verify email confirmed: `email_confirmed_at` should not be null
- Check if redirected to `/auth/first-login` (expected behavior)

#### Employee ID Not Generated
- Verify migration executed: `SELECT * FROM employee_id_sequence;`
- Check next_id value increments with each creation
- Look for errors in API response

#### Super-Admin Verification Fails
- Verify user role in profiles table: `SELECT id, role FROM profiles WHERE id = 'user-uuid';`
- Ensure role is exactly `'super_admin'`
- Check middleware isn't blocking the request

### Testing

#### Test Admin Create Employee Endpoint
```bash
curl -X POST http://localhost:3000/api/admin/create-employee \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.teacher@school.edu",
    "firstName": "Test",
    "lastName": "Teacher",
    "department": "Science",
    "designation": "Physics Teacher",
    "salary": "50000"
  }'
```

#### Test Email Queue
```bash
curl -X POST http://localhost:3000/api/email/send-queue
```

### Configuration Checklist

- [ ] Super-admin account exists and has `role = 'super_admin'`
- [ ] Migrations 010 & 011 executed successfully
- [ ] Email queue table created: `SELECT COUNT(*) FROM email_queue;`
- [ ] Employee ID sequence initialized: `SELECT next_id FROM employee_id_sequence;`
- [ ] Audit table created: `SELECT COUNT(*) FROM account_creation_audit;`
- [ ] Email sending configured (Vercel Cron or external scheduler)
- [ ] Test account created via admin dialog
- [ ] Test first-login flow works
- [ ] Audit logs show account creation event

### Known Limitations

- Temporary passwords not displayed in UI (sent via email only)
- Email sending requires external scheduler setup
- Profile completion is optional warning, not blocking
- Batch employee import not yet available

### Support & Help

For issues or questions:
1. Check `ACCOUNT_CREATION_WORKFLOW.md` for detailed documentation
2. Review audit logs in `account_creation_audit` table
3. Check email queue status in `email_queue` table
4. Verify migrations executed: `SELECT version FROM migrations;`

---

**Need the complete technical documentation?** See `ACCOUNT_CREATION_WORKFLOW.md`
