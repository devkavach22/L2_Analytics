// ============================================
// FORM SEARCH INPUT - SEARCH WITH ICON
// ============================================

import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FormSearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
}

export const FormSearchInput = forwardRef<HTMLInputElement, FormSearchInputProps>(
  ({ value, onChange, onClear, showClearButton = true, className, placeholder = 'Search...', ...props }, ref) => {
    const handleClear = () => {
      onChange('');
      onClear?.();
    };

    return (
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors w-5 h-5" />
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
            'focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10',
            'rounded-xl h-11 pl-10 transition-all duration-300 font-medium',
            showClearButton && value && 'pr-10',
            className
          )}
          {...props}
        />
        {showClearButton && value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }
);

FormSearchInput.displayName = 'FormSearchInput';

export default FormSearchInput;
