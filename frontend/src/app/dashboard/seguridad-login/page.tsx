'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import styles from '../iam.module.css';

interface LoginSeguridadDto {
  max_intentos_fallidos: number;
  minutos_bloqueo: number;
}

function apiErr(e: unknown): string {
  const ax = e as { response?: { data?: Record<string, unknown> } };
  const d = ax.response?.data;
  if (d && typeof d === 'object') {
    for (const v of Object.values(d)) {
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
      if (typeof v === 'string') return v;
    }
  }
  return 'No se pudo guardar la configuración.';
}

export default function SeguridadLoginPage() {
  const { me, loading: meLoading } = useDashboardUser();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [maxIntentos, setMaxIntentos] = useState(5);
  const [minutosBloqueo, setMinutosBloqueo] = useState(10);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    setSaved(null);
    api
      .get<LoginSeguridadDto>('/api/security/login-config/')
      .then((res) => {
        setMaxIntentos(res.data.max_intentos_fallidos);
        setMinutosBloqueo(res.data.minutos_bloqueo);
      })
      .catch((e) => {
        setErr(
          e.response?.status === 403
            ? 'Solo administradores del sistema pueden ver esta configuración.'
            : 'No se pudo cargar la configuración.'
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (meLoading) return;
    if (me?.tipo_usuario === 'ADMIN') {
      load();
      return;
    }
    setLoading(false);
    setErr(
      me
        ? 'Solo administradores del sistema pueden ver esta configuración.'
        : 'Inicia sesión como administrador.',
    );
  }, [me, meLoading, load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(null);
    try {
      const { data } = await api.patch<LoginSeguridadDto>('/api/security/login-config/', {
        max_intentos_fallidos: maxIntentos,
        minutos_bloqueo: minutosBloqueo,
      });
      setMaxIntentos(data.max_intentos_fallidos);
      setMinutosBloqueo(data.minutos_bloqueo);
      setSaved('Cambios guardados.');
    } catch (e) {
      setErr(apiErr(e));
    }
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Seguridad de inicio de sesión</h1>
        <p className={styles.muted}>
          Tras varios intentos fallidos con la misma clave de acceso (usuario o correo), el sistema
          bloquea temporalmente nuevos intentos. No modifica el estado &quot;Bloqueado&quot; manual
          de usuarios.
        </p>
      </div>

      {err && <div className={styles.err}>{err}</div>}
      {saved && <div className={styles.ok}>{saved}</div>}

      {loading || meLoading ? (
        <p className={styles.loading}>Cargando…</p>
      ) : me?.tipo_usuario === 'ADMIN' ? (
        <form className={styles.formCard} onSubmit={handleSave}>
          <div className={styles.formRow}>
            <label htmlFor="maxIntentos">Intentos fallidos antes de bloquear</label>
            <input
              id="maxIntentos"
              type="number"
              min={1}
              max={50}
              value={maxIntentos}
              onChange={(e) => setMaxIntentos(Number(e.target.value))}
              required
            />
            <span className={styles.hint}>Entre 1 y 50.</span>
          </div>
          <div className={styles.formRow}>
            <label htmlFor="minutosBloqueo">Minutos de bloqueo</label>
            <input
              id="minutosBloqueo"
              type="number"
              min={1}
              max={10080}
              value={minutosBloqueo}
              onChange={(e) => setMinutosBloqueo(Number(e.target.value))}
              required
            />
            <span className={styles.hint}>Entre 1 y 10080 (7 días).</span>
          </div>
          <button type="submit" className={styles.btnPrimary}>
            Guardar
          </button>
        </form>
      ) : null}
    </>
  );
}
