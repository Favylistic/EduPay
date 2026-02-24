-- =============================================================
-- 017_seed_demo_data.sql
-- EduPay Comprehensive Demo Data Seed
-- Run this in the Supabase SQL Editor (Service Role / bypasses RLS)
-- All FK chains are resolved via explicit UUIDs defined upfront.
-- =============================================================

-- ─── Safety: wipe existing seed data if re-running ────────────────────────────
DELETE FROM payslips             WHERE payroll_run_id IN (SELECT id FROM payroll_runs WHERE year = 2025 AND month = 1);
DELETE FROM payroll_runs         WHERE year = 2025 AND month = 1;
DELETE FROM employee_salary_components WHERE employee_id IN (SELECT id FROM employees WHERE employee_id LIKE 'EP-%');
DELETE FROM attendance_records   WHERE employee_id IN (SELECT id FROM employees WHERE employee_id LIKE 'EP-%');
DELETE FROM leave_requests       WHERE employee_id IN (SELECT id FROM employees WHERE employee_id LIKE 'EP-%');
DELETE FROM employees            WHERE employee_id LIKE 'EP-%';
DELETE FROM profiles             WHERE email LIKE '%@edupay.school';
DELETE FROM departments          WHERE name IN ('Administration','Mathematics','Sciences','Languages','Support Staff');
DELETE FROM designations         WHERE title IN ('Principal','Vice Principal','HR Manager','Senior Teacher','Junior Teacher','Lab Technician','Head of Department','Administrative Officer','Librarian','Janitor');


