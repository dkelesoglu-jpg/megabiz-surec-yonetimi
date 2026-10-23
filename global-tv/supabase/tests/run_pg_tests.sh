#!/usr/bin/env bash
# Migration'ları ve veritabanı testlerini geçici PostgreSQL veritabanlarında çalıştırır.
# Her test dosyası kendi temiz veritabanında koşar. Hiçbir uzak Supabase projesine bağlanmaz.
# Gereken: PostgreSQL 15+ istemci araçları ve erişilebilir bir sunucu.
#   PGURL=postgres://postgres:postgres@localhost:5432/postgres ./run_pg_tests.sh
set -euo pipefail
cd "$(dirname "$0")/.."

PGURL="${PGURL:-postgres://postgres:postgres@localhost:5432/postgres}"
CREATED=()
cleanup() { for db in "${CREATED[@]}"; do psql "$PGURL" -q -c "drop database if exists $db" >/dev/null; done; }
trap cleanup EXIT

# Roller küme düzeyindedir; daha önce oluşturulduysa atla.
if ! psql "$PGURL" -tAc "select 1 from pg_roles where rolname = 'authenticated'" | grep -q 1; then
  psql "$PGURL" -q -c "create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;"
fi
STUBS="$(mktemp)"
sed '/^create role/d' tests/supabase_stubs.sql > "$STUBS"

for t in tests/*_test.sql; do
  db="globaltv_test_$$_$(basename "$t" .sql)"
  psql "$PGURL" -q -c "create database $db" >/dev/null
  CREATED+=("$db")
  url="${PGURL%/*}/$db"
  run() { psql "$url" -q -v ON_ERROR_STOP=1 -f "$1"; }

  run "$STUBS" 2>/dev/null
  run tests/grants.sql
  for f in migrations/*.sql; do run "$f"; done
  run seed.sql
  echo "→ $t"
  run "$t" 2>&1 | grep -E "ok -|BAŞARISIZ|GEÇTİ|ERROR" | sed "s/^psql:[^ ]* NOTICE:  /  /"
done
rm -f "$STUBS"
