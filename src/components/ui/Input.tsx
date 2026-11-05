import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-semibold text-[#443530] mb-1.5"
          >
            {label}
            {props.required && <span className="text-[#D7A49A] ml-1">*</span>}
          </label>
        )}

        <div className="relative rounded-xl">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A6963]">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full rounded-xl border bg-white/90 px-3.5 py-2.5 sm:py-3 text-sm text-[#2C211E] placeholder:text-[#9F8F89] transition-all duration-200 outline-none
              ${leftIcon ? 'pl-10 sm:pl-11' : ''}
              ${rightIcon ? 'pr-10 sm:pr-11' : ''}
              ${
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/20'
                  : 'border-[#EBDAD2] hover:border-[#D7A49A]/60 focus:border-[#D7A49A] focus:ring-3 focus:ring-[#D7A49A]/20 focus:bg-white'
              }
              ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#7A6963]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
