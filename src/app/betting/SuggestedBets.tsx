'use client'

import { useEffect, useState } from 'react'

type Suggestion = {
  id: string
  match: string
  commence_time: string
  sport: string
  favoredTeam: string
  odds: number
  bookmaker: string
  riskLabel: string
  riskPercent: number
  suggestedStake: number
}

export default function SuggestedBets({ bankroll }: { bankroll: number }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/betting-suggestions?bankroll=${bankroll}`)
      .then(res => res.json())
      .then(data => {
        setSuggestions(data)
        setLoading(false)
      })
  }, [bankroll])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount).replace('NGN', '₦')
  }

  if (loading) return <div className="text-sm text-on-surface-variant p-6 text-center animate-pulse">Algorithm analysing active markets & safe odds...</div>

  return (
    <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/10">
      <h3 className="text-lg font-bold mb-4 text-on-surface flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">smart_toy</span>
        Safe Value Bots
      </h3>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 pb-2 scroll-smooth">
        {suggestions.length === 0 && !loading ? (
             <p className="text-xs text-on-surface-variant">No extremely safe bets found mapping below the risk threshold right now.</p>
        ) : (
        suggestions.map(s => (
          <div key={s.id} 
               onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
               className={`bg-surface-container rounded-xl border transition-all cursor-pointer ${expandedId === s.id ? 'border-primary/50 shadow-md ring-1 ring-primary/20' : 'border-outline-variant/10 hover:border-outline-variant/30'} p-4`}
            >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm text-on-surface">{s.match}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    s.riskPercent < 20 ? 'bg-primary/20 text-primary' : 
                    s.riskPercent < 35 ? 'bg-secondary/20 text-secondary' : 
                    'bg-error-container text-on-error'
                  }`}>
                    {s.riskLabel}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant">Pick: <span className="text-on-surface">{s.favoredTeam}</span> @ {s.odds.toFixed(2)}</span>
                </div>
              </div>
              <div className="text-right ml-2 shrink-0">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Stake</p>
                <p className="font-black text-sm text-primary mt-0.5">{formatCurrency(s.suggestedStake)}</p>
              </div>
            </div>

            {/* EXPANDED INFO SECTION */}
            {expandedId === s.id && (
              <div className="mt-4 pt-4 border-t border-outline-variant/10 text-xs text-on-surface-variant transition-all">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-container-highest p-3 rounded-lg flex flex-col items-center">
                    <p className="text-[10px] uppercase font-bold tracking-wider mb-1">Exact Risk Profile</p>
                    <p className="text-on-surface font-black text-base">{s.riskPercent.toFixed(1)}%</p>
                  </div>
                  <div className="bg-surface-container-highest p-3 rounded-lg flex flex-col items-center">
                    <p className="text-[10px] uppercase font-bold tracking-wider mb-1">Win Probability</p>
                    <p className="text-primary font-black text-base">{(100 - s.riskPercent).toFixed(1)}%</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center bg-surface-container-highest p-3 rounded-lg mt-2">
                   <div>
                     <p className="text-[10px] uppercase font-bold tracking-wider mb-1">Recommended Bookie</p>
                     <p className="text-on-surface font-bold">{s.bookmaker}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] uppercase font-bold tracking-wider mb-1">League Scope</p>
                     <p className="text-on-surface font-bold">{s.sport}</p>
                   </div>
                </div>

                <div className="flex justify-center mt-3 opacity-70 items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <p className="text-[10px] font-bold">Starts: {new Date(s.commence_time).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        ))
        )}
        {bankroll === 0 && (
            <p className="text-[10px] text-on-surface-variant text-center mt-2 italic shadow-sm">Your bankroll is 0. Transfer funds to receive actual stake amounts!</p>
        )}
      </div>
    </div>
  )
}
