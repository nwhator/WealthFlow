'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addBet(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const match = formData.get('match') as string
  const bookmaker = formData.get('bookmaker') as string
  const odds = Number(formData.get('odds'))
  const stake = Number(formData.get('stake'))

  const { error } = await supabase.from('bets').insert({
    user_id: user.id,
    match,
    bookmaker,
    odds,
    stake,
    result: 'pending'
  })

  if (error) return { error: error.message }
  revalidatePath('/betting')
  return { success: true }
}

export async function updateBetResult(betId: string, result: 'win' | 'loss', odds: number, stake: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Get betting account ID
  const { data: accounts } = await supabase.from('accounts').select('id, name').eq('user_id', user.id).ilike('name', 'betting').single()
  if (!accounts) return { error: 'Betting account not found. Please create one.' }

  let profit_loss = 0;
  if (result === 'win') {
    profit_loss = (odds * stake) - stake
  } else {
    profit_loss = stake // wait, the db logic subtracts so we'll pass absolute value
  }

  // 2. Update the bet
  await supabase.from('bets').update({ result, profit_loss: result === 'win' ? profit_loss : -profit_loss }).eq('id', betId)

  // 3. Process the transaction on the betting account
  const txType = result === 'win' ? 'income' : 'expense'
  await supabase.rpc('process_transaction', {
    p_user_id: user.id,
    p_type: txType,
    p_amount: Math.abs(profit_loss),
    p_to_account: txType === 'income' ? accounts.id : null,
    p_from_account: txType === 'expense' ? accounts.id : null,
    p_note: `Bet ${result} -> ID: ${betId.slice(0,6)}`
  })

  revalidatePath('/betting')
  revalidatePath('/dashboard')
  return { success: true }
}
