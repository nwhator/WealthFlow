import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan } from '@/lib/subscription'
import PremiumPaywall from '@/components/PremiumPaywall'
import Link from 'next/link'
import DataFreshnessIndicator from '@/components/DataFreshnessIndicator'
import ScanButton from '@/components/ScanButton'

type Prediction = {
  id: string
  match: string
  sport: string
  prediction: string
  line: number | null
  odds: number
  confidence: number
  reason: string
  edge: number
  market_average: number
  market_margin: number
  market: string
  volatility: string
  liquidity: string
  unit_return: number
  commence_time: string
  bookmaker: string
}

const FREE_LIMIT = 2

const confidenceTier = (c: number) => {
  if (c >= 70) return {
    ring: 'ring-primary/25',
    bg: 'bg-gradient-to-br from-primary/5 via-surface-container-low to-surface-container-low',
    badge: 'bg-primary text-on-primary',
    dot: 'bg-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.6)]',
    label: 'Gold Pick',
    labelClass: 'text-primary bg-primary/10 border-primary/25',
  }
  if (c >= 50) return {
    ring: 'ring-yellow-500/25',
    bg: 'bg-gradient-to-br from-yellow-500/5 via-surface-container-low to-surface-container-low',
    badge: 'bg-yellow-400 text-zinc-900',
    dot: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]',
    label: 'Standard',
    labelClass: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
  }
  return {
    ring: 'ring-outline-variant/20',
    bg: 'bg-surface-container-low',
    badge: 'bg-surface-container-highest text-on-surface-variant',
    dot: 'bg-zinc-500',
    label: 'Developing',
    labelClass: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/25',
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const marketLabel = (key: string) =>
  key === 'totals' ? 'Over / Under' : key === 'spreads' ? 'Handicap' : 'Match Result'

export default async function PredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const plan = await getUserPlan(user.id)
  const isPremium = plan === 'premium'

  const { data: predictions } = await supabase
    .from('predictions_cache')
    .select('*')

  const allPredictions: Prediction[] = (predictions || [])
    .sort((a, b) => {
      const dateA = new Date(a.commence_time).getTime()
      const dateB = new Date(b.commence_time).getTime()
      if (dateA !== dateB) return dateA - dateB
      return b.odds - a.odds
    })

  const visiblePredictions = isPremium ? allPredictions : allPredictions.slice(0, FREE_LIMIT)
  const lockedCount = allPredictions.length - FREE_LIMIT

  const goldCount = allPredictions.filter(p => p.confidence >= 70).length
  const avgEdge = allPredictions.length
    ? (allPredictions.reduce((s, p) => s + (p.edge || 0), 0) / allPredictions.length).toFixed(1)
    : '0.0'

  return (
    <main className="pt-24 pb-32 px-4 sm:px-6 max-w-screen-xl mx-auto min-h-screen">

      {/* ── Hero Header ───────────────────────────────────── */}
      <section className="pt-8 mb-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Algorithmic Intelligence
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-on-surface tracking-tight leading-[1.05] mb-4">
              Investment<br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Picks</span>
            </h1>
            <p className="text-on-surface-variant leading-relaxed text-base max-w-lg">
              Value opportunities surfaced by our multi-market statistical engine. Data updates automatically every 24 hours to conserve API credits.
              <ScanButton />
            </p>
          </div>

          {/* KPIs */}
          <div className="flex gap-4 flex-wrap lg:flex-nowrap shrink-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-surface-container-low border border-primary/20 px-6 py-5 rounded-2xl min-w-[140px]">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full" />
              <p className="text-[8px] uppercase tracking-widest text-primary font-black mb-1">Gold Picks</p>
              <p className="text-3xl font-black text-primary">{goldCount}</p>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/10 px-6 py-5 rounded-2xl min-w-[140px]">
              <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-black mb-1">Avg Edge</p>
              <p className="text-3xl font-black text-on-surface">+{avgEdge}%</p>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/10 px-6 py-5 rounded-2xl min-w-[140px]">
              <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-black mb-1">Total Picks</p>
              <p className="text-3xl font-black text-on-surface">{allPredictions.length}</p>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-5 bg-surface-container-high/40 rounded-2xl border border-outline-variant/10">
          <div className="flex items-center gap-5 flex-wrap">
            <span className="flex items-center gap-2 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              Engine Active
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-on-surface-variant/70 font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />Gold ≥ 70% Conf.
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-on-surface-variant/70 font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />Standard ≥ 50%
            </span>
          </div>
          <DataFreshnessIndicator />
        </div>
      </section>

      {/* ── Upgrade CTA (free) ────────────────────────────── */}
      {!isPremium && (
        <div className="flex items-center justify-between gap-4 mb-8 py-3.5 px-5 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl">
          <p className="text-sm font-bold text-on-surface-variant">
            Viewing <span className="text-primary font-black">{FREE_LIMIT}</span> of{' '}
            <span className="text-primary font-black">{allPredictions.length}</span> picks
          </p>
          <Link href="/pricing" className="px-5 py-2 bg-primary text-on-primary rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 shrink-0">
            Unlock All →
          </Link>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────── */}
      {allPredictions.length === 0 ? (
        <div className="text-center py-24 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/20">
          <span className="material-symbols-outlined text-7xl text-on-surface-variant mb-4 opacity-30 block">analytics</span>
          <p className="text-on-surface-variant font-bold text-lg">No picks available yet.</p>
          <p className="text-on-surface-variant/60 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
            The prediction engine runs automatically every 24 hours. Check back after the next scheduled data refresh shown above, or run a manual scan.
          </p>
          <div className="mt-4"><ScanButton /></div>
          <p className="text-on-surface-variant/40 text-xs mt-4 font-bold uppercase tracking-widest">Engine data auto-updates • No action required</p>
        </div>
      ) : (
        <>
          {/* ── Grid ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
            {visiblePredictions.map((p) => {
              const tier = confidenceTier(p.confidence)
              return (
                <Link
                  key={p.id}
                  href={`/predictions/${p.id}`}
                  className={`group relative rounded-2xl ring-1 ${tier.ring} ${tier.bg} p-5 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-primary/5 overflow-hidden cursor-pointer`}
                >
                  {/* Decorative top accent */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                  {/* Header */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border ${tier.labelClass}`}>
                          {tier.label}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface-variant font-black uppercase tracking-widest border border-outline-variant/10">
                          {marketLabel(p.market)}
                        </span>
                      </div>
                      <h3 className="font-bold text-on-surface leading-snug text-sm truncate">{p.match}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tier.dot}`} />
                        <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest truncate">{p.sport}</span>
                        <span className="text-[9px] text-zinc-500 font-mono">{formatDate(p.commence_time)}</span>
                      </div>
                    </div>
                    <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${tier.badge}`}>
                      {p.confidence}%
                    </div>
                  </div>

                  {/* Prediction box */}
                  <div className="bg-surface-container-highest/60 rounded-xl p-4 border border-outline-variant/10">
                    <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Engine Verdict</p>
                    <p className="font-black text-on-surface text-2xl tracking-tight leading-none">{p.prediction}</p>
                    {p.line !== null && p.market !== 'h2h' && (
                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
                        Line: <span className="text-primary font-black">{p.market === 'totals' ? `${Math.abs(p.line)} Goals/Pts` : `${p.line > 0 ? '+' : ''}${p.line}`}</span>
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-on-surface-variant font-mono">
                        Odds: <span className="text-primary font-black text-sm">{p.odds.toFixed(2)}</span>
                      </span>
                      <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{p.bookmaker}</span>
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Edge', value: `+${(p.edge || 0).toFixed(1)}%`, highlight: true },
                      { label: 'Mkt Price', value: (p.market_average || 0).toFixed(2), highlight: false },
                      { label: 'Win Target', value: `₦${Math.round(p.unit_return || 0)}`, highlight: true },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className="bg-surface-container-highest/40 rounded-xl p-2.5 text-center border border-outline-variant/5">
                        <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-black mb-1">{label}</p>
                        <p className={`text-xs font-black ${highlight ? 'text-primary' : 'text-on-surface'}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${p.volatility === 'Active' ? 'text-red-400 border-red-400/20 bg-red-400/5' : p.volatility === 'Normal' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5' : 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'}`}>
                      ⚡ {p.volatility || 'Stable'}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border border-outline-variant/10 text-on-surface-variant">
                      Vol: {p.liquidity || 'Professional'}
                    </span>
                    <span className="ml-auto text-[9px] text-zinc-600 font-bold">
                      Fee: {(p.market_margin || 0).toFixed(1)}%
                    </span>
                  </div>

                  {/* Reason */}
                  <div className="p-3 rounded-xl bg-surface-container-highest/30 border border-outline-variant/5">
                    <p className="text-[10px] leading-relaxed text-on-surface-variant italic">{p.reason}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[9px] text-zinc-600 font-black uppercase tracking-[0.15em] pt-1 border-t border-outline-variant/10">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      WealthFlow Engine
                    </span>
                    {(p.edge || 0) > 4 && (
                      <span className="text-emerald-400 flex items-center gap-1">★ Gold Value</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* ── Paywall overlay ───────────────────────────── */}
          {!isPremium && lockedCount > 0 && (
            <div className="relative mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 blur-sm pointer-events-none select-none" aria-hidden>
                {allPredictions.slice(FREE_LIMIT, FREE_LIMIT + 3).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low h-48" />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <PremiumPaywall
                  title={`${lockedCount} More Predictions Locked`}
                  message="Upgrade to WealthFlow Pro to access all predictions with full confidence scores and reasoning."
                />
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}
