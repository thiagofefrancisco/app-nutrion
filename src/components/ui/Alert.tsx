import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertProps {
  variant?: 'error' | 'success' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'error',
  title,
  message,
  onClose,
  className = '',
}) => {
  const styles = {
    error: {
      container: 'bg-red-50/90 border-red-200 text-red-900',
      icon: <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />,
      titleColor: 'text-red-900',
      textColor: 'text-red-700',
    },
    success: {
      container: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-900',
      textColor: 'text-emerald-700',
    },
    info: {
      container: 'bg-[#FFF1E4] border-[#D7A49A]/40 text-[#2C211E]',
      icon: <Info className="w-5 h-5 text-[#D7A49A] shrink-0 mt-0.5" />,
      titleColor: 'text-[#2C211E]',
      textColor: 'text-[#7A6963]',
    },
  };

  const current = styles[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border text-sm animate-slide-up shadow-sm ${current.container} ${className}`}
    >
      {current.icon}
      <div className="flex-1 text-left">
        {title && <h4 className={`font-semibold mb-0.5 ${current.titleColor}`}>{title}</h4>}
        <p className={`text-xs sm:text-sm leading-relaxed ${current.textColor}`}>{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Fechar mensagem"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
