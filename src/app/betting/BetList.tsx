'use client'
import { useState } from 'react'
import { updateBetResult } from './actions'

type Bet = {
  id: string
  match: string
  bookmaker: string
  odds: number
  stake: number
  result: 'pending' | 'win' | 'loss'
  profit_loss: number
  created_at: string
}

export default function BetList({ bets }: { bets: Bet[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleUpdate = async (id: string, result: 'win' | 'loss', odds: number, stake: number) => {
    setLoadingId(id)
    await updateBetResult(id, result, odds, stake)
    setLoadingId(null)
    window.location.reload()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount).replace('NGN', '₦')
  }

  return (
    <div className="space-y-4">
      {bets.length === 0 ? (
        <p className="text-on-surface-variant text-sm text-center py-6">No bets recorded yet.</p>
      ) : (
        bets.map(bet => (
          <div key={bet.id} className="bg-surface-container p-4 rounded-xl border border-outline-variant/5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-on-surface text-sm">{bet.match}</h4>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{bet.bookmaker} • Odds: {bet.odds}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-on-surface text-sm">{formatCurrency(bet.stake)}</p>
                <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm inline-block mt-1 ${
                  bet.result === 'win' ? 'bg-primary/20 text-primary' : 
                  bet.result === 'loss' ? 'bg-error-container text-on-error' : 
                  'bg-surface-container-highest text-on-surface'
                }`}>
                  {bet.result}
                </div>
              </div>
            </div>

            {bet.result === 'pending' && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-outline-variant/10">
                <button 
                  disabled={loadingId === bet.id}
                  onClick={() => handleUpdate(bet.id, 'win', bet.odds, bet.stake)}
                  className="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                >
                  Mark Won
                </button>
                <button 
                  disabled={loadingId === bet.id}
                  onClick={() => handleUpdate(bet.id, 'loss', bet.odds, bet.stake)}
                  className="flex-1 py-1.5 bg-error-container/50 hover:bg-error-container text-on-error font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                >
                  Mark Lost
                </button>
              </div>
            )}
            
            {bet.result !== 'pending' && (
              <div className="mt-2 text-right">
                <span className={`text-xs font-bold ${bet.profit_loss > 0 ? 'text-primary' : 'text-on-error'}`}>
                  {bet.profit_loss > 0 ? '+' : ''}{formatCurrency(bet.profit_loss)}
                </span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
