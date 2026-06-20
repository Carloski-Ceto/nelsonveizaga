'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Eye, Lock, Mail, EyeOff, ChevronLeft, Shield, Activity, LayoutDashboard } from 'lucide-react';
import EyeIllustration from '@/components/EyeIllustration';
import { browserApiOrigin } from '@/lib/api';
import { saveTokens } from '@/lib/auth';
import { getPublicAppName, getPublicAppTagline } from '@/lib/siteConfig';
import { devLoginHintPassword, devLoginHintUser, showDevLoginHint } from '@/lib/loginDevHint';
import styles from './page.module.css';

const brandName = getPublicAppName() || 'Portal';
const brandTagline = getPublicAppTagline();

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [remember,     setRemember]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (lockoutSeconds <= 0) return undefined;
    const id = window.setTimeout(() => {
      setLockoutSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [lockoutSeconds]);

  const formLocked = loading || lockoutSeconds > 0;

  function formatWait(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m} min ${s}s` : `${s}s`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (lockoutSeconds > 0) {
      return;
    }

    setLoading(true);
    try {
      const origin = browserApiOrigin();
      const loginUrl = origin ? `${origin}/api/auth/login/` : '/api/auth/login/';
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429) {
          const retry =
            typeof data.retry_after_seconds === 'number' && data.retry_after_seconds >= 0
              ? Math.ceil(data.retry_after_seconds)
              : 60;
          setLockoutSeconds(retry);
          const msg =
            (data.login && (Array.isArray(data.login) ? data.login[0] : data.login)) ||
            'Demasiados intentos fallidos. Espera antes de volver a intentar.';
          setError(typeof msg === 'string' ? msg : 'Espera antes de volver a intentar.');
          setLoading(false);
          return;
        }
        const msg =
          (data.login && (Array.isArray(data.login) ? data.login[0] : data.login)) ||
          data.detail ||
          data.non_field_errors?.[0] ||
          'Credenciales incorrectas o cuenta no disponible.';
        setError(typeof msg === 'string' ? msg : 'Error al iniciar sesión.');
        setLoading(false);
        return;
      }
      setLockoutSeconds(0);
      saveTokens(data.access, data.refresh);
      if (remember) {
        /* tokens ya persisten en localStorage */
      }
      router.replace('/dashboard');
    } catch {
      setError('No se pudo conectar con el servidor.');
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      {/* ── Panel izquierdo ── */}
      <div className={styles.leftPanel}>
        {/* Partículas decorativas */}
        <div className={styles.particles} aria-hidden>
          {[
            { w:10, h:10, top:'12%', left:'15%', dur:'7s',   delay:'0s'   },
            { w:6,  h:6,  top:'25%', left:'75%', dur:'9s',   delay:'1.5s' },
            { w:14, h:14, top:'65%', left:'18%', dur:'8s',   delay:'0.8s' },
            { w:8,  h:8,  top:'78%', left:'70%', dur:'6s',   delay:'2s'   },
            { w:5,  h:5,  top:'45%', left:'88%', dur:'10s',  delay:'0.4s' },
            { w:12, h:12, top:'88%', left:'40%', dur:'7.5s', delay:'1.2s' },
          ].map(({ w, h, top, left, dur, delay }, i) => (
            <div
              key={i}
              className={styles.particle}
              style={{
                width: w, height: h,
                top, left,
                ['--dur' as string]: dur,
                ['--delay' as string]: delay,
              }}
            />
          ))}
        </div>

        <div className={styles.leftContent}>
          <div className={styles.illustration}>
            <EyeIllustration />
          </div>

          <p className={styles.brandName}>{brandName}</p>
          {brandTagline ? <p className={styles.brandTagline}>{brandTagline}</p> : null}

          <ul className={styles.featureList}>
            {[
              { icon: Shield, text: 'Acceso seguro y controlado' },
              { icon: LayoutDashboard, text: 'Gestión de equipo y responsabilidades' },
              { icon: Activity, text: 'Registro de actividad relevante' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className={styles.featureItem}>
                <span className={styles.featureIcon}><Icon size={14} strokeWidth={2} /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className={styles.rightPanel}>
        <div className={styles.card}>

          {/* Logo pequeño (solo en mobile) */}
          <div className={styles.mobileHeader}>
            <div className={styles.mobileLogoRow}>
              <div className={styles.mobileLogoIcon}><Eye size={16} strokeWidth={2.5} /></div>
              <span className={styles.mobileBrandName}>{brandName}</span>
            </div>
            {brandTagline ? <span className={styles.mobileBrandSub}>{brandTagline}</span> : null}
          </div>

          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Iniciar Sesión</h1>
            <p className={styles.cardSubtitle}>
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error && (
              <div className={styles.errorBanner} role="alert">
                <Lock size={15} />
                <span>
                  {error}
                  {lockoutSeconds > 0 ? (
                    <> Puedes reintentar en {formatWait(lockoutSeconds)}.</>
                  ) : null}
                </span>
              </div>
            )}

            {/* Email */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">
                Usuario o correo
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Mail size={16} /></span>
                <input
                  id="email"
                  type="text"
                  autoComplete="username"
                  placeholder="admin o correo@dominio.com"
                  className={styles.input}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={formLocked}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">
                Contraseña
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Lock size={16} /></span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={styles.input}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={formLocked}
                />
                <button
                  type="button"
                  className={styles.togglePwd}
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Opciones */}
            <div className={styles.formOptions}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  disabled={formLocked}
                />
                Recordarme
              </label>
              <Link href="/forgot-password" className={styles.forgotLink}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={formLocked}>
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Verificando…
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className={styles.cardFooter}>
            <Link href="/" className={styles.backLink}>
              <ChevronLeft size={15} />
              Volver al inicio
            </Link>
          </div>
        </div>

        {showDevLoginHint() ? (
          <aside className={styles.devHint} aria-label="Credenciales de administrador para pruebas">
            <p className={styles.devHintTitle}>Administrador (desarrollo)</p>
            <dl className={styles.devHintList}>
              <div className={styles.devHintRow}>
                <dt>Usuario</dt>
                <dd>
                  <code className={styles.devHintCode}>{devLoginHintUser()}</code>
                </dd>
              </div>
              <div className={styles.devHintRow}>
                <dt>Contraseña</dt>
                <dd>
                  <code className={styles.devHintCode}>{devLoginHintPassword()}</code>
                </dd>
              </div>
            </dl>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