-- =============================================================
-- 1. DEPARTMENTS
-- =============================================================
INSERT INTO departments (id, name, description, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Administration',  'School leadership and administrative operations',      true),
  ('a1000000-0000-0000-0000-000000000002', 'Mathematics',     'Mathematics and applied sciences teaching department', true),
  ('a1000000-0000-0000-0000-000000000003', 'Sciences',        'Biology, Chemistry, and Physics instruction',         true),
  ('a1000000-0000-0000-0000-000000000004', 'Languages',       'English, French, and Literature instruction',         true),
  ('a1000000-0000-0000-0000-000000000005', 'Support Staff',   'Facilities, library, and operational support',        true);


-- =============================================================
-- 2. DESIGNATIONS  (no base_salary column — kept in employees.base_salary)
-- =============================================================
INSERT INTO designations (id, title, description, is_active) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Principal',               'Head of school — overall leadership and strategy',       true),
  ('b1000000-0000-0000-0000-000000000002', 'Vice Principal',          'Deputy head — curriculum and discipline oversight',      true),
  ('b1000000-0000-0000-0000-000000000003', 'HR Manager',              'Human resources operations and payroll administration',  true),
  ('b1000000-0000-0000-0000-000000000004', 'Head of Department',      'Academic department lead and curriculum coordinator',    true),
  ('b1000000-0000-0000-0000-000000000005', 'Senior Teacher',          'Experienced classroom teacher and mentor',               true),
  ('b1000000-0000-0000-0000-000000000006', 'Junior Teacher',          'Entry-level classroom instruction',                     true),
  ('b1000000-0000-0000-0000-000000000007', 'Lab Technician',          'Science laboratory management and safety',              true),
  ('b1000000-0000-0000-0000-000000000008', 'Administrative Officer',  'Administrative support and records management',          true),
  ('b1000000-0000-0000-0000-000000000009', 'Librarian',               'Library resources and information services',             true),
  ('b1000000-0000-0000-0000-000000000010', 'Janitor',                 'Facilities cleaning and maintenance',                    true);


-- =============================================================
-- 3. PROFILES  (20 employees — no auth.users entries needed for demo)
-- These profiles are inserted directly; profile_id on employees links here.
-- =============================================================
INSERT INTO profiles (id, first_name, last_name, email, role) VALUES
  -- Administration (super_admin / hr_manager)
  ('c1000000-0000-0000-0000-000000000001', 'Margaret', 'Okonkwo',   'margaret.okonkwo@edupay.school',   'super_admin'),
  ('c1000000-0000-0000-0000-000000000002', 'David',    'Mensah',    'david.mensah@edupay.school',       'hr_manager'),
  ('c1000000-0000-0000-0000-000000000003', 'Fatima',   'Al-Hassan', 'fatima.alhassan@edupay.school',    'staff'),
  -- Mathematics
  ('c1000000-0000-0000-0000-000000000004', 'James',    'Kariuki',   'james.kariuki@edupay.school',      'teacher'),
  ('c1000000-0000-0000-0000-000000000005', 'Amara',    'Diallo',    'amara.diallo@edupay.school',       'teacher'),
  ('c1000000-0000-0000-0000-000000000006', 'Priya',    'Nair',      'priya.nair@edupay.school',         'teacher'),
  -- Sciences
  ('c1000000-0000-0000-0000-000000000007', 'Samuel',   'Acheampong','samuel.acheampong@edupay.school',  'teacher'),
  ('c1000000-0000-0000-0000-000000000008', 'Lindiwe',  'Dlamini',   'lindiwe.dlamini@edupay.school',    'teacher'),
  ('c1000000-0000-0000-0000-000000000009', 'Omar',     'Farouk',    'omar.farouk@edupay.school',        'staff'),
  -- Languages
  ('c1000000-0000-0000-0000-000000000010', 'Claire',   'Beaumont',  'claire.beaumont@edupay.school',    'teacher'),
  ('c1000000-0000-0000-0000-000000000011', 'Kofi',     'Asante',    'kofi.asante@edupay.school',        'teacher'),
  ('c1000000-0000-0000-0000-000000000012', 'Yuki',     'Tanaka',    'yuki.tanaka@edupay.school',        'teacher'),
  -- Support Staff
  ('c1000000-0000-0000-0000-000000000013', 'Beatrice', 'Owusu',     'beatrice.owusu@edupay.school',     'staff'),
  ('c1000000-0000-0000-0000-000000000014', 'Emmanuel', 'Nkrumah',   'emmanuel.nkrumah@edupay.school',   'staff'),
  -- Additional staff across depts
  ('c1000000-0000-0000-0000-000000000015', 'Aisha',    'Balogun',   'aisha.balogun@edupay.school',      'teacher'),
  ('c1000000-0000-0000-0000-000000000016', 'Patrick',  'Kimani',    'patrick.kimani@edupay.school',     'teacher'),
  ('c1000000-0000-0000-0000-000000000017', 'Nadia',    'Petrov',    'nadia.petrov@edupay.school',       'teacher'),
  ('c1000000-0000-0000-0000-000000000018', 'Felix',    'Adeola',    'felix.adeola@edupay.school',       'staff'),
  ('c1000000-0000-0000-0000-000000000019', 'Grace',    'Mwangi',    'grace.mwangi@edupay.school',       'teacher'),
  ('c1000000-0000-0000-0000-000000000020', 'Ibrahim',  'Sesay',     'ibrahim.sesay@edupay.school',      'staff');


-- =============================================================
-- 4. EMPLOYEES  (20 records linked to profiles above)
-- =============================================================
INSERT INTO employees (
  id, profile_id, employee_id, department_id, designation_id,
  staff_type, gender, date_of_birth, date_joined, employment_status,
  salary_basis, base_salary, bank_name, tax_id,
  phone, address, emergency_contact_name, emergency_contact_phone,
  is_active
) VALUES

-- ── Administration ──────────────────────────────────────────────────────────

-- EP-001  Margaret Okonkwo  |  Principal  |  Super Admin
(
  'd1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'EP-001',
  'a1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'non_academic', 'female', '1972-04-15', '2019-08-01',
  'active', 'monthly', 6500.00,
  'First National Bank', 'TAX-001-MO',
  '+233-244-100001', '12 School Lane, Accra',
  'Kwame Okonkwo', '+233-244-200001',
  true
),

-- EP-002  David Mensah  |  HR Manager
(
  'd1000000-0000-0000-0000-000000000002',
  'c1000000-0000-0000-0000-000000000002',
  'EP-002',
  'a1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000003',
  'non_academic', 'male', '1980-09-22', '2020-01-15',
  'active', 'monthly', 4800.00,
  'Ghana Commercial Bank', 'TAX-002-DM',
  '+233-244-100002', '5 HR Close, Kumasi',
  'Ama Mensah', '+233-244-200002',
  true
),

-- EP-003  Fatima Al-Hassan  |  Admin Officer  (on leave scenario)
(
  'd1000000-0000-0000-0000-000000000003',
  'c1000000-0000-0000-0000-000000000003',
  'EP-003',
  'a1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000008',
  'non_academic', 'female', '1990-03-10', '2021-06-01',
  'active', 'monthly', 2800.00,
  'Stanbic Bank', 'TAX-003-FA',
  '+233-244-100003', '8 Admin Road, Accra',
  'Yusuf Al-Hassan', '+233-244-200003',
  true
),

-- ── Mathematics ─────────────────────────────────────────────────────────────

-- EP-004  James Kariuki  |  Head of Department (Maths)
(
  'd1000000-0000-0000-0000-000000000004',
  'c1000000-0000-0000-0000-000000000004',
  'EP-004',
  'a1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000004',
  'academic', 'male', '1975-11-30', '2018-09-01',
  'active', 'monthly', 4200.00,
  'Equity Bank', 'TAX-004-JK',
  '+254-700-100004', '23 Maths Ave, Nairobi',
  'Wanjiku Kariuki', '+254-700-200004',
  true
),

-- EP-005  Amara Diallo  |  Senior Teacher (Maths)
(
  'd1000000-0000-0000-0000-000000000005',
  'c1000000-0000-0000-0000-000000000005',
  'EP-005',
  'a1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000005',
  'academic', 'male', '1983-07-18', '2020-09-01',
  'active', 'monthly', 3600.00,
  'Ecobank', 'TAX-005-AD',
  '+221-77-100005', '14 Teacher St, Dakar',
  'Kadiatou Diallo', '+221-77-200005',
  true
),

-- EP-006  Priya Nair  |  Junior Teacher (Maths) — late attendance scenario
(
  'd1000000-0000-0000-0000-000000000006',
  'c1000000-0000-0000-0000-000000000006',
  'EP-006',
  'a1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000006',
  'academic', 'female', '1996-02-25', '2023-01-10',
  'active', 'monthly', 2600.00,
  'HDFC Bank', 'TAX-006-PN',
  '+91-98765-100006', 'Flat 3B, Teachers Colony, Mumbai',
  'Rajan Nair', '+91-98765-200006',
  true
),

-- ── Sciences ────────────────────────────────────────────────────────────────

-- EP-007  Samuel Acheampong  |  Head of Department (Sciences)
(
  'd1000000-0000-0000-0000-000000000007',
  'c1000000-0000-0000-0000-000000000007',
  'EP-007',
  'a1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000004',
  'academic', 'male', '1978-05-05', '2017-09-01',
  'active', 'monthly', 4200.00,
  'Zenith Bank', 'TAX-007-SA',
  '+233-244-100007', '7 Science Park, Accra',
  'Abena Acheampong', '+233-244-200007',
  true
),

-- EP-008  Lindiwe Dlamini  |  Senior Teacher (Sciences)
(
  'd1000000-0000-0000-0000-000000000008',
  'c1000000-0000-0000-0000-000000000008',
  'EP-008',
  'a1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000005',
  'academic', 'female', '1985-12-12', '2019-09-01',
  'active', 'monthly', 3600.00,
  'ABSA Bank', 'TAX-008-LD',
  '+27-71-100008', '19 Lab Crescent, Johannesburg',
  'Sibusiso Dlamini', '+27-71-200008',
  true
),

-- EP-009  Omar Farouk  |  Lab Technician — half-day scenario
(
  'd1000000-0000-0000-0000-000000000009',
  'c1000000-0000-0000-0000-000000000009',
  'EP-009',
  'a1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000007',
  'non_academic', 'male', '1992-08-19', '2022-03-01',
  'active', 'monthly', 2200.00,
  'CIB Bank', 'TAX-009-OF',
  '+20-100-100009', '44 Cairo Ave, Cairo',
  'Hana Farouk', '+20-100-200009',
  true
),

-- ── Languages ───────────────────────────────────────────────────────────────

-- EP-010  Claire Beaumont  |  Head of Department (Languages)
(
  'd1000000-0000-0000-0000-000000000010',
  'c1000000-0000-0000-0000-000000000010',
  'EP-010',
  'a1000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000004',
  'academic', 'female', '1979-06-30', '2016-09-01',
  'active', 'monthly', 4200.00,
  'BNP Paribas', 'TAX-010-CB',
  '+33-6-10001000', '3 Rue des Profs, Paris',
  'Pierre Beaumont', '+33-6-20002000',
  true
),

-- EP-011  Kofi Asante  |  Senior Teacher (Languages)
(
  'd1000000-0000-0000-0000-000000000011',
  'c1000000-0000-0000-0000-000000000011',
  'EP-011',
  'a1000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000005',
  'academic', 'male', '1982-10-07', '2021-01-15',
  'active', 'monthly', 3600.00,
  'Ghana Commercial Bank', 'TAX-011-KA',
  '+233-244-100011', '30 Literature Rd, Accra',
  'Akosua Asante', '+233-244-200011',
  true
),

-- EP-012  Yuki Tanaka  |  Junior Teacher (Languages)
(
  'd1000000-0000-0000-0000-000000000012',
  'c1000000-0000-0000-0000-000000000012',
  'EP-012',
  'a1000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000006',
  'academic', 'female', '1995-04-14', '2023-09-01',
  'active', 'monthly', 2600.00,
  'Mizuho Bank', 'TAX-012-YT',
  '+81-90-10001200', '12 Sensei St, Tokyo',
  'Hiroshi Tanaka', '+81-90-20002000',
  true
),

-- ── Support Staff ───────────────────────────────────────────────────────────

-- EP-013  Beatrice Owusu  |  Librarian
(
  'd1000000-0000-0000-0000-000000000013',
  'c1000000-0000-0000-0000-000000000013',
  'EP-013',
  'a1000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000009',
  'non_academic', 'female', '1988-01-20', '2020-09-01',
  'active', 'monthly', 2400.00,
  'Fidelity Bank', 'TAX-013-BO',
  '+233-244-100013', '6 Library Close, Accra',
  'Kweku Owusu', '+233-244-200013',
  true
),

-- EP-014  Emmanuel Nkrumah  |  Janitor (absent scenario)
(
  'd1000000-0000-0000-0000-000000000014',
  'c1000000-0000-0000-0000-000000000014',
  'EP-014',
  'a1000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000010',
  'non_academic', 'male', '1984-11-03', '2021-02-01',
  'active', 'monthly', 1400.00,
  'Access Bank', 'TAX-014-EN',
  '+233-244-100014', '2 Maintenance Lane, Kumasi',
  'Akua Nkrumah', '+233-244-200014',
  true
),

-- EP-015  Aisha Balogun  |  Senior Teacher (Sciences extra)
(
  'd1000000-0000-0000-0000-000000000015',
  'c1000000-0000-0000-0000-000000000015',
  'EP-015',
  'a1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000005',
  'academic', 'female', '1987-09-09', '2019-01-15',
  'active', 'monthly', 3600.00,
  'GTBank', 'TAX-015-AB',
  '+234-80-100015', '77 University Rd, Lagos',
  'Chukwu Balogun', '+234-80-200015',
  true
),

-- EP-016  Patrick Kimani  |  Senior Teacher (Maths extra)
(
  'd1000000-0000-0000-0000-000000000016',
  'c1000000-0000-0000-0000-000000000016',
  'EP-016',
  'a1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000005',
  'academic', 'male', '1981-06-25', '2018-03-01',
  'active', 'monthly', 3600.00,
  'KCB Bank', 'TAX-016-PK',
  '+254-700-100016', '10 Algebra St, Nairobi',
  'Grace Kimani', '+254-700-200016',
  true
),

-- EP-017  Nadia Petrov  |  Junior Teacher (Languages extra)
(
  'd1000000-0000-0000-0000-000000000017',
  'c1000000-0000-0000-0000-000000000017',
  'EP-017',
  'a1000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000006',
  'academic', 'female', '1997-03-11', '2024-01-08',
  'active', 'monthly', 2600.00,
  'Sberbank', 'TAX-017-NP',
  '+7-916-100017', 'Flat 5, Teacher Housing, Moscow',
  'Alexei Petrov', '+7-916-200017',
  true
),

-- EP-018  Felix Adeola  |  Administrative Officer (Support)
(
  'd1000000-0000-0000-0000-000000000018',
  'c1000000-0000-0000-0000-000000000018',
  'EP-018',
  'a1000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000008',
  'non_academic', 'male', '1991-07-17', '2022-09-01',
  'active', 'monthly', 2800.00,
  'Access Bank', 'TAX-018-FA',
  '+234-80-100018', '3 Admin Block, Lagos',
  'Funmi Adeola', '+234-80-200018',
  true
),

-- EP-019  Grace Mwangi  |  Vice Principal
(
  'd1000000-0000-0000-0000-000000000019',
  'c1000000-0000-0000-0000-000000000019',
  'EP-019',
  'a1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000002',
  'non_academic', 'female', '1976-08-28', '2020-07-01',
  'active', 'monthly', 5500.00,
  'Equity Bank Kenya', 'TAX-019-GM',
  '+254-700-100019', '8 Deputy Drive, Nairobi',
  'John Mwangi', '+254-700-200019',
  true
),

-- EP-020  Ibrahim Sesay  |  Janitor (Support)
(
  'd1000000-0000-0000-0000-000000000020',
  'c1000000-0000-0000-0000-000000000020',
  'EP-020',
  'a1000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000010',
  'non_academic', 'male', '1989-12-01', '2023-04-01',
  'active', 'monthly', 1400.00,
  'Rokel Commercial Bank', 'TAX-020-IS',
  '+232-76-100020', '5 Grounds Rd, Freetown',
  'Mariama Sesay', '+232-76-200020',
  true
);


-- Set department heads now that employees exist
UPDATE departments SET head_id = 'c1000000-0000-0000-0000-000000000001' WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE departments SET head_id = 'c1000000-0000-0000-0000-000000000004' WHERE id = 'a1000000-0000-0000-0000-000000000002';
UPDATE departments SET head_id = 'c1000000-0000-0000-0000-000000000007' WHERE id = 'a1000000-0000-0000-0000-000000000003';
UPDATE departments SET head_id = 'c1000000-0000-0000-0000-000000000010' WHERE id = 'a1000000-0000-0000-0000-000000000004';
UPDATE departments SET head_id = 'c1000000-0000-0000-0000-000000000013' WHERE id = 'a1000000-0000-0000-0000-000000000005';


-- =============================================================
-- 5. ATTENDANCE — January 2025 for 5 employees (22 working days)
--    EP-001 (perfect), EP-005 (1 absent), EP-006 (3 late),
--    EP-009 (2 half-days), EP-014 (3 absent)
--    Weekdays: Mon 6 – Fri 31 Jan 2025 (excluding weekends)
-- =============================================================

-- Helper: only insert for weekdays we explicitly list
INSERT INTO attendance_records (employee_id, date, check_in_time, check_out_time, status, notes) VALUES

-- ── EP-001  Margaret Okonkwo — All 22 days present ──────────────────────────
('d1000000-0000-0000-0000-000000000001','2025-01-06','2025-01-06 07:52:00+00','2025-01-06 16:05:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-07','2025-01-07 07:48:00+00','2025-01-07 16:10:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-08','2025-01-08 07:55:00+00','2025-01-08 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-09','2025-01-09 07:50:00+00','2025-01-09 16:05:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-10','2025-01-10 07:45:00+00','2025-01-10 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-13','2025-01-13 07:50:00+00','2025-01-13 16:08:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-14','2025-01-14 07:52:00+00','2025-01-14 16:02:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-15','2025-01-15 07:49:00+00','2025-01-15 16:05:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-16','2025-01-16 07:53:00+00','2025-01-16 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-17','2025-01-17 07:47:00+00','2025-01-17 16:10:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-20','2025-01-20 07:51:00+00','2025-01-20 16:03:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-21','2025-01-21 07:50:00+00','2025-01-21 16:07:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-22','2025-01-22 07:48:00+00','2025-01-22 16:01:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-23','2025-01-23 07:55:00+00','2025-01-23 16:05:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-24','2025-01-24 07:50:00+00','2025-01-24 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-27','2025-01-27 07:52:00+00','2025-01-27 16:08:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-28','2025-01-28 07:49:00+00','2025-01-28 16:04:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-29','2025-01-29 07:50:00+00','2025-01-29 16:06:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-30','2025-01-30 07:47:00+00','2025-01-30 16:02:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000001','2025-01-31','2025-01-31 07:53:00+00','2025-01-31 16:00:00+00','present',NULL),

-- ── EP-005  Amara Diallo — 19 present, 1 absent (Jan 22), 1 on_leave (Jan 29-30 — see leave request) ──
('d1000000-0000-0000-0000-000000000005','2025-01-06','2025-01-06 08:00:00+00','2025-01-06 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-07','2025-01-07 07:58:00+00','2025-01-07 16:05:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-08','2025-01-08 08:01:00+00','2025-01-08 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-09','2025-01-09 07:59:00+00','2025-01-09 16:03:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-10','2025-01-10 08:00:00+00','2025-01-10 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-13','2025-01-13 08:00:00+00','2025-01-13 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-14','2025-01-14 08:02:00+00','2025-01-14 16:05:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-15','2025-01-15 08:00:00+00','2025-01-15 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-16','2025-01-16 07:58:00+00','2025-01-16 16:02:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-17','2025-01-17 08:00:00+00','2025-01-17 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-20','2025-01-20 07:59:00+00','2025-01-20 16:03:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-21','2025-01-21 08:01:00+00','2025-01-21 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-22',NULL,NULL,'absent','Unexcused absence'),
('d1000000-0000-0000-0000-000000000005','2025-01-23','2025-01-23 08:00:00+00','2025-01-23 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-24','2025-01-24 07:58:00+00','2025-01-24 16:05:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-27','2025-01-27 08:00:00+00','2025-01-27 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-28','2025-01-28 08:01:00+00','2025-01-28 16:03:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000005','2025-01-29',NULL,NULL,'on_leave','Approved sick leave'),
('d1000000-0000-0000-0000-000000000005','2025-01-30',NULL,NULL,'on_leave','Approved sick leave'),
('d1000000-0000-0000-0000-000000000005','2025-01-31','2025-01-31 08:00:00+00','2025-01-31 16:00:00+00','present',NULL),

-- ── EP-006  Priya Nair — 17 present, 3 late (Jan 14, 21, 28) ────────────────
('d1000000-0000-0000-0000-000000000006','2025-01-06','2025-01-06 08:05:00+00','2025-01-06 16:05:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-07','2025-01-07 08:03:00+00','2025-01-07 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-08','2025-01-08 08:02:00+00','2025-01-08 16:05:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-09','2025-01-09 08:04:00+00','2025-01-09 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-10','2025-01-10 08:06:00+00','2025-01-10 16:02:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-13','2025-01-13 08:01:00+00','2025-01-13 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-14','2025-01-14 08:45:00+00','2025-01-14 16:00:00+00','late','45 min late — transport delay'),
('d1000000-0000-0000-0000-000000000006','2025-01-15','2025-01-15 08:03:00+00','2025-01-15 16:05:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-16','2025-01-16 08:02:00+00','2025-01-16 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-17','2025-01-17 08:04:00+00','2025-01-17 16:03:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-20','2025-01-20 08:01:00+00','2025-01-20 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-21','2025-01-21 09:10:00+00','2025-01-21 16:00:00+00','late','70 min late — family matter'),
('d1000000-0000-0000-0000-000000000006','2025-01-22','2025-01-22 08:03:00+00','2025-01-22 16:05:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-23','2025-01-23 08:05:00+00','2025-01-23 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-24','2025-01-24 08:02:00+00','2025-01-24 16:04:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-27','2025-01-27 08:01:00+00','2025-01-27 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-28','2025-01-28 09:30:00+00','2025-01-28 16:05:00+00','late','90 min late — medical appointment'),
('d1000000-0000-0000-0000-000000000006','2025-01-29','2025-01-29 08:04:00+00','2025-01-29 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-30','2025-01-30 08:02:00+00','2025-01-30 16:02:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000006','2025-01-31','2025-01-31 08:05:00+00','2025-01-31 16:00:00+00','present',NULL),

-- ── EP-009  Omar Farouk — 18 present, 2 half-day (Jan 16, 23) ───────────────
('d1000000-0000-0000-0000-000000000009','2025-01-06','2025-01-06 08:00:00+00','2025-01-06 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-07','2025-01-07 08:00:00+00','2025-01-07 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-08','2025-01-08 08:00:00+00','2025-01-08 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-09','2025-01-09 08:00:00+00','2025-01-09 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-10','2025-01-10 08:00:00+00','2025-01-10 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-13','2025-01-13 08:00:00+00','2025-01-13 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-14','2025-01-14 08:00:00+00','2025-01-14 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-15','2025-01-15 08:00:00+00','2025-01-15 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-16','2025-01-16 08:00:00+00','2025-01-16 12:00:00+00','half_day','Left early — family emergency'),
('d1000000-0000-0000-0000-000000000009','2025-01-17','2025-01-17 08:00:00+00','2025-01-17 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-20','2025-01-20 08:00:00+00','2025-01-20 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-21','2025-01-21 08:00:00+00','2025-01-21 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-22','2025-01-22 08:00:00+00','2025-01-22 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-23','2025-01-23 08:00:00+00','2025-01-23 12:30:00+00','half_day','Medical appointment in afternoon'),
('d1000000-0000-0000-0000-000000000009','2025-01-24','2025-01-24 08:00:00+00','2025-01-24 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-27','2025-01-27 08:00:00+00','2025-01-27 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-28','2025-01-28 08:00:00+00','2025-01-28 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-29','2025-01-29 08:00:00+00','2025-01-29 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-30','2025-01-30 08:00:00+00','2025-01-30 16:00:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000009','2025-01-31','2025-01-31 08:00:00+00','2025-01-31 16:00:00+00','present',NULL),

-- ── EP-014  Emmanuel Nkrumah — 17 present, 3 absent (Jan 8, 15, 27) ─────────
('d1000000-0000-0000-0000-000000000014','2025-01-06','2025-01-06 07:30:00+00','2025-01-06 15:30:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-07','2025-01-07 07:28:00+00','2025-01-07 15:32:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-08',NULL,NULL,'absent','No-show, no notice'),
('d1000000-0000-0000-0000-000000000014','2025-01-09','2025-01-09 07:30:00+00','2025-01-09 15:30:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-10','2025-01-10 07:31:00+00','2025-01-10 15:29:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-13','2025-01-13 07:29:00+00','2025-01-13 15:30:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-14','2025-01-14 07:30:00+00','2025-01-14 15:31:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-15',NULL,NULL,'absent','Sick — no medical certificate'),
('d1000000-0000-0000-0000-000000000014','2025-01-16','2025-01-16 07:30:00+00','2025-01-16 15:30:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-17','2025-01-17 07:32:00+00','2025-01-17 15:28:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-20','2025-01-20 07:30:00+00','2025-01-20 15:30:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-21','2025-01-21 07:29:00+00','2025-01-21 15:31:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-22','2025-01-22 07:30:00+00','2025-01-22 15:30:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-23','2025-01-23 07:31:00+00','2025-01-23 15:29:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-24','2025-01-24 07:30:00+00','2025-01-24 15:30:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-27',NULL,NULL,'absent','Absent without leave'),
('d1000000-0000-0000-0000-000000000014','2025-01-28','2025-01-28 07:30:00+00','2025-01-28 15:30:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-29','2025-01-29 07:29:00+00','2025-01-29 15:31:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-30','2025-01-30 07:30:00+00','2025-01-30 15:30:00+00','present',NULL),
('d1000000-0000-0000-0000-000000000014','2025-01-31','2025-01-31 07:32:00+00','2025-01-31 15:28:00+00','present',NULL);


-- =============================================================
-- 6. LEAVE REQUESTS  (5 varied requests)
-- leave_type IDs from the seeded leave_types (name-based lookup)
-- =============================================================
INSERT INTO leave_requests (
  id, employee_id, leave_type_id, start_date, end_date, total_days,
  reason, status, reviewed_by, reviewed_at, review_notes
) VALUES

-- (1) EP-005 Amara Diallo — Sick leave, approved (ties to attendance on_leave rows above)
(
  'e1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000005',
  (SELECT id FROM leave_types WHERE name = 'Sick' LIMIT 1),
  '2025-01-29', '2025-01-30', 2,
  'Persistent fever and doctor-advised rest.',
  'approved',
  'c1000000-0000-0000-0000-000000000002',
  '2025-01-27 09:15:00+00',
  'Approved — medical certificate provided.'
),

-- (2) EP-003 Fatima Al-Hassan — Casual leave, pending
(
  'e1000000-0000-0000-0000-000000000002',
  'd1000000-0000-0000-0000-000000000003',
  (SELECT id FROM leave_types WHERE name = 'Casual' LIMIT 1),
  '2025-02-10', '2025-02-11', 2,
  'Personal family event — sibling wedding.',
  'pending',
  NULL, NULL, NULL
),

-- (3) EP-012 Yuki Tanaka — Vacation leave, approved
(
  'e1000000-0000-0000-0000-000000000003',
  'd1000000-0000-0000-0000-000000000012',
  (SELECT id FROM leave_types WHERE name = 'Vacation' LIMIT 1),
  '2025-04-07', '2025-04-18', 10,
  'Annual family vacation — planned well in advance.',
  'approved',
  'c1000000-0000-0000-0000-000000000002',
  '2025-03-01 10:00:00+00',
  'Approved — term break period, substitute arranged.'
),

-- (4) EP-014 Emmanuel Nkrumah — Sick leave, rejected (excessive unexcused absence pattern)
(
  'e1000000-0000-0000-0000-000000000004',
  'd1000000-0000-0000-0000-000000000014',
  (SELECT id FROM leave_types WHERE name = 'Sick' LIMIT 1),
  '2025-01-27', '2025-01-27', 1,
  'Not feeling well.',
  'rejected',
  'c1000000-0000-0000-0000-000000000001',
  '2025-01-28 08:30:00+00',
  'Rejected — absence taken without prior notice; third occurrence this month.'
),

-- (5) EP-015 Aisha Balogun — Emergency leave, pending
(
  'e1000000-0000-0000-0000-000000000005',
  'd1000000-0000-0000-0000-000000000015',
  (SELECT id FROM leave_types WHERE name = 'Emergency' LIMIT 1),
  '2025-02-03', '2025-02-05', 3,
  'Critical illness of parent — requires immediate travel.',
  'pending',
  NULL, NULL, NULL
);


-- =============================================================
-- 7. EMPLOYEE SALARY COMPONENTS
--    Assign the 4 default components (from migration 013) to all 20 employees.
--    A few employees get overrides to create realistic variance:
--      EP-001 higher transport allowance, EP-014/020 override income tax to 5%
-- =============================================================
INSERT INTO employee_salary_components (employee_id, component_id, override_value, is_active)
SELECT
  e.id,
  sc.id,
  CASE
    -- EP-001 Principal gets $300 transport instead of $150
    WHEN e.employee_id = 'EP-001' AND sc.name = 'Transport Allowance'    THEN 300.00
    -- EP-019 VP also gets $250 transport
    WHEN e.employee_id = 'EP-019' AND sc.name = 'Transport Allowance'    THEN 250.00
    -- Junior staff (EP-014, EP-020) lower income tax rate override: 5%
    WHEN e.employee_id IN ('EP-014','EP-020') AND sc.name = 'Income Tax' THEN 5.00
    -- EP-002 HR Manager custom health insurance
    WHEN e.employee_id = 'EP-002' AND sc.name = 'Health Insurance'       THEN 80.00
    ELSE NULL  -- use global default
  END,
  true
FROM employees e
CROSS JOIN salary_components sc
WHERE e.employee_id LIKE 'EP-%'
  AND sc.is_active = true
ON CONFLICT (employee_id, component_id) DO NOTHING;


-- =============================================================
-- 8. PAYROLL RUN — January 2025  (completed)
-- =============================================================
INSERT INTO payroll_runs (
  id, month, year, status,
  total_employees, total_gross, total_deductions, total_net,
  notes, run_by, completed_at
) VALUES (
  'f1000000-0000-0000-0000-000000000001',
  1, 2025, 'completed',
  20,
  -- total_gross = sum of (base_salary + HRA 40% + Transport) for all 20
  -- approximate: calculated accurately per-employee below in payslips
  85800.00,
  13260.00,
  72540.00,
  'January 2025 payroll — all 20 employees. Processed without issues.',
  'c1000000-0000-0000-0000-000000000002',
  '2025-02-03 14:30:00+00'
);


-- =============================================================
-- 9. PAYSLIPS — one per employee for January 2025
--
-- Formula per employee:
--   HRA        = base_salary * 0.40
--   Transport  = 150  (or override for EP-001: 300, EP-019: 250)
--   gross      = base_salary + HRA + Transport
--   Income Tax = base_salary * 0.10  (EP-014, EP-020: 0.05)
--   Health Ins = 50  (EP-002: 80)
--   deductions = Income_Tax + Health_Ins
--   net_pay    = gross - deductions
--
-- Attendance (working_days=22 for all in Jan 2025):
--   EP-001: 20 present, 0 absent, 0 late  (2 days weekend edge = still 20 recorded)
--   EP-005: 18 present, 1 absent, 0 late, 2 on_leave
--   EP-006: 17 present, 0 absent, 3 late
--   EP-009: 18 present, 0 absent, 0 late, 2 half_day
--   EP-014: 17 present, 3 absent, 0 late
--   All others: 22 present (no attendance data = full attendance)
-- =============================================================

INSERT INTO payslips (
  id, payroll_run_id, employee_id,
  base_salary, gross_earnings, total_deductions, net_pay,
  working_days, present_days, absent_days, late_days, leave_days,
  status, breakdown
) VALUES

-- EP-001  Margaret Okonkwo  |  base=6500  transport_override=300
(
  'g1000000-0000-0000-0000-000000000001',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  6500.00, 9400.00, 700.00, 8700.00,
  22, 20, 0, 0, 0, 'paid',
  '{"base_salary":6500,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":6500,"computed_amount":2600},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":300,"computed_amount":300}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":6500,"computed_amount":650},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":9400,"total_deductions":700,"net_pay":8700}'
),

-- EP-002  David Mensah  |  base=4800  health_override=80
(
  'g1000000-0000-0000-0000-000000000002',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000002',
  4800.00, 6870.00, 560.00, 6310.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":4800,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":4800,"computed_amount":1920},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":4800,"computed_amount":480},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":80,"computed_amount":80}],"gross_earnings":6870,"total_deductions":560,"net_pay":6310}'
),

