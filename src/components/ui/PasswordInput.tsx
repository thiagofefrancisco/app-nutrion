import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { Input, type InputProps } from './Input';

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'leftIcon' | 'rightIcon'> {
  showStrengthMeter?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrengthMeter = false, value, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const pwdValue = typeof value === 'string' ? value : '';

    const hasMinLength = pwdValue.length >= 9;
    const hasLetters = /[a-zA-Z]/.test(pwdValue);
    const hasNumbers = /[0-9]/.test(pwdValue);

    // Calculate basic strength score (0 to 3)
    let score = 0;
    if (pwdValue.length >= 6) score++;
    if (hasMinLength) score++;
    if (hasMinLength && (hasLetters && hasNumbers)) score++;

    return (
      <div className="w-full">
        <Input
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          leftIcon={<Lock className="w-4 h-4 text-[#7A6963]" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 rounded-lg text-[#7A6963] hover:text-[#2C211E] hover:bg-[#FFF1E4] transition-colors cursor-pointer"
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />

        {showStrengthMeter && pwdValue.length > 0 && (
          <div className="mt-2 space-y-1.5 animate-slide-up">
            {/* Visual Strength Bar */}
            <div className="flex gap-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  score === 1
                    ? 'w-1/3 bg-amber-400'
                    : score === 2
                    ? 'w-2/3 bg-amber-500'
                    : score === 3
                    ? 'w-full bg-emerald-500'
                    : 'w-0'
                }`}
              />
            </div>

            {/* Checklist items */}
            <div className="flex items-center justify-between text-[11px] text-[#7A6963] px-1">
              <span
                className={`inline-flex items-center gap-1 font-medium transition-colors ${
                  hasMinLength ? 'text-emerald-600' : 'text-[#7A6963]'
                }`}
              >
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                ) : (
                  <X className="w-3.5 h-3.5 text-amber-500" />
                )}
                Mínimo de 9 caracteres ({pwdValue.length}/9)
              </span>

              <span className="text-[11px] font-semibold text-[#7A6963]">
                {score === 3 ? (
                  <span className="text-emerald-600">Senha forte</span>
                ) : score === 2 ? (
                  <span className="text-amber-600">Senha aceitável</span>
                ) : (
                  <span className="text-red-500">Muito curta</span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
