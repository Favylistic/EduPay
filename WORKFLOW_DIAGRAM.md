# Account Creation Workflow - Visual Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      EduPay System                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SUPER ADMIN                                                │
│    ↓                                                        │
│  [Create Employee Dialog]                                   │
│    ├─ Email                                                 │
│    ├─ Name (First & Last)                                   │
│    ├─ Department                                            │
│    ├─ Designation                                           │
│    └─ Salary (optional)                                     │
│    ↓                                                        │
│  /api/admin/create-employee (POST)                         │
│    ├─ Verify Super Admin Role                              │
│    ├─ Validate Fields                                       │
│    ├─ Generate Temp Password                               │
│    ├─ Create Auth User                                      │
│    ├─ Generate Employee ID (EMP-001)                       │
│    ├─ Create Profile Record                                │
│    ├─ Create Employee Record                               │
│    ├─ Log to Audit Table                                   │
│    └─ Trigger: Queue Email                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Email Processing Flow

```
┌──────────────────────────────────────────────────────────────┐
│              Email Queue System                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Database Trigger (on new account)                          │
│    ↓                                                         │
│  INSERT INTO email_queue {                                  │
│    to_email: 'user@school.edu',                            │
│    html_content: '<welcome message>',                      │
│    sent: false,                                             │
│    error: false                                             │
│  }                                                          │
│    ↓                                                         │
│  [Async Processing - Every 5 minutes]                       │
│    ↓                                                         │
│  /api/email/send-queue (POST)                              │
│    ├─ Query: WHERE sent = false AND error = false          │
│    ├─ For Each Email:                                       │
│    │   ├─ Send via Supabase.auth.admin.sendRawEmail()     │
│    │   ├─ On Success: Update sent = true, sent_at = NOW()  │
│    │   └─ On Error: Update error = true, error_message     │
│    └─ Return {sent: 25, failed: 2, total: 27}             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## First Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│              First Login Experience                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. NEW EMPLOYEE RECEIVES EMAIL                            │
│     │                                                       │
│     ├─ From: system@school.edu                             │
│     ├─ Subject: Welcome to EduPay                          │
│     └─ Contains: Username (email), temp password info      │
│                                                             │
│  2. EMPLOYEE VISITS LOGIN PAGE                             │
│     │                                                       │
│     ├─ URL: /auth/login                                    │
│     ├─ Enters: email + temp password                       │
│     └─ Clicks: Sign In                                     │
│                                                             │
│  3. AUTH ACTION (lib/actions/auth.ts)                      │
│     │                                                       │
│     ├─ Verify credentials with Supabase.auth              │
│     ├─ Check: is_temporary_password = true                │
│     ├─ If true: Redirect to /auth/first-login             │
│     └─ If false: Redirect to /dashboard                   │
│                                                             │
│  4. FIRST-LOGIN PAGE (/auth/first-login)                  │
│     │                                                       │
│     └─ STEP 1: Change Password                            │
│        ├─ Input: Current password (verification)          │
│        ├─ Input: New password (strength validation)        │
│        ├─ Input: Confirm password                         │
│        └─ Status: ✓ Password Changed                       │
│                                                             │
│     └─ STEP 2: Complete Profile                           │
│        ├─ Input: First Name (optional, shows current)      │
│        ├─ Input: Last Name (optional, shows current)       │
│        ├─ Input: Phone Number                             │
│        ├─ Input: Bio/Notes                                │
│        └─ Status: ✓ Profile Completed                      │
│                                                             │
│  5. SUBMIT SETUP                                           │
│     │                                                       │
│     ├─ Update profiles:                                    │
│     │   ├─ is_temporary_password = false                  │
│     │   ├─ password_changed_at = NOW()                    │
│     │   └─ profile_completed_at = NOW()                   │
│     │                                                       │
│     ├─ Log to audit_events:                               │
│     │   ├─ event_type: PASSWORD_CHANGED                   │
│     │   ├─ event_type: PROFILE_UPDATED                    │
│     │   └─ timestamp and details                          │
│     │                                                       │
│     └─ Redirect to /dashboard                             │
│                                                             │
│  6. DASHBOARD                                              │
│     │                                                       │
│     └─ SetupWarning Component                             │
│        ├─ Check: password_changed_at (✓)                  │
│        ├─ Check: profile_completed_at (✓)                 │
│        └─ If all complete: No warning shown               │
│        └─ If incomplete: Show warning banner              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Additions

### profiles table (additions)
```sql
ALTER TABLE profiles ADD COLUMN (
  password_changed_at timestamp,           -- When user changed temp password
  profile_completed_at timestamp,          -- When user completed profile
  is_temporary_password boolean DEFAULT true  -- Using temp credentials
);
```

### employee_id_sequence table
```sql
CREATE TABLE employee_id_sequence (
  id uuid PRIMARY KEY,
  next_id integer DEFAULT 1,    -- Incremented with each new employee
  created_at timestamp
);
-- Stores: EMP-001, EMP-002, EMP-003, ...
```

### account_creation_audit table
```sql
CREATE TABLE account_creation_audit (
  id uuid PRIMARY KEY,
  event_type text,              -- ACCOUNT_CREATED, PASSWORD_CHANGED, etc.
  performed_by_id uuid,         -- Admin who created account
  target_user_id uuid,          -- Employee created
  details jsonb,                -- Extra info (dept, salary, etc.)
  ip_address text,              -- Can be enhanced
  user_agent text,              -- Can be enhanced
  created_at timestamp
);
```

### email_queue table
```sql
CREATE TABLE email_queue (
  id uuid PRIMARY KEY,
  to_email text,                -- Recipient address
  subject text,                 -- Email subject
  html_content text,            -- HTML email body
  sent boolean DEFAULT false,   -- Delivery status
  sent_at timestamp,            -- When sent
  error boolean DEFAULT false,  -- Error occurred
  error_message text,           -- Error details
  retry_count integer DEFAULT 0,
  created_at timestamp,
  updated_at timestamp
);
```

## Security Flow

```
┌────────────────────────────────────────────────────┐
│         Super Admin Authorization Check            │
├────────────────────────────────────────────────────┤
│                                                    │
│  Request to /api/admin/create-employee            │
│    ↓                                               │
│  verifySuperAdminAccess()                         │
│    ├─ Get current user from auth session          │
│    ├─ Query profiles table for user record        │
│    ├─ Check: profile.role === 'super_admin'      │
│    ├─ If not super_admin:                         │
│    │   └─ logAuditEvent('UNAUTHORIZED_ACCESS..') │
│    │   └─ Return 401 Unauthorized                 │
│    └─ If super_admin:                             │
│        └─ Return {isAuthorized: true}             │
│                                                    │
│  Audit Logging on All Account Creates             │
│    └─ Timestamp, creator ID, created user,       │
│       details (dept, salary) logged               │
│                                                    │
└────────────────────────────────────────────────────┘
```

## User Roles & Permissions

```
┌─────────────────────────────────────────────┐
│           Role-Based Access                 │
├─────────────────────────────────────────────┤
│                                             │
│  Super Admin                                │
│  ├─ Can create new employee accounts       │
│  ├─ Can view user management              │
│  ├─ Can access admin dashboard            │
│  └─ Can view audit logs                   │
│                                             │
│  Staff / Teacher                            │
│  ├─ Cannot create accounts                │
│  ├─ Cannot access user management         │
│  ├─ Can view own dashboard                │
│  ├─ Can change own password               │
│  └─ Must complete profile on first login  │
│                                             │
│  Public User (Not Authenticated)            │
│  ├─ Can view /auth/sign-up page          │
│  │   (shows "restricted" message)         │
│  ├─ Can visit /auth/login                 │
│  └─ Cannot access /dashboard              │
│                                             │
└─────────────────────────────────────────────┘
```

## File Dependency Graph

```
Admin Creates Employee
  ↓
