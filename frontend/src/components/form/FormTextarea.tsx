// ============================================
// FORM TEXTAREA - REUSABLE TEXTAREA
// ============================================

import { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, icon: Icon, error, hint, className, id, ...props }, ref) => {
    return (
      <div className="space-y-2 group">
        {label && (
          <Label
            htmlFor={id}
            className="text-slate-700 font-bold group-focus-within:text-orange-600 transition-colors ml-1"
          >
            {label}
          </Label>
        )}
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-3 text-slate-400 group-focus-within:text-orange-500 transition-colors w-5 h-5" />
          )}
          <Textarea
            ref={ref}
            id={id}
            className={cn(
              'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
              'focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10',
              'rounded-xl transition-all duration-300 font-medium min-h-[120px]',
              Icon && 'pl-10',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500/10',
              className
            )}
            {...props}
          />
        </div>
        {hint && !error && (
          <p className="text-xs text-slate-400 ml-1">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-500 font-medium ml-1">{error}</p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

export default FormTextarea;
