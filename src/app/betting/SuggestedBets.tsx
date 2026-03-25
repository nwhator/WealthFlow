'use client'

import { useEffect, useState } from 'react'

type Suggestion = {
  id: string
  match: string
  odds: number
  risk: string
  suggestedStake: number
}

export default function SuggestedBets({ bankroll }: { bankroll: number }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="text-sm text-on-surface-variant p-6 text-center animate-pulse">Algorithm analysing active markets & odds...</div>

  return (
    <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/10">
      <h3 className="text-lg font-bold mb-4 text-on-surface flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">smart_toy</span>
        AI Suggested Models
      </h3>
      <div className="space-y-3">
        {suggestions.map(s => (
          <div key={s.id} className="bg-surface-container p-4 rounded-xl border border-outline-variant/10">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm text-on-surface">{s.match}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    s.odds < 1.5 ? 'bg-primary/20 text-primary' : 
                    s.odds < 2.5 ? 'bg-secondary/20 text-secondary' : 
                    'bg-error-container text-on-error'
                  }`}>
                    {s.risk}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant">Odds: <span className="text-on-surface">{s.odds.toFixed(2)}</span></span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Suggested Stake</p>
                <p className="font-black text-sm text-on-surface mt-0.5">{formatCurrency(s.suggestedStake)}</p>
              </div>
            </div>
          </div>
        ))}
        {bankroll === 0 && (
            <p className="text-xs text-on-surface-variant text-center mt-2 italic shadow-sm">Your bankroll is 0. Transfer funds to receive actual stake amounts!</p>
        )}
      </div>
    </div>
  )
}
