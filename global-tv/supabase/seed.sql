-- YALNIZCA yerel/dev ve staging ortamı içindir. prod'a ASLA uygulanmaz.
-- Demo akışlar sağlayıcıların test amacıyla yayımladığı içeriklerdir;
-- bkz. docs/is-listeleri/yayin-lisansi.md

insert into public.channels (id, slug, name, country_code, category, language, is_active, sort_order, attribution) values
  ('00000000-0000-4000-8000-000000000001', 'demo-apple-bipbop', 'Apple HLS Test (BipBop)', 'US', 'other',         'en', true, 10, 'Apple HLS developer example stream'),
  ('00000000-0000-4000-8000-000000000002', 'demo-mux-bbb',      'Big Buck Bunny',          'NL', 'kids',          'en', true, 20, '© Blender Foundation, CC BY 3.0 · stream: Mux test streams'),
  ('00000000-0000-4000-8000-000000000003', 'demo-mux-tos',      'Tears of Steel',          'NL', 'entertainment', 'en', true, 30, '© Blender Foundation, CC BY 3.0 · stream: Mux test streams'),
  ('00000000-0000-4000-8000-000000000004', 'demo-tr-haber',     'Demo Haber TR',           'TR', 'news',          'tr', true, 40, 'Yer tutucu: lisanslı kanal bulunana kadar demo akış'),
  ('00000000-0000-4000-8000-000000000005', 'demo-expired',      'Süresi Dolmuş Demo',      'TR', 'sports',        'tr', true, 50, null);

insert into public.broadcast_rights
  (channel_id, rights_holder, license_type, allowed_countries, valid_from, valid_until, status, notes) values
  ('00000000-0000-4000-8000-000000000001', 'Apple Inc. (HLS developer example)', 'demo_test', '{TR,US,GB,DE,NL}', '2026-10-01', '2027-03-31', 'verified', 'Geliştirme testi'),
  ('00000000-0000-4000-8000-000000000002', 'Blender Foundation (CC BY 3.0) / Mux test streams', 'demo_test', '{TR,US,GB,DE,NL}', '2026-10-01', '2027-03-31', 'verified', 'Atıf zorunlu'),
  ('00000000-0000-4000-8000-000000000003', 'Blender Foundation (CC BY 3.0) / Mux test streams', 'demo_test', '{TR,US,GB,DE,NL}', '2026-10-01', '2027-03-31', 'verified', 'Atıf zorunlu'),
  ('00000000-0000-4000-8000-000000000004', 'Blender Foundation (CC BY 3.0) / Mux test streams', 'demo_test', '{TR}',             '2026-10-01', '2027-03-31', 'verified', 'Yer tutucu kanal'),
  -- Yayın hakkı kuralı testi: süresi dolmuş hak → kanal listelenmemeli
  ('00000000-0000-4000-8000-000000000005', 'Test', 'demo_test', '{TR}', '2025-01-01', '2025-12-31', 'verified', 'Süresi dolmuş (test)');

insert into public.channel_streams (channel_id, hls_url) values
  ('00000000-0000-4000-8000-000000000001', 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_adv_example_hevc/master.m3u8'),
  ('00000000-0000-4000-8000-000000000002', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'),
  ('00000000-0000-4000-8000-000000000003', 'https://test-streams.mux.dev/tos_ismc/main.m3u8'),
  ('00000000-0000-4000-8000-000000000004', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'),
  ('00000000-0000-4000-8000-000000000005', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
