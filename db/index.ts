import { getServiceClient } from "./supabase";

/**
 * hrms_pro şemasına, service-role yetkisiyle bağlanan Supabase istemcisi.
 * Önceden Cloudflare D1 + Drizzle kullanıyordu; artık Supabase Postgres kullanıyor.
 */
export function getDb() {
  return getServiceClient();
}
