export type TenantMembership = {
  company_id?: string | null;
  companyId?: string | null;
  user_email?: string | null;
  userEmail?: string | null;
  role?: string | null;
  status?: string | null;
  active?: boolean | null;
};

type MembershipQueryResult = {
  data: TenantMembership | null;
  error?: { message: string } | null;
};

type MembershipFilterQuery = {
  eq(column: string, value: string): MembershipFilterQuery;
  maybeSingle(): PromiseLike<MembershipQueryResult>;
};

type MembershipTableQuery = {
  select(columns: string): MembershipFilterQuery;
};

export type TenantMembershipDb = {
  from(table: string): MembershipTableQuery;
};

function isActiveMembership(membership: TenantMembership): boolean {
  if (membership.active === false) return false;
  if (membership.status == null || membership.status.trim() === "") return true;
  return ["aktif", "active"].includes(membership.status.trim().toLocaleLowerCase("tr"));
}

export function requireActiveMembership(
  membership: TenantMembership | null,
  expectedCompanyId?: string,
  expectedUserEmail?: string,
): string {
  if (!membership) throw new Error("COMPANY_MEMBERSHIP_REQUIRED");
  const membershipCompanyId = membership.company_id ?? membership.companyId;
  const membershipUserEmail = membership.user_email ?? membership.userEmail;
  if (expectedCompanyId && membershipCompanyId !== expectedCompanyId) {
    throw new Error("COMPANY_ACCESS_DENIED");
  }
  if (
    expectedUserEmail &&
    membershipUserEmail?.trim().toLowerCase() !== expectedUserEmail.trim().toLowerCase()
  ) {
    throw new Error("COMPANY_ACCESS_DENIED");
  }
  if (!isActiveMembership(membership)) throw new Error("COMPANY_MEMBERSHIP_INACTIVE");
  if (!membership.role) throw new Error("COMPANY_MEMBERSHIP_INVALID");
  return membership.role;
}

export async function loadTenantMembershipRole(
  db: TenantMembershipDb,
  companyId: string,
  userEmail: string,
): Promise<string> {
  const { data: membership, error } = await db
    .from("company_memberships")
    .select("*")
    .eq("company_id", companyId)
    .eq("user_email", userEmail)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return requireActiveMembership(membership, companyId, userEmail);
}

export function accessStatusForErrorMessage(message: string): number {
  if (message === "AUTH_REQUIRED") return 401;
  if (
    message.includes("ACCESS") ||
    message.includes("MEMBERSHIP") ||
    message.includes("DENIED") ||
    message.includes("DISABLED") ||
    message.includes("LICENSED")
  ) {
    return 403;
  }
  if (message === "ADVANCE_INVALID_STATE") return 409;
  return 500;
}
