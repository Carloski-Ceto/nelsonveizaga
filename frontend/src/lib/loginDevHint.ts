/**
 * Bloque de ayuda con credenciales de desarrollo bajo el formulario de login.
 * Visible en `next dev` o si NEXT_PUBLIC_SHOW_DEV_LOGIN_HINT=true (no recomendado en producción real).
 */

export function showDevLoginHint(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_SHOW_DEV_LOGIN_HINT === 'true'
  );
}

/** Alineado a `seeders/seed_admin.py` por defecto. */
export function devLoginHintUser(): string {
  return (process.env.NEXT_PUBLIC_DEV_ADMIN_USER ?? 'admin').trim() || 'admin';
}

export function devLoginHintPassword(): string {
  return (process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD ?? 'admin123').trim() || 'admin123';
}
