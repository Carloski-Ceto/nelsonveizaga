'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  Menu, Bell, ChevronDown, ChevronRight,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import { logoutApi } from '@/lib/api';
import { initialsFromMe, labelTipoUsuario } from '@/lib/meProfile';
import styles from './DashboardNavbar.module.css';

const PAGE_NAMES: Record<string, string> = {
  '/dashboard':                 'Dashboard',
  '/dashboard/inicio':          'Inicio',
  '/dashboard/dashboard':       'Dashboard clínico',
  '/dashboard/usuarios':        'Usuarios',
  '/dashboard/roles':           'Roles',
  '/dashboard/permisos':        'Permisos',
  '/dashboard/seguridad-login': 'Login seguridad',
  '/dashboard/contrasena':      'Contraseña',
  '/dashboard/bitacora':        'Bitácora',
  '/dashboard/pacientes':       'Pacientes',
  '/dashboard/especialistas':   'Especialistas',
  '/dashboard/citas':           'Citas',
  '/dashboard/agenda-medica':   'Agenda médica',
  '/dashboard/consultas':       'Consultas',
  '/dashboard/reportes':        'Reportes',
};

interface DashboardNavbarProps {
  onMenuToggle: () => void;
}

export default function DashboardNavbar({ onMenuToggle }: DashboardNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { me, loading } = useDashboardUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPage = PAGE_NAMES[pathname] ?? 'Dashboard';

  const displayName =
    (me?.nombre_completo?.trim() || me?.username?.trim() || (loading ? '…' : 'Usuario')) ?? 'Usuario';
  const roleLabel = me
    ? labelTipoUsuario(me.tipo_usuario)
    : loading
      ? 'Cargando…'
      : '—';
  const initials = me ? initialsFromMe(me) : loading ? '·' : '?';

  async function handleLogout() {
    setDropdownOpen(false);
    await logoutApi();
    router.replace('/login');
  }

  /* Cerrar dropdown al hacer click fuera */
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <header className={styles.navbar}>

      {/* ── Izquierda ── */}
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onMenuToggle}
          aria-label="Alternar menú lateral"
        >
          <Menu size={20} strokeWidth={2} />
        </button>

        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Navegación">
          <Link href="/dashboard" className={styles.breadcrumbHome}>
            Inicio
          </Link>
          {pathname !== '/dashboard' && (
            <>
              <span className={styles.breadcrumbSep}>
                <ChevronRight size={14} />
              </span>
              <span className={styles.breadcrumbCurrent}>{currentPage}</span>
            </>
          )}
        </nav>
      </div>

      {/* ── Derecha ── */}
      <div className={styles.right}>

        {/* Notificaciones */}
        <button className={styles.iconBtn} aria-label="Notificaciones">
          <Bell size={18} strokeWidth={1.8} />
          <span className={styles.badge} aria-hidden />
        </button>

        <div className={styles.divider} />

        {/* Menú de usuario */}
        <div className={styles.userMenu} ref={dropdownRef}>
          <button
            className={styles.userBtn}
            onClick={() => setDropdownOpen(o => !o)}
            aria-label={`Cuenta: ${displayName}`}
            aria-expanded={dropdownOpen}
            title={displayName}
          >
            <div className={styles.avatar}>{initials}</div>
            <ChevronDown size={14} className={styles.chevron} aria-hidden />
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown} role="menu">
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownAvatar}>{initials}</div>
                <div className={styles.dropdownHeaderText}>
                  <span className={styles.dropdownName}>{displayName}</span>
                  {me?.email ? (
                    <span className={styles.dropdownEmail}>{me.email}</span>
                  ) : null}
                  <span className={styles.dropdownRole}>{roleLabel}</span>
                </div>
              </div>
              <div className={styles.dropdownDivider} />
              <Link
                href="/dashboard/contrasena"
                className={styles.dropdownItem}
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
              >
                <KeyRound size={15} aria-hidden />
                Cambiar contraseña
              </Link>
              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.danger}`}
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
