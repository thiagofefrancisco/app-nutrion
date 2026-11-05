import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-14 h-14 text-xl',
  };

  const titleSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div className="flex items-center gap-3">
        {/* Modern Icon Badge */}
        <div
          className={`${iconSizes[size]} relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#D7A49A] to-[#B97F74] text-white shadow-md shadow-[#D7A49A]/30 transition-transform duration-300 hover:scale-105`}
        >
          {/* Stylized leaf/nutrition mark */}
          <svg
            className="w-3/5 h-3/5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 20A7 7 0 0 1 4 13C4 7 11 3 11 3s7 4 7 10a7 7 0 0 1-7 7Z" />
            <path d="M11 9v11" />
            <path d="M15 13c-1.5-1-2.5-1-4-1" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FFF1E4] border-2 border-[#D7A49A]" />
        </div>

        {/* Brand Text */}
        <div className="text-left">
          <span
            className={`${titleSizes[size]} font-extrabold tracking-tight text-[#2C211E] font-['Outfit']`}
          >
            Nutri<span className="text-[#D7A49A]">On</span>
          </span>
        </div>
      </div>

      {showSubtitle && (
        <p className="mt-1.5 text-xs sm:text-sm font-medium text-[#7A6963] tracking-wide">
          Gestão Clínica & Nutrição Inteligente
        </p>
      )}
    </div>
  );
};
