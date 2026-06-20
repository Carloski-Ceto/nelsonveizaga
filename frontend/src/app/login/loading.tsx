/** Mientras Next compila la ruta (sobre todo en Docker + volumen Windows, puede tardar). */
export default function LoginLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#0f0f14',
        color: '#e8e8ef',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '0.95rem',
      }}
    >
      <p style={{ opacity: 0.85 }}>Cargando…</p>
    </div>
  );
}
