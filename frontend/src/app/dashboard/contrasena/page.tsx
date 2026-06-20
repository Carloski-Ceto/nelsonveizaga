'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import styles from '../iam.module.css';
import pwd from './page.module.css';

function formatApiErrors(data: unknown): string {
  if (!data || typeof data !== 'object') return 'No se pudo actualizar la contraseña.';
  const d = data as Record<string, unknown>;
  if (typeof d.error === 'string') return d.error;
  if (typeof d.detail === 'string') return d.detail;
  const parts: string[] = [];
  for (const [key, val] of Object.entries(d)) {
    if (Array.isArray(val) && val.length && typeof val[0] === 'string') {
      parts.push(`${key}: ${val[0]}`);
    } else if (typeof val === 'string') {
      parts.push(val);
    }
  }
  return parts.length ? parts.join(' ') : 'No se pudo actualizar la contraseña.';
}

export default function ContrasenaPage() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [nueva2, setNueva2] = useState('');
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showNueva2, setShowNueva2] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setSaving(true);
    try {
      const { data } = await api.post<{ mensaje?: string }>('/api/auth/change-password/', {
        password_actual: actual,
        password_nuevo: nueva,
        password_nuevo2: nueva2,
      });
      setOk(data.mensaje ?? 'Contraseña actualizada correctamente.');
      setActual('');
      setNueva('');
      setNueva2('');
      setShowActual(false);
      setShowNueva(false);
      setShowNueva2(false);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown; status?: number } };
      setErr(formatApiErrors(ax.response?.data));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={pwd.shell}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Cambiar contraseña</h1>
        <p className={styles.muted}>
          Indica tu contraseña actual y elige una nueva de al menos 8 caracteres, con una mayúscula,
          una minúscula y un número. Solo se permiten letras y números.
        </p>
      </div>

      {err && <div className={styles.err}>{err}</div>}
      {ok && <div className={styles.ok}>{ok}</div>}

      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={pwd.form}>
          <div className={pwd.field}>
            <label className={pwd.label} htmlFor="pwdActual">
              Contraseña actual
            </label>
            <div className={pwd.inputWrap}>
              <input
                id="pwdActual"
                className={pwd.input}
                type={showActual ? 'text' : 'password'}
                autoComplete="current-password"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                required
                disabled={saving}
                placeholder="••••••••"
              />
              <button
                type="button"
                className={pwd.toggle}
                onClick={() => setShowActual((v) => !v)}
                disabled={saving}
                aria-label={showActual ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
              >
                {showActual ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
              </button>
            </div>
          </div>

          <div className={pwd.field}>
            <label className={pwd.label} htmlFor="pwdNueva">
              Contraseña nueva
            </label>
            <div className={pwd.inputWrap}>
              <input
                id="pwdNueva"
                className={pwd.input}
                type={showNueva ? 'text' : 'password'}
                autoComplete="new-password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                required
                disabled={saving}
                placeholder="Mínimo según política del sistema"
              />
              <button
                type="button"
                className={pwd.toggle}
                onClick={() => setShowNueva((v) => !v)}
                disabled={saving}
                aria-label={showNueva ? 'Ocultar contraseña nueva' : 'Mostrar contraseña nueva'}
              >
                {showNueva ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
              </button>
            </div>
          </div>

          <div className={pwd.field}>
            <label className={pwd.label} htmlFor="pwdNueva2">
              Confirmar contraseña nueva
            </label>
            <div className={pwd.inputWrap}>
              <input
                id="pwdNueva2"
                className={pwd.input}
                type={showNueva2 ? 'text' : 'password'}
                autoComplete="new-password"
                value={nueva2}
                onChange={(e) => setNueva2(e.target.value)}
                required
                disabled={saving}
                placeholder="Repite la contraseña nueva"
              />
              <button
                type="button"
                className={pwd.toggle}
                onClick={() => setShowNueva2((v) => !v)}
                disabled={saving}
                aria-label={
                  showNueva2 ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'
                }
              >
                {showNueva2 ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
              </button>
            </div>
          </div>

          <div className={pwd.actions}>
            <button type="submit" className={pwd.submit} disabled={saving}>
              {saving ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
