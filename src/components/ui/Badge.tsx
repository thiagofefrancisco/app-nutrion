import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'neutral';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  children,
  className = '',
  dot = false,
}) => {
  const styles = {
    primary: 'bg-[#D7A49A]/20 text-[#935A50] border-[#D7A49A]/30',
    success: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const dotColors = {
    primary: 'bg-[#D7A49A]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    neutral: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-2 h-2 rounded-full animate-pulse ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
};
