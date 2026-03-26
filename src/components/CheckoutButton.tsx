'use client'

import { useEffect, useState } from 'react'
import { initializePaddle, Paddle } from '@paddle/paddle-js'

export default function CheckoutButton({ 
  priceId, 
  userId, 
  userEmail,
  className 
}: { 
  priceId: string, 
  userId: string,
  userEmail: string,
  className?: string 
}) {
  const [paddle, setPaddle] = useState<Paddle>()

  useEffect(() => {
    initializePaddle({ 
      environment: 'production', // or 'sandbox'
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    }).then((paddleInstance: Paddle | undefined) => {
        if (paddleInstance) setPaddle(paddleInstance)
    })
  }, [])

  const handleCheckout = () => {
    if (!paddle) return

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: userEmail },
      customData: { user_id: userId },
      settings: {
        displayMode: 'overlay',
        theme: 'dark',
        successUrl: `${window.location.origin}/pricing?success=true`
      }
    })
  }

  return (
    <button 
      onClick={handleCheckout} 
      className={className || "w-full py-4 bg-primary text-on-primary rounded-xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"}
      disabled={!paddle}
    >
      {paddle ? 'Subscribe Now' : 'Loading Checkout...'}
    </button>
  )
}
