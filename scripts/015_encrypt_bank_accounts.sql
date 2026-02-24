-- 015_encrypt_bank_accounts.sql
-- Enable pgcrypto and add encrypted bank account column

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted shadow column to employees
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS bank_account_encrypted text;

-- Note: The plaintext bank_account_number column is kept for backwards compatibility
-- during migration. The application layer will:
--   1. Encrypt new values into bank_account_encrypted using pgp_sym_encrypt
--   2. Decrypt bank_account_encrypted on reads where available
--   3. Mask displayed values to last 4 digits only
-- The bank_account_number column can be nulled out after a full data migration run.

-- Helper function to check if a value looks like encrypted text
-- (pgp_sym_encrypt output starts with \xc0 bytes)
COMMENT ON COLUMN employees.bank_account_encrypted IS
  'PGP symmetrically encrypted bank account number. Use pgp_sym_encrypt/pgp_sym_decrypt with server-side key.';
