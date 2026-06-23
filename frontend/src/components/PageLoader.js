// Loader a pantalla de sección. Se muestra al navegar (vía loading.js)
// para que la app se sienta fluida.
export default function PageLoader({ label = 'Cargando…' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="spinner spinner--lg" aria-hidden="true" />
      <span className="page-loader__label">{label}</span>
    </div>
  );
}
