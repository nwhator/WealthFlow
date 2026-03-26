'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export async function refreshMarketData() {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return { success: false, error: 'CRON_SECRET is not configured on the server.' }
  }

  // Determine origin (handle development vs production)
  const hostHeader = headers().get('host') || 'localhost:3000'
  const protocol = hostHeader.includes('localhost') ? 'http' : 'https'
  const host = `${protocol}://${hostHeader}`

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
