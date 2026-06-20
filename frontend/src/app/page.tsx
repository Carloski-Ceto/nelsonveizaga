import Link from 'next/link';
import { LogIn, Shield, LayoutDashboard } from 'lucide-react';
import Navbar from '@/components/Navbar';
import EyeIllustration from '@/components/EyeIllustration';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.hero}>
      <Navbar />

      <div className={styles.heroContent}>
        <div className={styles.heroText}>
          <span className={styles.heroBadge}>
            <Shield size={14} strokeWidth={2} />
            Acceso interno
          </span>
          <h1 className={styles.heroTitle}>
            Administración <span className={styles.heroTitleAccent}>interna</span>
          </h1>
          <p className={styles.heroDesc}>
            Espacio reservado al personal de la clínica para administrar accesos y conservar un
            registro claro de la actividad cuando haga falta revisarla.
          </p>
          <div className={styles.heroCTAs}>
            <Link href="/login" className={styles.ctaPrimary}>
              <LogIn size={18} />
              Iniciar sesión
            </Link>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutDashboard size={16} /> Un solo panel para la gestión del día a día
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} /> Accesos alineados con el rol de cada persona en la clínica
            </li>
          </ul>
        </div>

        <div className={styles.heroIllustration}>
          <EyeIllustration />
        </div>
      </div>
    </div>
  );
}
