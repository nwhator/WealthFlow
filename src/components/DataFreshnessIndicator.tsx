'use client'

import { useState, useEffect } from 'react'
import { getDataFreshness } from '@/app/actions/refresh-data'

function formatCountdown(targetIso: string): string {
  const diff = new Date(targetIso).getTime() - Date.now()
  if (diff <= 0) return 'Updating soon...'
  const h = Math.floor(diff / (1000 * 60 * 60))
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${h}h ${m}m`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DataFreshnessIndicator({ className }: { className?: string }) {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [nextUpdate, setNextUpdate] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<string>('—')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDataFreshness().then(status => {
      setLastUpdated(status.lastUpdated)
      setNextUpdate(status.nextUpdate)
      setLoading(false)
    })
  }, [])

  // Live countdown tick
  useEffect(() => {
    if (!nextUpdate) return
    const tick = () => setCountdown(formatCountdown(nextUpdate))
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [nextUpdate])

  if (loading) return (
    <div className={className || 'flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high border border-outline-variant/10 animate-pulse'}>
      <span className="w-2 h-2 rounded-full bg-zinc-600" />
      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Loading...</span>
    </div>
  )

  return (
    <div className={className || 'flex items-center gap-3 flex-wrap'}>
      {/* Last updated pill */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high border border-outline-variant/10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
          Updated: <span className="text-on-surface">{formatDate(lastUpdated)}</span>
        </span>
      </div>

      {/* Next update countdown pill */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high border border-outline-variant/10">
        <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
          Next scan: <span className="text-primary font-black">{nextUpdate ? countdown : '—'}</span>
        </span>
      </div>
    </div>
  )
}
