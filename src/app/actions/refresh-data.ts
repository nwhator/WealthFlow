'use server'

import { revalidatePath } from 'next/cache'
import { runFullDataRefresh, getCacheStatus } from '@/lib/cron-logic'

export async function refreshMarketData() {
  try {
    const status = await getCacheStatus()

    // Hard block: don't touch the API if data is still fresh
    if (!status.isStale) {
      return {
        success: false,
        blocked: true,
        lastUpdated: status.lastUpdated,
        nextUpdate: status.nextUpdate,
        error: 'Data is still fresh. Next update scheduled automatically.',
      }
    }

    const data = await runFullDataRefresh()
    revalidatePath('/arbitrage')
    revalidatePath('/predictions')
    revalidatePath('/dashboard')

    return {
      success: true,
      predictions: (data as any).predictions,
      arbitrage: (data as any).arbitrage,
      lastUpdated: (data as any).lastUpdated,
      nextUpdate: (data as any).nextUpdate,
    }
  } catch (error: any) {
    console.error('[Refresh Action] Fatal Error:', error)
    return { success: false, error: error.message || 'Fatal error occurred while refreshing' }
  }
}

export async function getDataFreshness() {
  return getCacheStatus()
}
