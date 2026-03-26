'use client'

import Link from 'next/link'

interface PremiumPaywallProps {
  title?: string
  message?: string
}

export default function PremiumPaywall({
  title = 'Premium Feature',
  message = 'Upgrade to WealthFlow Pro to unlock full access to predictions, arbitrage opportunities, and advanced insights.',
}: PremiumPaywallProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-surface-container-low border border-primary/20 p-10 text-center">
      {/* Blurred background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-3xl">lock</span>
        </div>
        <div>
          <h2 className="text-2xl font-black text-on-surface tracking-tight mb-2">{title}</h2>
          <p className="text-on-surface-variant text-sm max-w-xs mx-auto leading-relaxed">{message}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/pricing"
            className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-sm uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            Upgrade to Pro — $25/mo
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-3 bg-surface-container-high text-on-surface-variant rounded-full font-bold text-sm uppercase tracking-widest hover:bg-surface-container-highest active:scale-95 transition-all"
          >
            View Plans
          </Link>
        </div>
        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold opacity-60">
          Annual plan available — $250/year (save $50)
        </p>
      </div>
    </div>
  )
}
