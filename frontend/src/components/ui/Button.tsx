'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary:
    'bg-luxury-rose-gold/10 backdrop-blur-xl border border-luxury-rose-gold/30 text-luxury-rose-gold-dark hover:bg-luxury-rose-gold/20 hover:border-luxury-rose-gold/50',
  secondary:
    'bg-white/10 backdrop-blur-xl border border-white/20 text-luxury-deep-slate hover:bg-white/20',
  ghost:
    'bg-transparent border border-transparent text-luxury-deep-slate/60 hover:text-luxury-deep-slate hover:bg-luxury-warm-nude/20',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-full font-sans font-medium transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;