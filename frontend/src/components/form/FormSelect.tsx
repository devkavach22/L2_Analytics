// ============================================
// FORM SELECT - REUSABLE SELECT INPUT
// ============================================

import { forwardRef } from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, icon: Icon, error, hint, options, placeholder, onChange, className, id, value, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value);
    };

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
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors w-5 h-5 pointer-events-none" />
          )}
          <select
            ref={ref}
            id={id}
            value={value}
            onChange={handleChange}
            className={cn(
              'flex h-12 w-full rounded-xl border bg-white px-3 py-2 text-base font-medium',
              'border-slate-200 text-slate-900',
              'focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none',
              'transition-all duration-300 appearance-none cursor-pointer',
              Icon && 'pl-10',
              'pr-10',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500/10',
              !value && 'text-slate-400',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
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

FormSelect.displayName = 'FormSelect';

export default FormSelect;
