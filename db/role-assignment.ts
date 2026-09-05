export const COMPANY_ROLES = ["company_admin", "hr", "manager", "employee", "payroll"] as const;
export const ASSIGNABLE_ROLES = ["super_admin", ...COMPANY_ROLES] as const;

const ROLE_LEVEL: Record<string, number> = {
  employee: 10,
  manager: 20,
  payroll: 20,
  hr: 30,
  company_admin: 40,
  super_admin: 50,
};

type RoleAssignment = {
  actorEmail: string;
  actorRole: string;
  targetEmail: string;
  targetCurrentRole: string;
  requestedRole: string;
};

export function defaultPlatformRole(): "user" {
  return "user";
}

export function assertRoleAssignmentAllowed(input: RoleAssignment): void {
  const { actorEmail, actorRole, targetEmail, targetCurrentRole, requestedRole } = input;
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(requestedRole)) throw new Error("ROLE_INVALID");

  if (actorEmail.trim().toLowerCase() === targetEmail.trim().toLowerCase()) {
    if ((ROLE_LEVEL[requestedRole] ?? 0) > (ROLE_LEVEL[targetCurrentRole] ?? 0)) {
      throw new Error("SELF_ROLE_ESCALATION_DENIED");
    }
  }

  if (requestedRole === "super_admin" && actorRole !== "super_admin") {
    throw new Error("SUPER_ADMIN_ASSIGNMENT_DENIED");
  }
  if (targetCurrentRole === "super_admin" && actorRole !== "super_admin") {
    throw new Error("SUPER_ADMIN_MANAGEMENT_DENIED");
  }
  if (requestedRole === "company_admin" && !["super_admin", "company_admin"].includes(actorRole)) {
    throw new Error("COMPANY_ADMIN_ASSIGNMENT_DENIED");
  }
  if (actorRole === "super_admin" || actorRole === "company_admin") return;
  if (actorRole === "hr" && ["manager", "employee", "payroll"].includes(requestedRole)) return;
  throw new Error("ROLE_ASSIGNMENT_DENIED");
}
