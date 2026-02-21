/**
 * Seed script: creates two dummy Supabase auth users (admin + employee)
 * with pre-confirmed emails so they can log in immediately.
 *
 * The handle_new_user() trigger auto-creates matching profile rows
 * with the role from user_metadata.
 *
 * Also seeds sample departments, designations, and an employee record
 * for the staff user so the dashboard has content.
 *
 * Usage:  node scripts/seed-dummy-users.mjs
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// ── Helpers ────────────────────────────────────────────────────────

async function adminCreateUser({ email, password, firstName, lastName, role }) {
  // Check if user already exists by listing users filtered by email
  const listRes = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`,
    { headers }
  );
  const listData = await listRes.json();
  const existingUser = (listData.users || []).find((u) => u.email === email);

  if (existingUser) {
    console.log(`  User ${email} already exists (id: ${existingUser.id}), skipping creation.`);
    return existingUser;
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true, // pre-confirm the email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to create user ${email}: ${JSON.stringify(err)}`);
  }

  const user = await res.json();
  console.log(`  Created user ${email} (id: ${user.id}, role: ${role})`);
  return user;
}

async function rpcQuery(sql) {
  // Use the PostgREST rpc endpoint to run raw SQL isn't available,
  // so we use the REST API to insert rows directly.
}

async function upsertRow(table, data, onConflict) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: onConflict
        ? `return=representation,resolution=merge-duplicates`
        : "return=representation",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn(`  Warning inserting into ${table}: ${err}`);
    return null;
  }

  const rows = await res.json();
  return rows[0];
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding dummy users...\n");

  // 1. Create Admin user
  console.log("1. Creating admin user...");
  const adminUser = await adminCreateUser({
    email: "admin@edupay.test",
    password: "Admin@123456",
    firstName: "Admin",
    lastName: "User",
    role: "super_admin",
  });

  // 2. Create Employee (staff) user
  console.log("\n2. Creating employee user...");
  const staffUser = await adminCreateUser({
    email: "employee@edupay.test",
    password: "Staff@123456",
    firstName: "Jane",
    lastName: "Doe",
    role: "staff",
  });

  // 3. Seed sample departments
  console.log("\n3. Seeding sample departments...");
  const dept1 = await upsertRow("departments", {
    name: "Engineering",
    description: "Software development and IT infrastructure",
  });
  if (dept1) console.log(`  Department: ${dept1.name} (${dept1.id})`);

  const dept2 = await upsertRow("departments", {
    name: "Human Resources",
    description: "Employee management and recruitment",
  });
  if (dept2) console.log(`  Department: ${dept2.name} (${dept2.id})`);

  // 4. Seed sample designations
  console.log("\n4. Seeding sample designations...");
  const desig1 = await upsertRow("designations", {
    title: "Software Engineer",
    description: "Develops and maintains software applications",
  });
  if (desig1) console.log(`  Designation: ${desig1.title} (${desig1.id})`);

  const desig2 = await upsertRow("designations", {
    title: "HR Manager",
    description: "Manages human resources operations",
  });
  if (desig2) console.log(`  Designation: ${desig2.title} (${desig2.id})`);

  // 5. Create employee record for the staff user
  if (staffUser && dept1 && desig1) {
    console.log("\n5. Creating employee record for staff user...");
    const emp = await upsertRow("employees", {
      employee_id: "EMP-001",
      profile_id: staffUser.id,
      department_id: dept1.id,
      designation_id: desig1.id,
      staff_type: "full_time",
      employment_status: "active",
      gender: "female",
      date_of_birth: "1995-06-15",
      date_joined: "2024-01-15",
      phone: "+1234567890",
      address: "123 Main Street, Springfield",
      base_salary: 65000,
      salary_basis: "monthly",
      bank_name: "First National Bank",
      bank_account_number: "1234567890",
      emergency_contact_name: "John Doe",
      emergency_contact_phone: "+0987654321",
    });
    if (emp) console.log(`  Employee record created (${emp.employee_id})`);
  } else {
    console.log("\n5. Skipping employee record (missing dependencies).");
  }

  // ── Summary ──────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log("  DUMMY ACCOUNTS SEEDED SUCCESSFULLY");
  console.log("========================================");
  console.log("");
  console.log("  Admin Account:");
  console.log("    Email:    admin@edupay.test");
  console.log("    Password: Admin@123456");
  console.log("    Role:     super_admin");
  console.log("");
  console.log("  Employee Account:");
  console.log("    Email:    employee@edupay.test");
  console.log("    Password: Staff@123456");
  console.log("    Role:     staff");
  console.log("");
  console.log("  Both accounts have pre-confirmed emails");
  console.log("  and can log in immediately at /auth/login");
  console.log("========================================");
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
