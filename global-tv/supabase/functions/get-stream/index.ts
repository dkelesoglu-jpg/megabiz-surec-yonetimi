// Bir kanalın HLS adresini, yayın hakkını yeniden doğrulayarak döner.
// İstemci channel_streams tablosunu okuyamaz (RLS); adres yalnızca buradan gelir.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const { channel_id: channelId, country } = await req.json().catch(() => ({}));
  if (typeof channelId !== 'string') return json({ error: 'channel_id_required' }, 400);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const today = new Date().toISOString().slice(0, 10);

  const { data: rights, error: rightsError } = await admin
    .from('broadcast_rights')
    .select('allowed_countries, channels!inner(is_active)')
    .eq('channel_id', channelId)
    .eq('status', 'verified')
    .eq('channels.is_active', true)
    .lte('valid_from', today)
    .gte('valid_until', today);
  if (rightsError) return json({ error: 'lookup_failed' }, 500);
  if (!rights || rights.length === 0) return json({ error: 'not_available' }, 404);

  // Ülke: önce CDN/proxy başlığı, yoksa istemcinin bildirdiği bölge.
  const viewerCountry = (req.headers.get('cf-ipcountry') ?? country ?? '').toUpperCase();
  const allowed = rights.some((r) => (r.allowed_countries as string[]).includes(viewerCountry));
  if (!allowed) return json({ error: 'geo_blocked' }, 403);

  const { data: stream } = await admin
    .from('channel_streams')
    .select('hls_url')
    .eq('channel_id', channelId)
    .order('is_primary', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!stream) return json({ error: 'not_available' }, 404);

  return json({ url: stream.hls_url });
});
