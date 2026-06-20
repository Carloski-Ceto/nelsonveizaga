import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  KeyRound,
  Activity,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { fmtDateFull } from '@/lib/timezone';
import { getPublicAppName } from '@/lib/siteConfig';
import DashboardHomeAside from '../DashboardHomeAside';
import styles from '../page.module.css';

const LINKS = [
  {
    href: '/dashboard/usuarios',
    label: 'Usuarios',
    sub: 'Alta, permisos y estado del personal con acceso',
    icon: Users,
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    href: '/dashboard/roles',
    label: 'Roles',
    sub: 'Agrupa permisos según el puesto en la clínica',
    icon: ShieldCheck,
    color: '#0EA5E9',
    bg: '#E0F2FE',
  },
  {
    href: '/dashboard/permisos',
    label: 'Permisos',
    sub: 'Acciones permitidas en cada parte del sistema',
    icon: KeyRound,
    color: '#16A34A',
    bg: '#DCFCE7',
  },
  {
    href: '/dashboard/bitacora',
    label: 'Bitácora',
    sub: 'Quién hizo qué y cuándo, para trazabilidad',
    icon: Activity,
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function InicioPage() {
  const appName = getPublicAppName();

  return (
    <div className={styles.dashboardRoot}>
      <div className={styles.homeLayout}>
        <div className={styles.homeMain}>
          <header className={styles.heroBand}>
            <p className={styles.greeting}>{greeting()},</p>
            <h1 className={styles.pageTitle}>Inicio del panel</h1>
            <div className={styles.heroMeta}>
              <p className={styles.pageDate}>
                <Clock size={14} strokeWidth={2} aria-hidden />
                {fmtDateFull(new Date())}
              </p>
            </div>
            {appName ? (
              <p className={styles.pageIntro}>
                Estás en el espacio de trabajo de <strong>{appName}</strong>. Elige un módulo para
                continuar.
              </p>
            ) : (
              <p className={styles.pageIntro}>Elige un módulo para continuar.</p>
            )}
          </header>

          <section className={styles.quickSection} aria-labelledby="quick-heading">
            <h2 id="quick-heading" className={styles.sectionLabel}>
              Accesos rápidos
            </h2>
            <div className={styles.quickGrid}>
              {LINKS.map(({ href, icon: Icon, label, sub, color, bg }) => (
                <Link key={href} href={href} className={styles.quickCard}>
                  <div className={styles.quickRow}>
                    <div className={styles.quickIcon} style={{ background: bg }}>
                      <Icon size={22} strokeWidth={1.75} color={color} />
                    </div>
                    <div className={styles.quickCopy}>
                      <p className={styles.quickLabel}>{label}</p>
                      <p className={styles.quickSub}>{sub}</p>
                    </div>
                    <ChevronRight className={styles.quickChevron} size={20} aria-hidden />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <DashboardHomeAside />
      </div>
    </div>
  );
}
