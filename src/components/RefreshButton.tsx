'use client'

import { useState } from 'react'
import { refreshMarketData } from '@/app/actions/refresh-data'

export default function RefreshButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const res = await refreshMarketData()
      if (res.success) {
        setLastRefresh(new Date().toLocaleTimeString())
        window.location.reload() // Reload to see fresh server-side data if needed, or just rely on revalidatePath
      } else {
        alert(`Refresh failed: ${res.error}`)
      }
    } catch (e) {
      alert('Internal error while refreshing.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button 
        onClick={handleRefresh} 
        disabled={loading}
        className={className || "flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"}
      >
        <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>
          refresh
        </span>
        {loading ? 'Refreshing...' : 'Scan Markets'}
      </button>
      {lastRefresh && (
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
          Refreshed at {lastRefresh}
        </span>
      )}
    </div>
  )
}
