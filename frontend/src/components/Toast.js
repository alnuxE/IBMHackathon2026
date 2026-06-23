'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastCtx = createContext(() => {});

// Hook para lanzar avisos: toast('Guardado', 'success' | 'error' | 'info')
export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback((mensaje, tipo = 'success') => {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random());
    setToasts((t) => [...t, { id, mensaje, tipo }]);
    setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tipo}`} role="status" onClick={() => dismiss(t.id)}>
            <span className="toast-dot" />
            <span>{t.mensaje}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
