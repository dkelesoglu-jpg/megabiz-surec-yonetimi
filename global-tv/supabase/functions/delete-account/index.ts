// Oturumu açık kullanıcının hesabını kalıcı olarak siler (Apple 5.1.1(v), Google Play).
// auth.users silinince profil, favoriler, engeller cascade ile silinir;
// sohbet mesajları tetikleyiciyle anonimleştirilir.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { corsHeaders, json } from '../_shared/cors.ts';
import { publishableKey, secretKey, supabaseUrl } from '../_shared/keys.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  const url = supabaseUrl();
  const userClient = createClient(url, publishableKey(), {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return json({ error: 'unauthorized' }, 401);

  const admin = createClient(url, secretKey());
  await admin.from('audit_log').insert({ actor_id: user.id, action: 'account_deleted', entity: 'user', entity_id: user.id });
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return json({ error: 'delete_failed' }, 500);

  return json({ deleted: true });
});
