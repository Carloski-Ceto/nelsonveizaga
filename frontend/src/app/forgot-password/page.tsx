'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, CircleCheck, Eye, EyeOff, Info, KeyRound, Lock, Mail } from 'lucide-react';
import EyeIllustration from '@/components/EyeIllustration';
import { browserApiOrigin } from '@/lib/api';
import { getPublicAppName, getPublicAppTagline } from '@/lib/siteConfig';
import styles from '../login/page.module.css';

const brandName = getPublicAppName() || 'Portal';
const brandTagline = getPublicAppTagline();

type Step = 1 | 2 | 3;

function apiUrl(path: string): string {
  const origin = browserApiOrigin();
  return origin ? `${origin}/api${path}` : `/api${path}`;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [emailRequested, setEmailRequested] = useState(false);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const formLocked = loading;

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Indica el correo de tu cuenta.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/auth/reset-password/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      await res.json().catch(() => ({}));
      setEmailRequested(true);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function submitVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    const digits = codigo.replace(/\D/g, '');
    if (!digits) {
      setError('Pega o escribe el código numérico del correo.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/auth/reset-password/verify-code/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), codigo: digits }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'No se pudo verificar el código.');
        setLoading(false);
        return;
      }
      setInfo(typeof data.mensaje === 'string' ? data.mensaje : 'Código correcto.');
      setStep(3);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (password !== password2) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/auth/reset-password/confirm/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          codigo: codigo.replace(/\D/g, ''),
          password_nuevo: password,
          password_nuevo2: password2,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const pwErr =
          typeof data.password_nuevo === 'string'
            ? data.password_nuevo
            : Array.isArray(data.password_nuevo) && typeof data.password_nuevo[0] === 'string'
              ? data.password_nuevo[0]
              : undefined;
        setError(
          typeof data.error === 'string' ? data.error : pwErr ?? 'No se pudo actualizar la contraseña.'
        );
        setLoading(false);
        return;
      }
      setInfo(typeof data.mensaje === 'string' ? data.mensaje : 'Listo. Ya puedes iniciar sesión.');
      setTimeout(() => router.replace('/login'), 1500);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.particles} aria-hidden>
          {[
            { w: 10, h: 10, top: '12%', left: '15%', dur: '7s', delay: '0s' },
            { w: 6, h: 6, top: '25%', left: '75%', dur: '9s', delay: '1.5s' },
            { w: 14, h: 14, top: '65%', left: '18%', dur: '8s', delay: '0.8s' },
          ].map(({ w, h, top, left, dur, delay }, i) => (
            <div
              key={i}
              className={styles.particle}
              style={{
                width: w,
                height: h,
                top,
                left,
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
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.card}>
          <div className={styles.mobileHeader}>
            <div className={styles.mobileLogoRow}>
              <div className={styles.mobileLogoIcon}>
                <KeyRound size={16} strokeWidth={2.5} />
              </div>
              <span className={styles.mobileBrandName}>{brandName}</span>
            </div>
          </div>

          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Recuperar contraseña</h1>
            <p className={styles.cardSubtitle}>
              {step === 1 && 'Te enviaremos un código al correo'}
              {step === 2 && 'Introduce el código que llegó al correo'}
              {step === 3 && 'Elige una contraseña nueva'}
            </p>
          </div>

          {error ? (
            <div className={styles.errorBanner} role="alert">
              <Lock size={15} />
              <span>{error}</span>
            </div>
          ) : null}
          {step === 1 && emailRequested && !error ? (
            <div className={styles.infoBanner} role="status">
              <Info className={styles.infoBannerIcon} size={20} strokeWidth={2} aria-hidden />
              <div className={styles.infoBannerBody}>
                <span className={styles.infoBannerTitle}>Revisá tu correo</span>
                <p className={styles.infoBannerText}>
                  Si esa cuenta está registrada, te enviamos un código de un solo uso. Puede tardar unos
                  segundos en llegar.
                </p>
                <p className={styles.infoBannerHint}>
                  En desarrollo los correos no salen a internet: abrí{' '}
                  <a
                    className={styles.infoBannerLink}
                    href="http://localhost:8025"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    MailHog (localhost:8025)
                  </a>{' '}
                  y buscá el mensaje con el código.
                </p>
              </div>
            </div>
          ) : null}
          {info && !error && !(step === 1 && emailRequested) ? (
            <div
              className={step === 3 ? `${styles.infoBanner} ${styles.infoBannerSuccess}` : styles.infoBanner}
              role="status"
            >
              <CircleCheck className={styles.infoBannerIcon} size={20} strokeWidth={2} aria-hidden />
              <div className={styles.infoBannerBody}>
                <p className={styles.infoBannerText}>{info}</p>
              </div>
            </div>
          ) : null}
          {info && !error && step === 1 && emailRequested ? (
            <div className={`${styles.infoBanner} ${styles.infoBannerSuccess}`} role="status" style={{ marginTop: 'var(--space-3)' }}>
              <CircleCheck className={styles.infoBannerIcon} size={20} strokeWidth={2} aria-hidden />
              <div className={styles.infoBannerBody}>
                <p className={styles.infoBannerText}>{info}</p>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <form className={styles.form} onSubmit={submitEmail} noValidate>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="fp-email">
                  Correo electrónico
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <Mail size={16} />
                  </span>
                  <input
                    id="fp-email"
                    type="email"
                    autoComplete="email"
                    placeholder="correo@dominio.com"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={formLocked || emailRequested}
                  />
                </div>
              </div>
              {!emailRequested ? (
                <button type="submit" className={styles.submitBtn} disabled={formLocked}>
                  {loading ? (
                    <>
                      <span className={styles.spinner} />
                      Enviando…
                    </>
                  ) : (
                    'Enviar código'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.submitBtn}
                  disabled={formLocked}
                  onClick={() => {
                    setError('');
                    setInfo('');
                    setStep(2);
                  }}
                >
                  Tengo el código — continuar
                </button>
              )}
              {emailRequested ? (
                <>
                  <button
                    type="button"
                    className={styles.backLink}
                    style={{
                      marginTop: '0.75rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                    onClick={async () => {
                      setError('');
                      setLoading(true);
                      try {
                        await fetch(apiUrl('/auth/reset-password/'), {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: email.trim() }),
                        });
                        setInfo('Si el correo existe, se envió un código nuevo (el anterior deja de valer).');
                      } catch {
                        setError('No se pudo conectar con el servidor.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={formLocked}
                  >
                    Reenviar código al mismo correo
                  </button>
                  <button
                    type="button"
                    className={styles.backLink}
                    style={{
                      marginTop: '0.25rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                    onClick={() => {
                      setEmailRequested(false);
                      setInfo('');
                      setError('');
                    }}
                    disabled={formLocked}
                  >
                    Usar otro correo
                  </button>
                </>
              ) : null}
            </form>
          ) : null}

          {step === 2 ? (
            <form className={styles.form} onSubmit={submitVerifyCode} noValidate>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="fp-code">
                  Código del correo
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <KeyRound size={16} />
                  </span>
                  <input
                    id="fp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className={styles.input}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    disabled={formLocked}
                  />
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={formLocked}>
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Verificando…
                  </>
                ) : (
                  'Verificar código'
                )}
              </button>
              <button
                type="button"
                className={styles.backLink}
                style={{ marginTop: '1rem', border: 'none', background: 'none', cursor: 'pointer', width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setStep(1);
                  setEmailRequested(false);
                  setCodigo('');
                  setError('');
                  setInfo('');
                }}
                disabled={formLocked}
              >
                Volver y pedir otro correo
              </button>
            </form>
          ) : null}

          {step === 3 ? (
            <form className={styles.form} onSubmit={submitNewPassword} noValidate>
              <div className={styles.formGroup}>
                <p className={styles.infoMessage}>
                  Usa al menos 8 caracteres con una mayúscula, una minúscula y un número. Solo letras y números.
                </p>
                <label className={styles.label} htmlFor="fp-pw1">
                  Nueva contraseña
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <Lock size={16} />
                  </span>
                  <input
                    id="fp-pw1"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={formLocked}
                  />
                  <button
                    type="button"
                    className={styles.togglePwd}
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="fp-pw2">
                  Repetir contraseña
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <Lock size={16} />
                  </span>
                  <input
                    id="fp-pw2"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={styles.input}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    disabled={formLocked}
                  />
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={formLocked}>
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Guardando…
                  </>
                ) : (
                  'Guardar contraseña'
                )}
              </button>
            </form>
          ) : null}

          <div className={styles.cardFooter}>
            <Link href="/login" className={styles.backLink}>
              <ChevronLeft size={15} />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
