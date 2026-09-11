import { getDb } from "../../../db";
import { getServiceClient } from "../../../db/supabase";
import { accessError, getCompanyId, requireAccess, requireModuleAccess, writeAudit } from "../../../db/authorization";
import { camelizeKeys } from "../../../db/case";
import { isHealthDocument, withoutHealthDocuments } from "../../../db/health-data";

const DOCUMENTS_BUCKET = "documents";
const DOCUMENT_LIST_COLUMNS = "id, company_id, name, mime_type, size, category, related_type, related_id, version, document_date, expiry_date, uploaded_by, created_at";
const DOCUMENT_FILE_COLUMNS = `${DOCUMENT_LIST_COLUMNS}, storage_key`;

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId);
    await requireModuleAccess(access, "Belge / Evrak Takibi");
    const url = new URL(request.url), download = Number(url.searchParams.get("download"));
    const db = getDb();
    if (download) {
      const { data: row } = await db.from("documents").select(DOCUMENT_FILE_COLUMNS).eq("id", download).eq("company_id", companyId).maybeSingle();
      if (!row || isHealthDocument(row)) return Response.json({ error: "Dosya bulunamadı" }, { status: 404 });
      const { data: blob, error: downloadError } = await getServiceClient().storage.from(DOCUMENTS_BUCKET).download(row.storage_key);
      if (downloadError || !blob) return Response.json({ error: "Dosya içeriği bulunamadı" }, { status: 404 });
      return new Response(blob, {
        headers: { "content-type": row.mime_type, "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(row.name)}` },
      });
    }
    const { data } = await db.from("documents").select(DOCUMENT_LIST_COLUMNS).eq("company_id", companyId).order("created_at", { ascending: false });
    return Response.json({ documents: camelizeKeys(withoutHealthDocuments(data ?? [])) });
  } catch (e) { return accessError(e); }
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Belge / Evrak Takibi", true);
    const form = await request.formData(), file = form.get("file"), category = String(form.get("category") || "Diğer");
    if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Dosya seçiniz" }, { status: 400 });
    if (isHealthDocument({ category, name: file.name }))
      return Response.json({ error: "Sağlık verisi veya sağlık belgesi yüklenemez" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return Response.json({ error: "Dosya en fazla 10 MB olabilir" }, { status: 400 });
    const safe = file.name.replace(/[^\p{L}\p{N}._-]+/gu, "-"),
      key = `${companyId}/${crypto.randomUUID()}-${safe}`,
      now = new Date().toISOString();
    const { error: uploadError } = await getServiceClient()
      .storage.from(DOCUMENTS_BUCKET)
      .upload(key, await file.arrayBuffer(), { contentType: file.type || "application/octet-stream" });
    if (uploadError) throw new Error(uploadError.message);
    const { data: row, error } = await getDb()
      .from("documents")
      .insert({
        company_id: companyId,
        name: file.name,
        storage_key: key,
        mime_type: file.type || "application/octet-stream",
        size: file.size,
        category,
        related_type: String(form.get("relatedType") || ""),
        related_id: String(form.get("relatedId") || ""),
        version: String(form.get("version") || "1.0"),
        document_date: String(form.get("documentDate") || ""),
        expiry_date: String(form.get("expiryDate") || ""),
        uploaded_by: access.email,
        created_at: now,
      })
      .select(DOCUMENT_LIST_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(access, "UPLOAD", "document", row.id, null, { ...row, storage_key: "[protected]" });
    return Response.json({ document: camelizeKeys(row) }, { status: 201 });
  } catch (e) { return accessError(e); }
}

export async function DELETE(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Belge / Evrak Takibi", true);
    const id = Number(new URL(request.url).searchParams.get("id"));
    const db = getDb();
    const { data: row } = await db.from("documents").select(DOCUMENT_FILE_COLUMNS).eq("id", id).eq("company_id", companyId).maybeSingle();
    if (!row) return Response.json({ error: "Dosya bulunamadı" }, { status: 404 });
    const { error: removeError } = await getServiceClient().storage.from(DOCUMENTS_BUCKET).remove([row.storage_key]);
    if (removeError) throw new Error(removeError.message);
    await db.from("documents").delete().eq("id", id).eq("company_id", companyId);
    await writeAudit(access, "DELETE", "document", id, { ...row, storage_key: "[protected]" }, null);
    return Response.json({ ok: true });
  } catch (e) { return accessError(e); }
}
