import React from 'react';
import Link from 'next/link';

interface LogoProps {
  variant?: 'horizontal' | 'icon' | 'dark';
  className?: string;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  className = '',
  showTagline = true,
}) => {
  const isDark = variant === 'dark';

  if (variant === 'icon') {
    return (
      <Link href="/" className={`inline-flex items-center ${className}`} aria-label="BuildLink Home">
        <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="64" rx="14" fill="#0B1F3A" />
          <path d="M16 46V28L26 18V46H16Z" fill="#1769AA" />
          <path d="M48 46V28L38 18V46H48Z" fill="#1769AA" />
          <path
            d="M22 28C22 24.6863 24.6863 22 28 22H36C39.3137 22 42 24.6863 42 28V34C42 37.3137 39.3137 40 36 40H28C24.6863 40 22 37.3137 22 34V28Z"
            stroke="#FF8A00"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="31" r="3.5" fill="#FFFFFF" />
        </svg>
      </Link>
    );
  }

  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`} aria-label="BuildLink Home">
      {/* Structural Logo Mark */}
      <svg width="42" height="42" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="14" fill={isDark ? '#1769AA' : '#0B1F3A'} />
        <path d="M16 46V28L26 18V46H16Z" fill={isDark ? '#0B1F3A' : '#1769AA'} />
        <path d="M48 46V28L38 18V46H48Z" fill={isDark ? '#0B1F3A' : '#1769AA'} />
        <path
          d="M22 28C22 24.6863 24.6863 22 28 22H36C39.3137 22 42 24.6863 42 28V34C42 37.3137 39.3137 40 36 40H28C24.6863 40 22 37.3137 22 34V28Z"
          stroke="#FF8A00"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="31" r="3.5" fill="#FFFFFF" />
      </svg>

      <div className="flex flex-col">
        <div className="flex items-center text-2xl font-extrabold tracking-tight">
          <span className={isDark ? 'text-white' : 'text-brand-navy'}>Build</span>
          <span className="text-brand-orange">Link</span>
        </div>
        {showTagline && (
          <span
            className={`text-[9px] font-bold tracking-widest uppercase ${
              isDark ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Connect. Build. Grow.
          </span>
        )}
      </div>
    </Link>
  );
};