-- EP-003  Fatima Al-Hassan  |  base=2800
(
  'g1000000-0000-0000-0000-000000000003',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000003',
  2800.00, 4070.00, 330.00, 3740.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":2800,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":2800,"computed_amount":1120},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":2800,"computed_amount":280},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":4070,"total_deductions":330,"net_pay":3740}'
),

-- EP-004  James Kariuki  |  base=4200
(
  'g1000000-0000-0000-0000-000000000004',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000004',
  4200.00, 6030.00, 470.00, 5560.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":4200,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":4200,"computed_amount":1680},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":4200,"computed_amount":420},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":6030,"total_deductions":470,"net_pay":5560}'
),

-- EP-005  Amara Diallo  |  base=3600  | 1 absent + 2 on_leave
(
  'g1000000-0000-0000-0000-000000000005',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000005',
  3600.00, 5190.00, 410.00, 4780.00,
  22, 18, 1, 0, 2, 'paid',
  '{"base_salary":3600,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":3600,"computed_amount":1440},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":3600,"computed_amount":360},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":5190,"total_deductions":410,"net_pay":4780}'
),

-- EP-006  Priya Nair  |  base=2600  | 3 late days
(
  'g1000000-0000-0000-0000-000000000006',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000006',
  2600.00, 3790.00, 310.00, 3480.00,
  22, 17, 0, 3, 0, 'paid',
  '{"base_salary":2600,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":2600,"computed_amount":1040},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":2600,"computed_amount":260},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":3790,"total_deductions":310,"net_pay":3480}'
),

