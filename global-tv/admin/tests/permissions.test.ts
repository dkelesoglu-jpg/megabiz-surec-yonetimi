import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PERMISSIONS, ROLE_PERMISSIONS, can, canEnterPanel } from '../src/lib/permissions';
import type { Role } from '../src/lib/types';

// Arayüzdeki izin listesi, sunucudaki role_permissions tablosuyla birebir aynı olmalı.
function serverPermissions(): Map<string, Set<string>> {
  const sql = readFileSync(resolve(__dirname, '../../supabase/migrations/20261025000100_admin_panel.sql'), 'utf8');
  const block = sql.slice(sql.indexOf('insert into public.role_permissions'), sql.indexOf(') as t(r, p);'));
  const map = new Map<string, Set<string>>();
  for (const [, role, perm] of block.matchAll(/\('(\w+)', '([\w.]+)'\)/g)) {
    if (!map.has(role!)) map.set(role!, new Set());
    map.get(role!)!.add(perm!);
  }
  return map;
}

describe('izinler', () => {
  it('sunucudaki role_permissions ile aynı', () => {
    const server = serverPermissions();
    expect(server.size).toBeGreaterThan(0);
    for (const role of ['admin', 'editor', 'moderator'] as Role[]) {
      expect([...(server.get(role) ?? [])].sort()).toEqual([...ROLE_PERMISSIONS[role]].sort());
    }
    expect(server.has('user')).toBe(false);
    expect(ROLE_PERMISSIONS.user).toEqual([]);
  });

  it('admin tüm izinlere sahip', () => {
    for (const p of PERMISSIONS) expect(can('admin', p)).toBe(true);
  });

  it('rol ayrımları', () => {
    expect(can('editor', 'channels.manage')).toBe(true);
    expect(can('editor', 'users.moderate')).toBe(false);
    expect(can('moderator', 'channels.manage')).toBe(false);
    expect(can('moderator', 'reports.manage')).toBe(true);
    expect(can('moderator', 'users.manage_roles')).toBe(false);
    expect(can(undefined, 'dashboard.read')).toBe(false);
  });

  it('normal kullanıcı panele giremez', () => {
    expect(canEnterPanel('user')).toBe(false);
    expect(canEnterPanel('moderator')).toBe(true);
  });
});
