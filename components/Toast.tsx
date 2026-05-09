'use client';

import { useState, useEffect, createContext, useContext } from 'react';

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' };

const ToastContext = createContext<{
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg animate-bounce
              ${t.type === 'success' ? 'bg-green-500 text-white' : t.type === 'error' ? 'bg-crimson text-white' : 'bg-gold text-void'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
