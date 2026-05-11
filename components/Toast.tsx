'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Undo } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'undo';
  onUndo?: () => void;
}

interface ToastContextType {
  addToast: (message: string, type?: 'success' | 'error' | 'info', undo?: { label: string; action: () => void }) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', undo?: { label: string; action: () => void }) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type: undo ? 'undo' : type, onUndo: undo?.action }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const iconMap = {
    success: <Check size={14} />,
    error: <AlertTriangle size={14} />,
    info: null,
    undo: null,
  };

  const colorMap = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500/90 text-white',
    info: 'bg-white/[0.08] text-foreground border border-white/[0.1]',
    undo: 'bg-white/[0.08] text-foreground border border-white/[0.1]',
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col-reverse gap-2 max-w-xs pointer-events-none">
        <AnimatePresence>
          {toasts.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`pointer-events-auto px-4 py-3 rounded-xl text-sm shadow-xl backdrop-blur-xl flex items-center gap-2.5 ${colorMap[t.type]}`}
            >
              {iconMap[t.type] && <span className="shrink-0">{iconMap[t.type]}</span>}
              <span className="flex-1 leading-snug">{t.message}</span>
              {t.onUndo && (
                <button
                  onClick={() => { t.onUndo?.(); setToasts(prev => prev.filter(x => x.id !== t.id)); }}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-white/[0.1] hover:bg-white/[0.2] text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Undo size={12} /> Undo
                </button>
              )}
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full overflow-hidden opacity-20">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="h-full bg-white"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
