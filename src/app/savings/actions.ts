'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSavings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const amount = Number(formData.get('amount'))
  const source = formData.get('source') as string

  // Get liquidity and savings accounts
  const { data: accounts } = await supabase.from('accounts').select('id, name, balance').eq('user_id', user.id)
  const liquidityAcc = accounts?.find(a => a.name.toLowerCase() === 'liquidity')
  const savingsAcc = accounts?.find(a => a.name.toLowerCase() === 'savings')

  if (!liquidityAcc || !savingsAcc) return { error: 'Required accounts not found' }
  if (liquidityAcc.balance < amount) return { error: 'Insufficient funds in Liquidity' }

  // Process transaction
  const { error: txError } = await supabase.rpc('process_transaction', {
    p_user_id: user.id,
    p_type: 'transfer',
    p_amount: amount,
    p_from_account: liquidityAcc.id,
    p_to_account: savingsAcc.id,
    p_note: `Locked Savings - ${source}`
  })

  if (txError) return { error: txError.message }

  // Insert log
  await supabase.from('savings_logs').insert({
    user_id: user.id,
    amount,
    source,
    locked: true
  })
  
  revalidatePath('/savings')
  revalidatePath('/dashboard')
  revalidatePath('/accounts')
  return { success: true }
}
