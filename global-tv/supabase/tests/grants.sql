-- Supabase'deki varsayılan yetkilerin karşılığı (düz PostgreSQL testi için).
-- Migration'lardan ÖNCE uygulanır; böylece migration içindeki revoke'lar da sınanır.
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
