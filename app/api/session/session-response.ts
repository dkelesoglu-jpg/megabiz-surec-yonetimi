export function sessionUnauthorizedResponse(): Response {
  return Response.json({ error: "AUTH_REQUIRED" }, { status: 401 });
}
