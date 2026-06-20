/**
 * lib/timezone.ts
 * ─────────────────────────────────────────────────────────
 * Utilidades de zona horaria para la Clínica de Ojos Norte.
 *
 * La clínica opera en Santa Cruz de la Sierra, Bolivia.
 * Zona horaria: BOT (Bolivia Time) = UTC-4, sin horario de verano.
 * IANA identifier: "America/La_Paz"
 *
 * El backend Django almacena todas las fechas en UTC (USE_TZ=True).
 * Estas funciones convierten UTC → hora Bolivia para mostrar al usuario.
 */

export const BOLIVIA_TZ = 'America/La_Paz';

/** "29/03/2026 14:32:05" */
export function fmtDateTime(iso: string | Date): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone:    BOLIVIA_TZ,
    year:        'numeric',
    month:       '2-digit',
    day:         '2-digit',
    hour:        '2-digit',
    minute:      '2-digit',
    second:      '2-digit',
    hour12:      false,
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

/** "29 de marzo de 2026" */
export function fmtDateLong(iso: string | Date): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TZ,
    year:     'numeric',
    month:    'long',
    day:      'numeric',
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

/** "sábado, 29 de marzo de 2026" */
export function fmtDateFull(iso: string | Date): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TZ,
    weekday:  'long',
    year:     'numeric',
    month:    'long',
    day:      'numeric',
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

/** "14:32" */
export function fmtTime(iso: string | Date): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TZ,
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

/** "14:32:05" */
export function fmtTimeFull(iso: string | Date): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TZ,
    hour:     '2-digit',
    minute:   '2-digit',
    second:   '2-digit',
    hour12:   false,
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

/** "29/03/2026" */
export function fmtDate(iso: string | Date): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TZ,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

/**
 * Tiempo relativo en español.
 * "hace 5 min", "hace 2h", "ayer", "hace 3 días"
 */
export function fmtRelative(iso: string | Date): string {
  const date    = typeof iso === 'string' ? new Date(iso) : iso;
  const diffMs  = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH   = Math.floor(diffMin / 60);
  const diffD   = Math.floor(diffH   / 24);

  if (diffMin <  1)  return 'ahora mismo';
  if (diffMin <  60) return `hace ${diffMin} min`;
  if (diffH   <  24) return `hace ${diffH}h`;
  if (diffD   === 1) return 'ayer';
  if (diffD   <  7)  return `hace ${diffD} días`;
  return fmtDate(date);
}

/**
 * Hora actual en Bolivia como string "HH:MM:SS".
 * Útil para el reloj en vivo del frontend.
 */
export function nowBoliviaTime(): string {
  return fmtTimeFull(new Date());
}

/**
 * Fecha actual en Bolivia como string largo.
 */
export function nowBoliviaDateFull(): string {
  return fmtDateFull(new Date());
}
