// ============================================
// FORM ALERT - ERROR/SUCCESS MESSAGES
// ============================================

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertType = 'error' | 'success' | 'warning' | 'info';

interface FormAlertProps {
  type: AlertType;
  message: string;
  className?: string;
}

const alertStyles: Record<AlertType, { bg: string; border: string; text: string; icon: typeof AlertTriangle }> = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-600',
    icon: XCircle,
  },
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    icon: CheckCircle2,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
    icon: Info,
  },
};

export const FormAlert = ({ type, message, className }: FormAlertProps) => {
  const styles = alertStyles[type];
  const Icon = styles.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'p-3 text-sm rounded-xl border flex items-center gap-2 font-bold',
        styles.bg,
        styles.border,
        styles.text,
        className
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {message}
    </motion.div>
  );
};

export default FormAlert;
