import assert from "node:assert/strict";
import test from "node:test";

import {
  accessStatusForErrorMessage,
  loadTenantMembershipRole,
} from "../db/tenant-access.ts";

function supabaseMembershipDb(rows) {
  const calls = [];
  let table = "";
  const filters = new Map();
  const query = {
    select(columns) {
      calls.push(["select", columns]);
      return query;
    },
    eq(column, value) {
      calls.push(["eq", column, value]);
      filters.set(column, value);
      return query;
    },
    async maybeSingle() {
      calls.push(["maybeSingle"]);
      const matches = rows.filter(
        (row) =>
          row.company_id === filters.get("company_id") &&
          row.user_email === filters.get("user_email"),
      );
      return { data: matches[0] ?? null, error: null };
    },
  };
  return {
    calls,
    from(name) {
      table = name;
      calls.push(["from", name]);
      assert.equal(table, "company_memberships");
      return query;
    },
  };
}

async function expectForbidden(promise) {
  await assert.rejects(promise, (error) => {
    assert.equal(accessStatusForErrorMessage(error.message), 403);
    return true;
  });
}

const activeMembership = {
  company_id: "company-a",
  user_email: "user@example.com",
  role: "hr",
  status: "Aktif",
};

test("requireAccess üyelik zinciri aynı şirkette aktif üyeliğe erişim verir", async () => {
  const db = supabaseMembershipDb([activeMembership]);
  assert.equal(await loadTenantMembershipRole(db, "company-a", "user@example.com"), "hr");
  assert.deepEqual(db.calls, [
    ["from", "company_memberships"],
    ["select", "*"],
    ["eq", "company_id", "company-a"],
    ["eq", "user_email", "user@example.com"],
    ["maybeSingle"],
  ]);
});

test("requireAccess üyelik zinciri pasif üyeliğe 403 verir", async () => {
  const db = supabaseMembershipDb([{ ...activeMembership, status: "Pasif" }]);
  await expectForbidden(loadTenantMembershipRole(db, "company-a", "user@example.com"));
});

test("requireAccess üyelik zinciri üyelik yoksa 403 verir", async () => {
  const db = supabaseMembershipDb([]);
  await expectForbidden(loadTenantMembershipRole(db, "company-a", "user@example.com"));
});

test("requireAccess üyelik zinciri başka şirket companyId değerine 403 verir", async () => {
  const db = supabaseMembershipDb([activeMembership]);
  await expectForbidden(loadTenantMembershipRole(db, "company-b", "user@example.com"));
});
