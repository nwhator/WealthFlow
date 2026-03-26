'use server'

import { revalidatePath } from 'next/cache'

export async function refreshMarketData() {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    throw new Error('CRON_SECRET is not configured on the server.')
  }

  // Determine origin (handle development vs production)
  const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'

  try {
    const res = await fetch(`${host}/api/cron/update-data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      const error = await res.json()
      return { success: false, error: error.error || 'Failed to refresh data' }
    }

    const data = await res.json()
    
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
    console.error('[Refresh Action] Error:', error)
    return { success: false, error: 'Internal server error occurred while refreshing' }
  }
}
