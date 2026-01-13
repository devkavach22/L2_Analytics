// ============================================
// FORM OTP INPUT - OTP CODE INPUT
// ============================================

import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormOTPInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  length?: number;
  onChange?: (value: string) => void;
}

export const FormOTPInput = forwardRef<HTMLInputElement, FormOTPInputProps>(
  ({ label, error, length = 6, onChange, className, id, value, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow numbers
      const val = e.target.value.replace(/\D/g, '');
      onChange?.(val);
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
        <Input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          maxLength={length}
          value={value}
          onChange={handleChange}
          className={cn(
            'bg-slate-50/50 border-slate-200 text-slate-900',
            'text-center text-2xl tracking-[0.5em] font-bold',
            'focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10',
            'rounded-xl h-14 transition-all duration-300',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500/10',
            className
          )}
          placeholder="• • • • • •"
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500 font-medium ml-1">{error}</p>
        )}
      </div>
    );
  }
);

FormOTPInput.displayName = 'FormOTPInput';

export default FormOTPInput;
