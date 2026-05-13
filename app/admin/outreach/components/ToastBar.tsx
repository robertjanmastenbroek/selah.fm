'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Sparkles, X } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  detail?: string;
}

const colors: Record<Toast['type'], string> = {
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  error: 'bg-red-500/10 border-red-500/20 text-red-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

const icons: Record<Toast['type'], React.ReactNode> = {
  success: <Check size={14} />,
  error: <AlertCircle size={14} />,
  info: <Sparkles size={14} />,
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={`flex items-start gap-3 px-4 py-3 rounded-2xl border text-sm ${colors[toast.type]}`}
    >
      <span className="shrink-0 mt-0.5">{icons[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{toast.title}</p>
        {toast.detail && <p className="text-xs opacity-70 mt-0.5 whitespace-pre-wrap">{toast.detail}</p>}
      </div>
      <button onClick={onDismiss} className="shrink-0 p-0.5 rounded-md hover:bg-white/10 transition-colors">
        <X size={12} />
      </button>
    </motion.div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], title: string, detail?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, title, detail }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}

export function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => onDismiss(t.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