-- EP-007  Samuel Acheampong  |  base=4200
(
  'g1000000-0000-0000-0000-000000000007',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000007',
  4200.00, 6030.00, 470.00, 5560.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":4200,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":4200,"computed_amount":1680},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":4200,"computed_amount":420},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":6030,"total_deductions":470,"net_pay":5560}'
),

-- EP-008  Lindiwe Dlamini  |  base=3600
(
  'g1000000-0000-0000-0000-000000000008',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000008',
  3600.00, 5190.00, 410.00, 4780.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":3600,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":3600,"computed_amount":1440},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":3600,"computed_amount":360},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":5190,"total_deductions":410,"net_pay":4780}'
),

-- EP-009  Omar Farouk  |  base=2200  | 2 half_days
(
  'g1000000-0000-0000-0000-000000000009',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000009',
  2200.00, 3230.00, 270.00, 2960.00,
  22, 18, 0, 0, 0, 'paid',
  '{"base_salary":2200,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":2200,"computed_amount":880},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":2200,"computed_amount":220},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":3230,"total_deductions":270,"net_pay":2960}'
),

-- EP-010  Claire Beaumont  |  base=4200
(
  'g1000000-0000-0000-0000-000000000010',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000010',
  4200.00, 6030.00, 470.00, 5560.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":4200,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":4200,"computed_amount":1680},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":4200,"computed_amount":420},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":6030,"total_deductions":470,"net_pay":5560}'
),

