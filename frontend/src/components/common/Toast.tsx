// ============================================
// TOAST - NOTIFICATION COMPONENT
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  onClose?: () => void;
}

const toastVariant = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
  },
  exit: { opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } },
};

const iconMap = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
};

const colorMap = {
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
};

export const Toast = ({ message, type, onClose }: ToastProps) => {
  const Icon = iconMap[type];

  return (
    <motion.div
      variants={toastVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg',
        colorMap[type]
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
};

// Toast Container for multiple toasts
interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: 'info' | 'success' | 'error' | 'warning' }>;
  onRemove: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
