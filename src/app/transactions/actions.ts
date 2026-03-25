'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const type = formData.get('type') as string
  const amount = Number(formData.get('amount'))
  const note = (formData.get('note') as string) || null
  const from_account = formData.get('from_account') as string || null
  const to_account = formData.get('to_account') as string || null

  if (amount <= 0) {
    return { error: 'Amount must be greater than zero' }
  }

  const { error } = await supabase.rpc('process_transaction', {
    p_user_id: user.id,
    p_type: type,
    p_amount: amount,
    p_from_account: from_account ? from_account : null,
    p_to_account: to_account ? to_account : null,
    p_note: note
  })

  if (error) {
    console.error('Transaction error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/accounts')
  revalidatePath('/transactions')
  
  return { success: true }
}
