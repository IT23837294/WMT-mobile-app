import React from 'react';

const BrandLogo = ({ compact = false, theme = 'light', className = '' }) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subtextColor = isDark ? 'text-teal-100/80' : 'text-slate-500';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={compact ? '40' : '48'}
        height={compact ? '40' : '48'}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="pharmacareLogoBg" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F766E" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="pharmacareLogoCapsule" x1="22" y1="18" x2="43" y2="41" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E0F2FE" />
            <stop offset="1" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>

        <rect x="6" y="6" width="52" height="52" rx="18" fill="url(#pharmacareLogoBg)" />
        <path d="M17 32C17 23.716 23.716 17 32 17C40.284 17 47 23.716 47 32C47 40.284 40.284 47 32 47C23.716 47 17 40.284 17 32Z" fill="white" fillOpacity="0.14" />
        <path d="M39.778 19.561C43.846 20.684 47 24.772 47 29.503C47 34.857 42.971 39.315 37.741 39.91L36.594 41.922C35.926 43.094 34.68 43.818 33.33 43.818H30.67C29.32 43.818 28.074 43.094 27.406 41.922L26.259 39.91C21.029 39.315 17 34.857 17 29.503C17 24.772 20.154 20.684 24.222 19.561C25.684 19.157 26.986 20.564 26.467 21.988L24.629 27.037C24.324 27.875 24.749 28.795 25.582 29.114L30.209 30.887C31.358 31.328 32.642 31.328 33.791 30.887L38.418 29.114C39.251 28.795 39.676 27.875 39.371 27.037L37.533 21.988C37.014 20.564 38.316 19.157 39.778 19.561Z" fill="url(#pharmacareLogoCapsule)" />
        <path d="M31.999 23V35" stroke="#0F766E" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M26 29H38" stroke="#0F766E" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M42.5 16.5C45.1 16.9 47.2 18.9 47.8 21.5" stroke="#A7F3D0" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <div className="leading-none">
        <div className={`font-bold tracking-tight ${compact ? 'text-lg' : 'text-xl'} ${textColor}`}>
          PharmaCare
        </div>
        {!compact && (
          <div className={`mt-1 text-xs font-medium uppercase tracking-[0.22em] ${subtextColor}`}>
            Digital Pharmacy
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
