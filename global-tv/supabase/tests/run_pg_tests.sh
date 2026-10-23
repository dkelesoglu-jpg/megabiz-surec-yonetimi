#!/usr/bin/env bash
# Migration'ları ve RLS testlerini geçici bir PostgreSQL veritabanında çalıştırır.
# Hiçbir uzak Supabase projesine bağlanmaz.
# Gereken: PostgreSQL 15+ istemci araçları ve erişilebilir bir sunucu.
#   PGURL=postgres://postgres:postgres@localhost:5432/postgres ./run_pg_tests.sh
set -euo pipefail
cd "$(dirname "$0")/.."

PGURL="${PGURL:-postgres://postgres:postgres@localhost:5432/postgres}"
DB="globaltv_test_$$"

psql "$PGURL" -q -c "create database $DB" >/dev/null
trap 'psql "$PGURL" -q -c "drop database if exists $DB" >/dev/null' EXIT
TEST_URL="${PGURL%/*}/$DB"

run() { psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f "$1"; }

# Roller küme düzeyindedir; daha önce oluşturulduysa atla.
if ! psql "$PGURL" -tAc "select 1 from pg_roles where rolname = 'authenticated'" | grep -q 1; then
  psql "$PGURL" -q -c "create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;"
fi
sed '/^create role/d' tests/supabase_stubs.sql > "/tmp/stubs_$$.sql"
run "/tmp/stubs_$$.sql"; rm -f "/tmp/stubs_$$.sql"

for f in migrations/*.sql; do echo "→ $f"; run "$f"; done
run tests/grants.sql
echo "→ seed.sql"; run seed.sql
echo "→ tests/rls_test.sql"; run tests/rls_test.sql 2>&1 | grep -E "ok -|BAŞARISIZ|GEÇTİ|ERROR" | sed "s/^psql:[^ ]* NOTICE:  /  /"
