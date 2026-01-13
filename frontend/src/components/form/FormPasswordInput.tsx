// ============================================
// FORM PASSWORD INPUT - PASSWORD WITH TOGGLE
// ============================================

import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormPasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showIcon?: boolean;
  error?: string;
  hint?: string;
  forgotPasswordLink?: string;
}

export const FormPasswordInput = forwardRef<HTMLInputElement, FormPasswordInputProps>(
  ({ label, showIcon = true, error, hint, forgotPasswordLink, className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-2 group">
        {label && (
          <div className="flex justify-between items-center">
            <Label
              htmlFor={id}
              className="text-slate-700 font-bold group-focus-within:text-orange-600 transition-colors ml-1"
            >
              {label}
            </Label>
            {forgotPasswordLink && (
              <a
                href={forgotPasswordLink}
                className="text-sm text-orange-600 hover:text-orange-700 font-bold hover:underline"
              >
                Forgot?
              </a>
            )}
          </div>
        )}
        <div className="relative">
          {showIcon && (
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors w-5 h-5" />
          )}
          <Input
            ref={ref}
            id={id}
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
              'focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10',
              'rounded-xl h-12 transition-all duration-300 font-medium pr-10',
              showIcon && 'pl-10',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500/10',
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
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

FormPasswordInput.displayName = 'FormPasswordInput';

export default FormPasswordInput;
