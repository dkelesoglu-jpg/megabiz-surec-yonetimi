import assert from "node:assert/strict";
import test from "node:test";

import {
  accessStatusForErrorMessage,
  requireActiveMembership,
} from "../db/tenant-access.ts";

function expectForbidden(membership) {
  assert.throws(
    () => requireActiveMembership(membership),
    (error) => {
      assert.equal(accessStatusForErrorMessage(error.message), 403);
      return true;
    },
  );
}

test("aynı şirkette aktif üyelik erişim verir", () => {
  const membership = {
    company_id: "company-a",
    user_email: "user@example.com",
    role: "hr",
    status: "Aktif",
  };
  assert.equal(requireActiveMembership(membership, "company-a", "user@example.com"), "hr");
});

test("üyelik yoksa 403 döner", () => {
  expectForbidden(null);
});

test("pasif üyelik 403 döner", () => {
  expectForbidden({ role: "hr", status: "Pasif" });
});

test("başka şirketin companyId değeri için üyelik bulunamazsa 403 döner", () => {
  const otherCompanyMembership = {
    company_id: "company-a",
    user_email: "user@example.com",
    role: "hr",
    status: "Aktif",
  };
  assert.throws(
    () => requireActiveMembership(otherCompanyMembership, "company-b", "user@example.com"),
    (error) => {
      assert.equal(accessStatusForErrorMessage(error.message), 403);
      return true;
    },
  );
});

test("status alanı olmayan mevcut aktif üyeliklerle uyumluluk korunur", () => {
  assert.equal(requireActiveMembership({ role: "manager" }), "manager");
});
