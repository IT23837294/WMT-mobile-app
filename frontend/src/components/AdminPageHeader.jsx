import React from 'react';
import BrandLogo from './BrandLogo';

const headerVariants = {
  default: {
    shell: 'border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]',
    hero: 'bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.22),_transparent_32%),linear-gradient(135deg,#f8fafc_0%,#ecfeff_45%,#f0fdfa_100%)]',
    orbOne: 'bg-cyan-200/30',
    orbTwo: 'bg-emerald-200/30',
    eyebrow: 'border-teal-200 bg-white/80 text-teal-700',
  },
  medicine: {
    shell: 'border-rose-100 bg-white shadow-[0_24px_70px_rgba(122,28,65,0.10)]',
    hero: 'bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.20),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.16),_transparent_26%),linear-gradient(135deg,#fff7ed_0%,#fffaf5_40%,#fef2f2_100%)]',
    orbOne: 'bg-amber-200/40',
    orbTwo: 'bg-rose-200/35',
    eyebrow: 'border-amber-200 bg-white/90 text-amber-700',
  },
};

const AdminPageHeader = ({
  title,
  subtitle,
  eyebrow = 'PharmaCare Admin',
  icon: Icon,
  action = null,
  stats = [],
  variant = 'default',
  brandSlot = null,
}) => {
  const selectedVariant = headerVariants[variant] || headerVariants.default;

  return (
    <div className={`mb-8 overflow-hidden rounded-[2rem] border ${selectedVariant.shell}`}>
      <div className={`relative overflow-hidden px-6 py-7 sm:px-8 ${selectedVariant.hero}`}>
        <div className={`absolute -right-10 top-0 h-28 w-28 rounded-full blur-2xl ${selectedVariant.orbOne}`} />
        <div className={`absolute bottom-0 left-1/3 h-24 w-24 rounded-full blur-2xl ${selectedVariant.orbTwo}`} />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4">
              {brandSlot || <BrandLogo compact className="mb-3" />}
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${selectedVariant.eyebrow}`}>
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {eyebrow}
              </div>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
            {subtitle ? (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{subtitle}</p>
            ) : null}
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {stats.length > 0 ? (
          <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 backdrop-blur-sm"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {stat.label}
                </div>
                <div className="mt-2 text-xl font-extrabold text-slate-900">{stat.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminPageHeader;
