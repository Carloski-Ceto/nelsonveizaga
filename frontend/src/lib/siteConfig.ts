/**
 * Configuración pública del sitio (inyectada en build desde .env).
 * Usar solo claves NEXT_PUBLIC_* para que estén disponibles en cliente y servidor.
 */

export function getPublicAppName(): string {
  return (process.env.NEXT_PUBLIC_APP_NAME ?? '').trim();
}

export function getPublicAppTagline(): string {
  return (process.env.NEXT_PUBLIC_APP_TAGLINE ?? '').trim();
}

export function getPublicAppDescription(): string {
  return (process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? '').trim();
}

/** Lista separada por comas en .env */
export function getPublicMetaKeywords(): string[] {
  const raw = process.env.NEXT_PUBLIC_META_KEYWORDS ?? '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
