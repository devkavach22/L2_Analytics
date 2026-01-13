// ============================================
// FORM BUTTON - REUSABLE SUBMIT BUTTON
// ============================================

import { forwardRef } from 'react';
import { Loader2, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/30',
  secondary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20',
  outline: 'bg-white border-2 border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-600',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30',
};

const sizeStyles = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-12 px-6 text-base',
  lg: 'h-14 px-8 text-lg',
};

export const FormButton = forwardRef<HTMLButtonElement, FormButtonProps>(
  (
    {
      children,
      isLoading,
      loadingText,
      icon: Icon,
      iconPosition = 'right',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
          'flex items-center justify-center gap-2',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {loadingText && <span>{loadingText}</span>}
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon size={18} />}
            {children}
            {Icon && iconPosition === 'right' && <Icon size={18} />}
          </>
        )}
      </Button>
    );
  }
);

FormButton.displayName = 'FormButton';

export default FormButton;
