import { NextResponse } from 'next/server'
import { runFullDataRefresh } from '@/lib/cron-logic'

export async function GET(request: Request) {
  // Protect with CRON_SECRET for the automated cron
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await runFullDataRefresh()
    return NextResponse.json({ success: true, ...data })
  } catch (error: any) {
    console.error('[API Cron] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
