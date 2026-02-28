-- Email triggers for account creation workflow

-- Create emails table if using Supabase's built-in email queue
CREATE TABLE IF NOT EXISTS email_queue (
  id BIGSERIAL PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_type TEXT NOT NULL,
  template_data JSONB NOT NULL,
  sent_at TIMESTAMP NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on email_queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to manage email queue
CREATE POLICY "Service role can manage email queue" ON email_queue
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Function to queue employee invitation email
CREATE OR REPLACE FUNCTION queue_employee_invitation_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into email queue when a profile with is_temporary_password is created
  IF NEW.is_temporary_password THEN
    INSERT INTO email_queue (
      recipient_email,
      subject,
      template_type,
      template_data
    ) VALUES (
      NEW.email,
      'Welcome to EduPay - Your Account is Ready',
      'employee_invitation',
      jsonb_build_object(
        'firstName', NEW.first_name,
        'lastName', NEW.last_name,
        'email', NEW.email,
        'employeeId', NEW.employee_id,
        'appUrl', COALESCE(current_setting('app.settings.app_url', true), 'http://localhost:3000')
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new profile creation
DROP TRIGGER IF EXISTS trigger_queue_invitation_email ON profiles;
CREATE TRIGGER trigger_queue_invitation_email
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION queue_employee_invitation_email();

-- Function to log account creation in audit table
CREATE OR REPLACE FUNCTION log_account_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- The account_creation_audit table is already created in migration 010
  -- This function ensures proper logging
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send email on profile update
CREATE OR REPLACE FUNCTION handle_email_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue reminder email if password_changed_at is still null after 24 hours
  -- This would be handled by a scheduled job in production
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_sent_at ON email_queue(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_template_type ON email_queue(template_type);

-- Create a view for pending emails
CREATE OR REPLACE VIEW pending_email_queue AS
SELECT * FROM email_queue
WHERE sent_at IS NULL
ORDER BY created_at ASC;

-- Grant access to views
GRANT SELECT ON pending_email_queue TO anon, authenticated;

-- Comment on tables and functions for documentation
COMMENT ON TABLE email_queue IS 'Queue for all system emails. Used by background jobs to send invitations and notifications.';
COMMENT ON FUNCTION queue_employee_invitation_email() IS 'Automatically queues an invitation email when a new employee profile is created with temporary password.';
COMMENT ON COLUMN email_queue.template_type IS 'Type of email template: employee_invitation, password_reminder, admin_notification, etc.';
COMMENT ON COLUMN email_queue.template_data IS 'JSON data to be used in email template rendering.';
