'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContext = createContext<{ addToast: (message: string, type?: 'success' | 'error' | 'info') => void }>({
  addToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const colors = {
    success: 'bg-[#81C784] text-black font-medium',
    error: 'bg-destructive/90 text-black font-medium',
    info: 'bg-popover text-foreground border border-border',
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-xs">
        {toasts.map((t, i) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl text-sm shadow-xl backdrop-blur-sm ${colors[t.type]}`}
            style={{
              animation: `toastIn 0.3s ease-out`,
              opacity: i < toasts.length - 1 ? 0.6 : 1,
              transform: `scale(${1 - i * 0.03}) translateY(${i * 4}px)`,
              zIndex: 50 - i,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
