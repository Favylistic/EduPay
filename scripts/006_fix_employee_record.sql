-- Insert the employee record for the staff user that failed due to wrong staff_type
-- Uses the profile_id from the employee@edupay.test user
insert into public.employees (
  profile_id,
  employee_id,
  department_id,
  designation_id,
  staff_type,
  date_of_birth,
  gender,
  phone,
  address,
  date_joined,
  employment_status,
  salary_basis,
  base_salary,
  bank_name,
  bank_account_number,
  emergency_contact_name,
  emergency_contact_phone
)
select
  p.id,
  'EMP-001',
  (select id from public.departments where name = 'Engineering' limit 1),
  (select id from public.designations where title = 'Software Engineer' limit 1),
  'non_academic',
  '1995-06-15',
  'female',
  '+1234567890',
  '123 Main Street, Springfield',
  '2024-01-15',
  'active',
  'monthly',
  65000.00,
  'First National Bank',
  '1234567890',
  'John Doe',
  '+0987654321'
from public.profiles p
where p.id = (
  select id from auth.users where email = 'employee@edupay.test' limit 1
)
on conflict (profile_id) do nothing;
