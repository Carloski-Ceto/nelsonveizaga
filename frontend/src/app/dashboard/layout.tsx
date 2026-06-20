'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DashboardNavbar from '@/components/DashboardNavbar';
import { DashboardUserProvider } from '@/contexts/DashboardUserContext';
import { getAccessToken } from '@/lib/auth';
import styles from './layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  /*
   * collapsed:
   *   Desktop → true = icono-only (72px), false = ancho completo (260px)
   *   Mobile  → true = oculto,            false = visible (overlay)
   */
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/login');
    }
  }, [router]);

  /* En mobile, empezar colapsado */
  useEffect(() => {
    function syncBreakpoint() {
      if (window.innerWidth < 769) setCollapsed(true);
    }
    syncBreakpoint();
    window.addEventListener('resize', syncBreakpoint);
    return () => window.removeEventListener('resize', syncBreakpoint);
  }, []);

  function toggle() {
    setCollapsed(c => !c);
  }

  return (
    <DashboardUserProvider>
      <div className={styles.wrapper}>
        <Sidebar collapsed={collapsed} onClose={() => setCollapsed(true)} />

        <div className={`${styles.main} ${collapsed ? styles.sidebarCollapsed : ''}`}>
          <DashboardNavbar onMenuToggle={toggle} />
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </DashboardUserProvider>
  );
}