-- EP-011  Kofi Asante  |  base=3600
(
  'g1000000-0000-0000-0000-000000000011',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000011',
  3600.00, 5190.00, 410.00, 4780.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":3600,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":3600,"computed_amount":1440},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":3600,"computed_amount":360},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":5190,"total_deductions":410,"net_pay":4780}'
),

-- EP-012  Yuki Tanaka  |  base=2600
(
  'g1000000-0000-0000-0000-000000000012',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000012',
  2600.00, 3790.00, 310.00, 3480.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":2600,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":2600,"computed_amount":1040},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":2600,"computed_amount":260},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":3790,"total_deductions":310,"net_pay":3480}'
),

-- EP-013  Beatrice Owusu  |  base=2400
(
  'g1000000-0000-0000-0000-000000000013',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000013',
  2400.00, 3510.00, 290.00, 3220.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":2400,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":2400,"computed_amount":960},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":2400,"computed_amount":240},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":3510,"total_deductions":290,"net_pay":3220}'
),

-- EP-014  Emmanuel Nkrumah  |  base=1400  tax_override=5%  | 3 absent
(
  'g1000000-0000-0000-0000-000000000014',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000014',
  1400.00, 2110.00, 120.00, 1990.00,
  22, 17, 3, 0, 0, 'paid',
  '{"base_salary":1400,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":1400,"computed_amount":560},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":1400,"computed_amount":70},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":2110,"total_deductions":120,"net_pay":1990}'
),

