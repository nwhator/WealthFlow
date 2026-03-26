'use server'

import { revalidatePath } from 'next/cache'
import { runFullDataRefresh } from '@/lib/cron-logic'

export async function refreshMarketData() {
  try {
    const data = await runFullDataRefresh()
    
    // Revalidate paths to clear cache
    revalidatePath('/arbitrage')
    revalidatePath('/predictions')
    revalidatePath('/dashboard')

    return { 
      success: true, 
      predictions: data.predictions, 
      arbitrage: data.arbitrage 
    }
  } catch (error: any) {
    console.error('[Refresh Action] Fatal Error:', error)
    return { success: false, error: error.message || 'Fatal error occurred while refreshing' }
  }
}