components/users/create-employee-dialog.tsx
  ├─ calls → /api/admin/create-employee
  │           ├─ uses → lib/security.ts (verifySuperAdminAccess)
  │           ├─ uses → lib/email.ts (email template)
  │           ├─ uses → Supabase admin API
  │           └─ logs → account_creation_audit table
  │               ↓
  │           database trigger fires
  │               ↓
  │           email_queue table (INSERT)
  │
  └─ updates → dashboard/users/page.tsx
                ├─ shows → recent account creations
                └─ displays → employee ID, status

New Employee First Login
  ↓
/auth/login (components/auth/login-form.tsx)
  ↓
lib/actions/auth.ts
  ├─ checks → is_temporary_password
  └─ redirects → /auth/first-login

/auth/first-login/page.tsx
  ↓
components/auth/first-login-form.tsx
  ├─ step 1: change password
  │   └─ calls → lib/security.ts (markPasswordAsChanged)
  ├─ step 2: complete profile
  └─ on complete → redirect to /dashboard

/dashboard/page.tsx
  ├─ imports → SetupWarning component
  └─ shows → warning if setup incomplete

components/dashboard/setup-warning.tsx
  ├─ checks → password_changed_at, profile_completed_at
  └─ displays → banner with pending tasks

Periodic Email Sending
  ↓
/api/email/send-queue
  ├─ queries → email_queue table
  ├─ sends → via supabase.auth.admin.sendRawEmail()
  └─ updates → email_queue (sent status)
```

## Comparison: Before vs After

### Before (Public Sign-Up)
```
Public User
  ↓
/auth/sign-up page
  ↓
Fill registration form
  ↓
Create account directly
  ↓
Login immediately
  ↓
/dashboard
```

### After (Admin-Only)
```
Super Admin
  ↓
/dashboard/users (Create Employee button)
  ↓
Fill employee creation form
  ↓
POST /api/admin/create-employee
  ├─ verify admin role
  ├─ generate temp password + employee ID
  ├─ create account in auth
  ├─ create profile & employee records
  └─ queue email
     ↓
     Email Processing (periodic)
      ↓
      Send to employee inbox
      ↓
      NEW EMPLOYEE RECEIVES EMAIL
      ↓
      Login with temp credentials
      ↓
      /auth/first-login (REQUIRED)
      ├─ Change password
      └─ Complete profile
      ↓
      /dashboard (with setup warning until complete)
```

## Key Metrics to Monitor

```
✓ Account Creation Rate
  └─ Query: SELECT COUNT(*) FROM account_creation_audit 
            WHERE created_at > NOW() - INTERVAL '7 days';

✓ Email Queue Status
  └─ Query: SELECT 
       (SELECT COUNT(*) FROM email_queue WHERE sent = true) as sent,
       (SELECT COUNT(*) FROM email_queue WHERE sent = false) as pending,
       (SELECT COUNT(*) FROM email_queue WHERE error = true) as failed;

✓ First-Login Completion Rate
  └─ Query: SELECT 
       (SELECT COUNT(*) FROM profiles WHERE password_changed_at IS NOT NULL) as changed,
       (SELECT COUNT(*) FROM profiles WHERE profile_completed_at IS NOT NULL) as completed;

✓ Audit Events
  └─ Query: SELECT event_type, COUNT(*) 
            FROM account_creation_audit 
            GROUP BY event_type 
            ORDER BY event_type;
```

---

For detailed implementation info, see `ACCOUNT_CREATION_WORKFLOW.md`  
For quick setup, see `SETUP_GUIDE.md`