-- EP-015  Aisha Balogun  |  base=3600
(
  'g1000000-0000-0000-0000-000000000015',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000015',
  3600.00, 5190.00, 410.00, 4780.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":3600,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":3600,"computed_amount":1440},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":3600,"computed_amount":360},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":5190,"total_deductions":410,"net_pay":4780}'
),

-- EP-016  Patrick Kimani  |  base=3600
(
  'g1000000-0000-0000-0000-000000000016',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000016',
  3600.00, 5190.00, 410.00, 4780.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":3600,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":3600,"computed_amount":1440},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":3600,"computed_amount":360},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":5190,"total_deductions":410,"net_pay":4780}'
),

-- EP-017  Nadia Petrov  |  base=2600
(
  'g1000000-0000-0000-0000-000000000017',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000017',
  2600.00, 3790.00, 310.00, 3480.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":2600,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":2600,"computed_amount":1040},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":2600,"computed_amount":260},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":3790,"total_deductions":310,"net_pay":3480}'
),

-- EP-018  Felix Adeola  |  base=2800
(
  'g1000000-0000-0000-0000-000000000018',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000018',
  2800.00, 4070.00, 330.00, 3740.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":2800,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":2800,"computed_amount":1120},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":2800,"computed_amount":280},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":4070,"total_deductions":330,"net_pay":3740}'
),

