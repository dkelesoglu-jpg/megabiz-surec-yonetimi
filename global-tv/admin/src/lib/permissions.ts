import type { Role } from './types';

// Sunucudaki public.role_permissions tablosunun aynısı
// (supabase/migrations/20261025000100_admin_panel.sql). tests/permissions.test.ts
// iki listenin birebir aynı olduğunu doğrular. Asıl yetki kontrolü sunucudadır;
// buradaki liste yalnızca arayüzde neyin gösterileceğini belirler.
export const PERMISSIONS = [
  'dashboard.read',
  'channels.manage',
  'rights.manage',
  'users.read',
  'users.moderate',
  'users.manage_roles',
  'chat.moderate',
  'reports.manage',
  'ads.manage',
  'settings.manage',
  'announcements.manage',
  'audit.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  editor: ['dashboard.read', 'channels.manage', 'rights.manage', 'announcements.manage'],
  moderator: ['dashboard.read', 'users.read', 'users.moderate', 'chat.moderate', 'reports.manage'],
  user: [],
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Yönetici',
  editor: 'İçerik yöneticisi',
  moderator: 'Moderatör',
  user: 'Kullanıcı',
};

export function can(role: Role | undefined, permission: Permission): boolean {
  return role !== undefined && ROLE_PERMISSIONS[role].includes(permission);
}

/** Panele yalnızca en az bir yönetim iznine sahip roller girebilir. */
export function canEnterPanel(role: Role | undefined): boolean {
  return can(role, 'dashboard.read');
}
