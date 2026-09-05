import assert from "node:assert/strict";
import test from "node:test";
import { assertRoleAssignmentAllowed, defaultPlatformRole } from "../db/role-assignment.ts";
import { accessStatusForErrorMessage, requireActiveMembership } from "../db/tenant-access.ts";

const assignment = { actorEmail: "admin@example.com", actorRole: "company_admin", targetEmail: "person@example.com", targetCurrentRole: "employee", requestedRole: "manager" };
const allowed = (overrides) => assert.doesNotThrow(() => assertRoleAssignmentAllowed({ ...assignment, ...overrides }));
const denied = (overrides, code) => assert.throws(() => assertRoleAssignmentAllowed({ ...assignment, ...overrides }), (error) => {
  assert.equal(error.message, code);
  assert.equal(accessStatusForErrorMessage(error.message), 403);
  return true;
});

test("ilk kullanıcı güvenli platform rolüyle oluşturulur", () => assert.equal(defaultPlatformRole(), "user"));
test("doğrulanmış super admin super_admin atayabilir", () => allowed({ actorRole: "super_admin", requestedRole: "super_admin" }));
test("company admin company_admin ve alt şirket rollerini atayabilir", () => {
  for (const requestedRole of ["company_admin", "hr", "manager", "employee", "payroll"]) allowed({ requestedRole });
});
test("HR yalnızca düşük şirket rollerini atayabilir", () => {
  for (const requestedRole of ["manager", "employee", "payroll"]) allowed({ actorRole: "hr", requestedRole });
  denied({ actorRole: "hr", requestedRole: "company_admin" }, "COMPANY_ADMIN_ASSIGNMENT_DENIED");
  denied({ actorRole: "hr", requestedRole: "super_admin" }, "SUPER_ADMIN_ASSIGNMENT_DENIED");
});
test("super admin olmayan kullanıcı super_admin atayamaz", () => denied({ requestedRole: "super_admin" }, "SUPER_ADMIN_ASSIGNMENT_DENIED"));
test("kullanıcı kendisini daha yüksek role yükseltemez", () => denied({ actorEmail: "person@example.com", actorRole: "hr", targetEmail: "person@example.com", targetCurrentRole: "hr", requestedRole: "company_admin" }, "SELF_ROLE_ESCALATION_DENIED"));
test("company admin mevcut super admin kullanıcısını yönetemez", () => denied({ targetCurrentRole: "super_admin", requestedRole: "employee" }, "SUPER_ADMIN_MANAGEMENT_DENIED"));
test("manager rol atayamaz", () => denied({ actorRole: "manager", requestedRole: "employee" }, "ROLE_ASSIGNMENT_DENIED"));
test("company admin başka şirkette kullanıcı yönetemez", () => {
  const membership = { company_id: "company-a", user_email: "admin@example.com", role: "company_admin", status: "Aktif" };
  assert.throws(() => requireActiveMembership(membership, "company-b", "admin@example.com"), (error) => {
    assert.equal(accessStatusForErrorMessage(error.message), 403);
    return true;
  });
});
