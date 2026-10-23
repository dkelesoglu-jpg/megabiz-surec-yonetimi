-- Supabase'deki varsayılan yetkilerin karşılığı (düz PostgreSQL testi için).
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
