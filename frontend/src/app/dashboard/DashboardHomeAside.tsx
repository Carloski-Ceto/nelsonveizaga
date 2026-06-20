'use client';

import { User, Clock, Mail } from 'lucide-react';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import { fmtDateTime } from '@/lib/timezone';
import { initialsFromMe, labelTipoUsuario } from '@/lib/meProfile';
import styles from './page.module.css';

const ESTADO_STYLE: Record<string, { label: string; className: string }> = {
  ACTIVO: { label: 'Activo', className: styles.asideEstadoActivo },
  INACTIVO: { label: 'Inactivo', className: styles.asideEstadoInactivo },
  BLOQUEADO: { label: 'Bloqueado', className: styles.asideEstadoBloqueado },
};

export default function DashboardHomeAside() {
  const { me, loading } = useDashboardUser();

  if (loading && !me) {
    return (
      <aside className={styles.homeAside} aria-busy="true">
        <div className={styles.asideCard}>
          <p className={styles.asideMuted}>Cargando…</p>
        </div>
      </aside>
    );
  }

  if (!me) return null;

  const initials = initialsFromMe(me);
  const estado = ESTADO_STYLE[me.estado] ?? {
    label: me.estado,
    className: styles.asideEstadoInactivo,
  };
  const ultimo =
    me.ultimo_acceso != null && me.ultimo_acceso !== ''
      ? fmtDateTime(me.ultimo_acceso)
      : 'Aún no registrado';

  return (
    <aside className={styles.homeAside} aria-label="Resumen de tu cuenta">
      <div className={styles.asideCard}>
        <p className={styles.asideEyebrow}>
          <User size={14} strokeWidth={2} aria-hidden />
          Tu cuenta
        </p>
        <div className={styles.asideProfile}>
          <div className={styles.asideAvatar} aria-hidden>
            {initials}
          </div>
          <div className={styles.asideProfileText}>
            <p className={styles.asideName}>{me.nombre_completo?.trim() || me.username}</p>
            <p className={styles.asideRole}>{labelTipoUsuario(me.tipo_usuario)}</p>
            <span className={estado.className}>{estado.label}</span>
          </div>
        </div>
        <ul className={styles.asideMeta}>
          <li>
            <Mail size={14} strokeWidth={2} aria-hidden />
            <span className={styles.asideMetaText}>{me.email}</span>
          </li>
          <li>
            <Clock size={14} strokeWidth={2} aria-hidden />
            <span className={styles.asideMetaBlock}>
              <span className={styles.asideMetaLabel}>Último acceso</span>
              <span className={styles.asideMetaValue}>{ultimo}</span>
            </span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
