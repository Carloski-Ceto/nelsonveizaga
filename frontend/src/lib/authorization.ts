import type { MeProfile } from './meProfile';

export type AppModule = 'pacientes' | 'especialistas' | 'medicos' | 'citas' | 'consultas' | 'historialclinico' | 'evoluciones' | 'antecedentes';
export type ClinicalModule = AppModule | 'agenda' | 'dashboard' | 'reportes';
export type CitasAction = 'crear' | 'reprogramar' | 'cancelar';

const CLINICAL_VIEW_ROLES = new Set(['ADMIN', 'ADMINISTRATIVO', 'MEDICO', 'ESPECIALISTA']);
const ADMIN_ONLY_ROUTES = new Set(['/dashboard/seguridad-login']);
const IAM_ADMIN_ROUTES = new Set(['/dashboard/usuarios', '/dashboard/roles', '/dashboard/permisos']);
const CLINICAL_ROUTES = new Set(['/dashboard', '/dashboard/dashboard', '/dashboard/pacientes', '/dashboard/especialistas', '/dashboard/medicos', '/dashboard/citas', '/dashboard/agenda-medica', '/dashboard/consultas', '/dashboard/reportes', '/dashboard/historial-clinico', '/dashboard/evoluciones', '/dashboard/antecedentes']);
const CLINICAL_VIEW_ROLES_BY_MODULE: Record<ClinicalModule, ReadonlySet<string>> = {
  pacientes: CLINICAL_VIEW_ROLES,
  especialistas: CLINICAL_VIEW_ROLES,
  medicos: CLINICAL_VIEW_ROLES,
  citas: CLINICAL_VIEW_ROLES,
  consultas: CLINICAL_VIEW_ROLES,
  historialclinico: CLINICAL_VIEW_ROLES,
  evoluciones: CLINICAL_VIEW_ROLES,
  antecedentes: CLINICAL_VIEW_ROLES,
  agenda: CLINICAL_VIEW_ROLES,
  dashboard: CLINICAL_VIEW_ROLES,
  reportes: CLINICAL_VIEW_ROLES,
};

const WRITE_ROLES_BY_MODULE: Record<AppModule, ReadonlySet<string>> = {
  pacientes: new Set(['ADMIN', 'ADMINISTRATIVO']),
  especialistas: new Set(['ADMIN', 'ADMINISTRATIVO']),
  medicos: new Set(['ADMIN', 'ADMINISTRATIVO']),
  citas: new Set(['ADMIN', 'ADMINISTRATIVO']),
  consultas: new Set(['ADMIN', 'MEDICO', 'ESPECIALISTA']),
  historialclinico: new Set(['ADMIN', 'MEDICO']),
  evoluciones: new Set(['ADMIN', 'MEDICO', 'ESPECIALISTA']),
  antecedentes: new Set(['ADMIN', 'MEDICO', 'ESPECIALISTA']),
};

const VIEW_PERMISSIONS_BY_MODULE: Record<ClinicalModule, string[]> = {
  pacientes: ['pacientes.listar'],
  especialistas: ['especialistas.listar'],
  medicos: ['medicos.listar'],
  citas: ['citas.listar'],
  consultas: ['consultas.listar'],
  historialclinico: ['historialclinico.listar'],
  evoluciones: ['evoluciones.listar'],
  antecedentes: ['antecedentes.listar'],
  agenda: ['agenda.ver'],
  dashboard: ['dashboard.ver'],
  reportes: ['reportes.ver'],
};

const WRITE_PERMISSIONS_BY_MODULE: Record<AppModule, string[]> = {
  pacientes: ['pacientes.crear', 'pacientes.editar', 'pacientes.eliminar'],
  especialistas: ['especialistas.crear', 'especialistas.editar', 'especialistas.eliminar'],
  medicos: ['medicos.crear', 'medicos.editar', 'medicos.eliminar'],
  citas: ['citas.crear', 'citas.reprogramar', 'citas.cancelar'],
  consultas: ['consultas.crear'],
  historialclinico: ['historialclinico.archivar'],
  evoluciones: ['evoluciones.crear', 'evoluciones.editar', 'evoluciones.eliminar'],
  antecedentes: ['antecedentes.crear', 'antecedentes.editar', 'antecedentes.eliminar'],
};

const CITA_ACTION_PERMISSION: Record<CitasAction, string> = {
  crear: 'citas.crear',
  reprogramar: 'citas.reprogramar',
  cancelar: 'citas.cancelar',
};

function hasAnyPermission(permissionCodes: Set<string>, required: string[]): boolean {
  return required.some((code) => permissionCodes.has(code));
}

function hasEffectivePermission(permissionCodes: Set<string> | undefined, module: ClinicalModule, mode: 'view' | 'write'): boolean | null {
  if (!permissionCodes || permissionCodes.size === 0) return null;
  if (mode === 'view') return hasAnyPermission(permissionCodes, VIEW_PERMISSIONS_BY_MODULE[module]);
  if (module === 'agenda' || module === 'dashboard' || module === 'reportes') return false;
  return hasAnyPermission(permissionCodes, WRITE_PERMISSIONS_BY_MODULE[module]);
}

export function canWriteModule(me: MeProfile | null, module: AppModule, permissionCodes?: Set<string>): boolean {
  if (!me) return false;
  const byPermission = hasEffectivePermission(permissionCodes, module, 'write');
  if (byPermission != null) return byPermission;
  return WRITE_ROLES_BY_MODULE[module].has(me.tipo_usuario);
}

export function canViewRoute(me: MeProfile | null, href: string, permissionCodes?: Set<string>): boolean {
  if (!me) return false;

  if (ADMIN_ONLY_ROUTES.has(href)) return me.tipo_usuario === 'ADMIN';
  if (IAM_ADMIN_ROUTES.has(href)) return me.tipo_usuario === 'ADMIN';
  if (CLINICAL_ROUTES.has(href)) {
    const byModule: Record<string, ClinicalModule> = {
      '/dashboard': 'dashboard',
      '/dashboard/dashboard': 'dashboard',
      '/dashboard/pacientes': 'pacientes',
      '/dashboard/especialistas': 'especialistas',
      '/dashboard/medicos': 'medicos',
      '/dashboard/citas': 'citas',
      '/dashboard/agenda-medica': 'agenda',
      '/dashboard/consultas': 'consultas',
      '/dashboard/reportes': 'reportes',
      '/dashboard/historial-clinico': 'historialclinico',
      '/dashboard/evoluciones': 'evoluciones',
      '/dashboard/antecedentes': 'antecedentes',
    };
    const clinicalModule = byModule[href];
    return canViewClinicalModule(me, clinicalModule, permissionCodes);
  }

  return true;
}

export function canViewClinicalModule(me: MeProfile | null, module: ClinicalModule, permissionCodes?: Set<string>): boolean {
  if (!me) return false;
  if (module === 'reportes' && me.tipo_usuario === 'MEDICO') return false;
  const byPermission = hasEffectivePermission(permissionCodes, module, 'view');
  if (byPermission != null) return byPermission;
  return CLINICAL_VIEW_ROLES_BY_MODULE[module].has(me.tipo_usuario);
}

export function canWriteCitaAction(me: MeProfile | null, action: CitasAction, permissionCodes?: Set<string>): boolean {
  if (!me) return false;
  if (!permissionCodes || permissionCodes.size === 0) {
    return WRITE_ROLES_BY_MODULE.citas.has(me.tipo_usuario);
  }
  return permissionCodes.has(CITA_ACTION_PERMISSION[action]);
}
