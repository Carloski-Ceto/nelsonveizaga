/** Respuesta de GET /api/auth/me (PerfilSerializer). */
export interface MeProfile {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  telefono?: string | null;
  foto_perfil?: string | null;
  tipo_usuario: string;
  estado: string;
  ultimo_acceso?: string | null;
}

/** Etiquetas alineadas a `TipoUsuario` en backend. */
export const TIPO_USUARIO_LABEL: Record<string, string> = {
  ADMINISTRATIVO: 'Administrativo',
  MEDICO: 'Médico',
  ESPECIALISTA: 'Especialista',
  ADMIN: 'Admin del sistema',
};

export function labelTipoUsuario(codigo: string): string {
  return TIPO_USUARIO_LABEL[codigo] ?? codigo.replace(/_/g, ' ');
}

export function initialsFromMe(me: Pick<MeProfile, 'nombres' | 'apellidos' | 'username'>): string {
  const n = (me.nombres ?? '').trim();
  const a = (me.apellidos ?? '').trim();
  const u = (me.username ?? '').trim();
  const c1 = (n[0] ?? u[0] ?? '?').toUpperCase();
  const c2 = (a[0] ?? u[1] ?? '').toUpperCase();
  return (c1 + c2).slice(0, 2) || '?';
}
