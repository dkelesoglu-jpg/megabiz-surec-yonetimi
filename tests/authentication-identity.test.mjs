import assert from "node:assert/strict";
import test from "node:test";
import { sessionUnauthorizedResponse } from "../app/api/session/session-response.ts";
import { getSupabaseIdentity } from "../db/auth-identity.ts";

const requestWithPlatformIdentity = new Request("https://example.test/api/session", {
  headers: {
    "oai-authenticated-user-email": "attacker@example.com",
    "oai-authenticated-user-full-name": "Attacker",
    "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
  },
});

function authResult(user, error = null) {
  return { getUser: async () => ({ data: { user }, error }) };
}

test("geçerli Supabase kullanıcısının e-postası ve metadata adı korunur", async () => {
  const identity = await getSupabaseIdentity(
    authResult({ email: "  USER@Example.COM ", user_metadata: { full_name: "Valid User" } }),
    new Request("https://example.test/api/session"),
  );
  assert.deepEqual(identity, { email: "user@example.com", fullName: "Valid User" });
});

test("fullName metadata alanı da korunur", async () => {
  const identity = await getSupabaseIdentity(
    authResult({ email: "user@example.com", user_metadata: { fullName: "Fallback Name" } }),
    new Request("https://example.test/api/session"),
  );
  assert.equal(identity?.fullName, "Fallback Name");
});

test("sahte platform header'ı geçerli Supabase kimliğini değiştiremez", async () => {
  const identity = await getSupabaseIdentity(
    authResult({ email: "verified@example.com", user_metadata: { full_name: "Verified" } }),
    requestWithPlatformIdentity,
  );
  assert.deepEqual(identity, { email: "verified@example.com", fullName: "Verified" });
});

test("Supabase kullanıcısı yoksa sahte platform header'ı kimlik oluşturamaz", async () => {
  assert.equal(await getSupabaseIdentity(authResult(null), requestWithPlatformIdentity), null);
});

test("auth.getUser hata döndürürse kimlik null olur", async () => {
  assert.equal(
    await getSupabaseIdentity(
      authResult({ email: "user@example.com", user_metadata: {} }, new Error("invalid token")),
      requestWithPlatformIdentity,
    ),
    null,
  );
});

test("geçersiz oturumda auth.getUser istisnası kimlik üretmez", async () => {
  const auth = { getUser: async () => { throw new Error("invalid session"); } };
  assert.equal(await getSupabaseIdentity(auth, requestWithPlatformIdentity), null);
});

test("doğrulanmış e-posta yoksa kimlik null olur", async () => {
  assert.equal(
    await getSupabaseIdentity(authResult({ email: "  ", user_metadata: {} }), requestWithPlatformIdentity),
    null,
  );
});

test("/api/session kimlik yokluğunda 401 AUTH_REQUIRED döndürür", async () => {
  const response = sessionUnauthorizedResponse();
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "AUTH_REQUIRED" });
});
