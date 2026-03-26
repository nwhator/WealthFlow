'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ScanButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleScan = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cron/update-data?force=true&secret=wealthflow_secret_771')
      const data = await res.json()
      if (res.ok) {
        alert('Scan completed successfully! Refreshing data...')
        router.refresh()
      } else {
        alert('Scan failed: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Network error while scanning.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleScan}
      disabled={loading}
      className={`mt-4 flex items-center gap-2 px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] transition-all bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 ${loading ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}`}
    >
      <span className="material-symbols-outlined text-sm">
        {loading ? 'sync' : 'search'}
      </span>
      {loading ? 'Scanning Market...' : 'Run Manual Scan Now'}
    </button>
  )
}