-- EP-019  Grace Mwangi  |  base=5500  transport_override=250
(
  'g1000000-0000-0000-0000-000000000019',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000019',
  5500.00, 7950.00, 600.00, 7350.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":5500,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":5500,"computed_amount":2200},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":250,"computed_amount":250}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":5500,"computed_amount":550},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":7950,"total_deductions":600,"net_pay":7350}'
),

-- EP-020  Ibrahim Sesay  |  base=1400  tax_override=5%
(
  'g1000000-0000-0000-0000-000000000020',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000020',
  1400.00, 2110.00, 120.00, 1990.00,
  22, 22, 0, 0, 0, 'paid',
  '{"base_salary":1400,"attendance_deduction":0,"earnings":[{"name":"House Rent Allowance (HRA)","type":"earning","calculation_type":"percentage_of_base","base_value":1400,"computed_amount":560},{"name":"Transport Allowance","type":"earning","calculation_type":"fixed","base_value":150,"computed_amount":150}],"deductions":[{"name":"Income Tax","type":"deduction","calculation_type":"percentage_of_base","base_value":1400,"computed_amount":70},{"name":"Health Insurance","type":"deduction","calculation_type":"fixed","base_value":50,"computed_amount":50}],"gross_earnings":2110,"total_deductions":120,"net_pay":1990}'
);


