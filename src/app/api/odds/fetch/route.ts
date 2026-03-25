import { NextResponse } from 'next/server';
import { getNormalizedOdds } from '@/lib/odds-service';

export async function GET() {
  try {
    const normalizedData = await getNormalizedOdds();
    return NextResponse.json(normalizedData);
  } catch (error) {
    console.error('Odds fetch failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
