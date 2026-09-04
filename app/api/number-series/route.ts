import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess, writeAudit } from "../../../db/authorization";
import { listNumberSeries, SERIES, type SeriesType } from "../../../db/number-series";
import { camelizeKeys } from "../../../db/case";

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId);
    return Response.json({ series: camelizeKeys(await listNumberSeries(companyId)), canEdit: access.role === "super_admin" });
  } catch (error) { return accessError(error); }
}

export async function PUT(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    if (access.role !== "super_admin") return Response.json({ error: "Numara serilerini yalnızca Süper Admin değiştirebilir" }, { status: 403 });
    const payload = await request.json() as Record<string, unknown>, type = String(payload.seriesType) as SeriesType;
    if (!SERIES[type]) return Response.json({ error: "Geçersiz numara serisi" }, { status: 400 });
    const db = getDb();
    const { data: old } = await db.from("number_series").select("*").eq("company_id", companyId).eq("series_type", type).maybeSingle();
    if (!old) return Response.json({ error: "Numara serisi bulunamadı" }, { status: 404 });
    const prefix = String(payload.prefix ?? old.prefix).trim().toUpperCase(),
      digits = Math.max(1, Math.min(12, Number(payload.digits ?? old.digits))),
      startNumber = Math.max(1, Number(payload.startNumber ?? old.start_number)),
      requestedNext = Math.max(1, Number(payload.nextNumber ?? old.last_used + 1));
    const { data: historyRows } = await db
      .from("number_series_history")
      .select("number")
      .eq("company_id", companyId)
      .eq("series_type", type)
      .order("number", { ascending: false })
      .limit(1);
    const highest = historyRows?.[0]?.number ?? 0;
    const minimumNext = Math.max(old.last_used + 1, Number(highest) + 1);
    if (requestedNext < minimumNext) return Response.json({ error: `Sonraki numara ${minimumNext} değerinden küçük olamaz; kullanılan numaralar tekrar verilemez` }, { status: 409 });
    const now = new Date().toISOString();
    const { data: row } = await db
      .from("number_series")
      .update({ prefix, digits, start_number: startNumber, last_used: requestedNext - 1, updated_by: access.email, updated_at: now })
      .eq("company_id", companyId)
      .eq("series_type", type)
      .select()
      .single();
    await writeAudit(access, "UPDATE", "number_series", row.id, old, row);
    return Response.json({ record: camelizeKeys(row) });
  } catch (error) { return accessError(error); }
}
