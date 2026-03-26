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
    .order('confidence', { ascending: false })

  const allPredictions: Prediction[] = predictions || []
  const visiblePredictions = isPremium ? allPredictions : allPredictions.slice(0, FREE_LIMIT)
  const lockedCount = allPredictions.length - FREE_LIMIT

  return (
    <main className="pt-24 pb-32 px-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <section className="pt-8 mb-10">
        <span className="text-xs uppercase tracking-[0.05em] text-primary mb-2 block font-bold">AI-Assisted Intelligence</span>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black text-on-surface tracking-tight mb-3">Predictions</h1>
              <p className="text-on-surface-variant max-w-lg leading-relaxed">
                Value bets identified using implied probability analysis across global markets.
              </p>
              <div className="mt-4">
                <RefreshButton />
              </div>
          </div>
          {!isPremium && (
            <Link href="/pricing" className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-md shadow-primary/20 whitespace-nowrap">
              Upgrade to Pro →
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4 mt-5 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary inline-block"></span> ≥70% High confidence</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span> 50–70% Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-tertiary inline-block"></span> &lt;50% Speculative</span>
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
                      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black flex items-center gap-1.5 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`}></span>
                        {p.sport}
                      </span>
                      <h3 className="font-bold text-on-surface leading-snug">{p.match}</h3>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{formatDate(p.commence_time)}</p>
                    </div>
                    <div className={`shrink-0 px-2.5 py-1 rounded-lg ${color.badge} text-xs font-black uppercase tracking-widest`}>
                      {p.confidence}%
                    </div>
                  </div>

                  <div className="bg-surface-container-high rounded-xl p-3.5">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Prediction</p>
                    <p className="font-black text-on-surface text-lg tracking-tight">{p.prediction}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-on-surface-variant font-mono">Odds: <span className="text-primary font-bold">{p.odds.toFixed(2)}</span></span>
                      <span className="text-xs text-on-surface-variant">{p.bookmaker}</span>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant mb-1">
                      <span className="font-bold uppercase tracking-widest">Confidence</span>
                      <span>{p.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${p.confidence >= 70 ? 'bg-primary' : p.confidence >= 50 ? 'bg-yellow-400' : 'bg-tertiary'}`}
                        style={{ width: `${p.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Statistical Edge Analysis */}
                  <div className="pt-4 border-t border-outline-variant/10 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black">Market Avg</p>
                      <p className="text-sm font-bold text-on-surface">{p.market_average.toFixed(2)}</p>
                      <p className="text-[9px] text-zinc-500 font-bold leading-none">Global Consensus</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black">Value Edge</p>
                      <p className="text-sm font-black text-primary">+{p.edge.toFixed(1)}%</p>
                      <p className="text-[9px] text-zinc-500 font-bold leading-none">Advantage vs Market</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                        <span className="font-bold text-primary italic mr-1">Insight:</span>
                        {p.reason}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 font-black uppercase tracking-widest pt-2">
                    <span>Vig: {p.market_margin.toFixed(1)}%</span>
                    <span>Ref: WF-AI-v4</span>
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
