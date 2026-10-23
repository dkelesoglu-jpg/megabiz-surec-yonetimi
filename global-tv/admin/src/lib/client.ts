import { createClient } from '@supabase/supabase-js';
import type { AdminApi } from './api';
import { DemoAdminApi } from './demoApi';
import { SupabaseAdminApi } from './supabaseApi';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** Supabase bilgisi yoksa panel demo modunda çalışır (bellekte, sayfa yenilenince sıfırlanır). */
export function createApi(): AdminApi {
  if (url && key) {
    return new SupabaseAdminApi(createClient(url, key, { auth: { persistSession: true } }));
  }
  return new DemoAdminApi();
}