-- =============================================================
-- Recalculate accurate payroll_run totals from payslips
-- =============================================================
UPDATE payroll_runs
SET
  total_gross      = (SELECT SUM(gross_earnings)    FROM payslips WHERE payroll_run_id = 'f1000000-0000-0000-0000-000000000001'),
  total_deductions = (SELECT SUM(total_deductions)  FROM payslips WHERE payroll_run_id = 'f1000000-0000-0000-0000-000000000001'),
  total_net        = (SELECT SUM(net_pay)            FROM payslips WHERE payroll_run_id = 'f1000000-0000-0000-0000-000000000001'),
  total_employees  = (SELECT COUNT(*)                FROM payslips WHERE payroll_run_id = 'f1000000-0000-0000-0000-000000000001')
WHERE id = 'f1000000-0000-0000-0000-000000000001';


-- =============================================================
-- Done. Summary of seeded data:
--   Departments:               5
--   Designations:              10
--   Profiles:                  20  (1 super_admin, 1 hr_manager, 14 teacher, 4 staff)
--   Employees:                 20  (12 academic, 8 non_academic)
--   Attendance records:        99  (5 employees × ~20 working days in Jan 2025)
--   Leave requests:             5  (approved, pending, rejected scenarios)
--   Salary components (links): 80  (20 employees × 4 components, with 5 overrides)
--   Payroll run:                1  (January 2025, completed)
--   Payslips:                  20  (one per employee)
-- =============================================================
