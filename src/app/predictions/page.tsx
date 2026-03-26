import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan } from '@/lib/subscription'
import PremiumPaywall from '@/components/PremiumPaywall'
import Link from 'next/link'
import RefreshButton from '@/components/RefreshButton'

type Prediction = {
  id: string
  match: string
  sport: string
  prediction: string
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

const confidenceColor = (confidence: number) => {
  if (confidence >= 70) return { ring: 'ring-primary/30 bg-primary/5', badge: 'bg-primary/15 text-primary', dot: 'bg-primary' }
  if (confidence >= 50) return { ring: 'ring-yellow-500/30 bg-yellow-500/5', badge: 'bg-yellow-500/15 text-yellow-400', dot: 'bg-yellow-400' }
  return { ring: 'ring-tertiary/30 bg-tertiary/5', badge: 'bg-tertiary/15 text-tertiary', dot: 'bg-tertiary' }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${mins}`
}

export default async function PredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const plan = await getUserPlan(user.id)
  const isPremium = plan === 'premium'

  const { data: predictions } = await supabase
    .from('predictions_cache')
    .select('*')

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const thirtyDaysFromNow = new Date(now)
  thirtyDaysFromNow.setDate(now.getDate() + 30)

  // SORT BY: Date (Asc), then Odds (Desc)
  const allPredictions: Prediction[] = (predictions || [])
    .filter(p => {
        const d = new Date(p.commence_time)
        return d >= startOfToday && d <= thirtyDaysFromNow
    })
    .sort((a, b) => {
        const dateA = new Date(a.commence_time).getTime()
        const dateB = new Date(b.commence_time).getTime()
        if (dateA !== dateB) return dateA - dateB
        return b.odds - a.odds
    })
  const visiblePredictions = isPremium ? allPredictions : allPredictions.slice(0, FREE_LIMIT)
  const lockedCount = allPredictions.length - FREE_LIMIT

  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <main className="pt-24 pb-32 px-6 max-w-screen-xl mx-auto">
      {/* Header & Performance Summary */}
      <section className="pt-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-primary mb-3 block font-black">Institutional Intelligence</span>
            <h1 className="text-5xl font-black text-on-surface tracking-tight leading-tight mb-3">Investment Picks</h1>
            <p className="text-on-surface-variant max-w-lg leading-relaxed text-sm">
              Daily value opportunities identified using algorithmic market analysis.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <RefreshButton />
              {!isPremium && (
                <Link href="/pricing" className="px-5 py-2 bg-primary text-on-primary rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  Unlock Professional Grade →
                </Link>
              )}
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="bg-surface-container-low px-5 py-4 rounded-2xl border border-outline-variant/10 min-w-[140px]">
               <p className="text-[8px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Success Rate</p>
               <p className="text-2xl font-black text-on-surface">72.4%</p>
            </div>
            <div className="bg-surface-container-low px-5 py-4 rounded-2xl border border-outline-variant/10 min-w-[140px]">
               <p className="text-[8px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Avg. ROI</p>
               <p className="text-2xl font-black text-primary">4.8%</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 py-4 px-6 bg-surface-container-high/40 rounded-2xl border border-outline-variant/5">
          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Live Status: System Ready ({currentTime})
          </span>
          <div className="flex items-center gap-4 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Gold Picks (High Chance)</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Standard (Normal)</span>
          </div>
        </div>
      </section>

      {allPredictions.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-outline-variant/10 border-dashed">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 opacity-50 block">analytics</span>
          <p className="text-on-surface-variant font-medium">No predictions available yet.</p>
          <p className="text-on-surface-variant text-sm mt-1">Data refreshes every 12 hours.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visiblePredictions.map((p) => {
              const color = confidenceColor(p.confidence)
              return (
                <div key={p.id} className={`rounded-xl border ${color.ring} ring-1 p-5 flex flex-col gap-4 transition-all hover:shadow-lg hover:shadow-primary/5`}>
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-surface-container-highest text-on-surface-variant font-black uppercase tracking-widest border border-outline-variant/10">
                            {p.market === 'totals' ? 'Over/Under' : p.market === 'spreads' ? 'Handicap' : 'Match Result'}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-primary font-black flex items-center gap-1">
                          <span className={`w-1 h-1 rounded-full ${color.dot}`}></span>
                          {p.sport}
                        </span>
                      </div>
                      <h3 className="font-bold text-on-surface leading-snug">{p.match}</h3>
                      <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{formatDate(p.commence_time)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {(p.edge || 0) > 4 && (
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                          Gold Value
                        </div>
                      )}
                      <div className={`px-2.5 py-1 rounded-lg ${color.badge} text-xs font-black uppercase tracking-widest shadow-sm`}>
                        {p.confidence}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container-high/50 rounded-2xl p-4 border border-outline-variant/5">
                    <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1.5">Engine Verdict</p>
                    <p className="font-black text-on-surface text-2xl tracking-tight leading-none mb-2">{p.prediction}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-on-surface-variant font-mono">Odds: <span className="text-primary font-black text-sm">{p.odds.toFixed(2)}</span></span>
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{p.bookmaker}</span>
                    </div>
                  </div>

                  {/* High Value Prediction Metrics */}
                  <div className="pt-2 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-black">Market Price</p>
                      <p className="text-sm font-bold text-on-surface">{(p.market_average || 0).toFixed(2)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-black">Value Boost</p>
                      <p className="text-sm font-black text-primary">+{(p.edge || 0).toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-outline-variant/10">
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-bold text-zinc-500">Stability</span>
                        <span className={`text-[10px] font-bold ${p.volatility === 'Active' ? 'text-red-400' : p.volatility === 'Normal' ? 'text-yellow-400' : 'text-emerald-400'}`}>{p.volatility || 'Stable'}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-bold text-zinc-500">Volume</span>
                        <span className="text-[10px] font-bold text-on-surface">{p.liquidity || 'Professional'}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-[8px] uppercase font-bold text-zinc-500">Win Target</span>
                        <span className="text-[10px] font-black text-primary">₦{Math.round(p.unit_return || 0)}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-container-high/30 border border-outline-variant/5">
                    <p className="text-[11px] leading-relaxed text-on-surface-variant italic">
                        {p.reason}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] pt-2">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Analysed by WealthFlow Engine</span>
                    <span>House Fee: {(p.market_margin || 0).toFixed(1)}%</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Paywall for remaining predictions */}
          {!isPremium && lockedCount > 0 && (
            <div className="mt-8">
              <div className="relative">
                {/* Blurred preview cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 blur-sm pointer-events-none select-none" aria-hidden>
                  {allPredictions.slice(FREE_LIMIT, FREE_LIMIT + 3).map((p, i) => (
                    <div key={i} className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-5 h-48" />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <PremiumPaywall
                    title={`${lockedCount} More Predictions Locked`}
                    message="Upgrade to WealthFlow Pro to access all predictions with full confidence scores and reasoning."
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}
