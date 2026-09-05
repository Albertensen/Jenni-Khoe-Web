'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, type = 'text', className = '', ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue = props.value !== undefined && props.value !== '';

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={type}
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          className={`peer w-full border-b bg-transparent px-1 py-3 text-luxury-deep-slate outline-none transition-all duration-300 placeholder-transparent focus:border-luxury-rose-gold ${
            className
          }`}
          placeholder={label}
        />
        <label
          className={`absolute left-1 top-3 cursor-text font-sans text-sm transition-all duration-300 ${
            focused || hasValue
              ? '-translate-y-6 text-xs text-luxury-rose-gold'
              : 'text-luxury-deep-slate/40'
          }`}
        >
          {label}
        </label>
      </div>
    );
  }
);

FloatingLabelInput.displayName = 'FloatingLabelInput';

export default FloatingLabelInput;