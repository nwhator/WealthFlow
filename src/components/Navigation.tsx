"use client"
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
    return null;
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-md flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/20 flex items-center justify-center relative">
            <Image src="/logo.png" alt="WealthFlow Logo" fill className="object-cover" />
          </div>

          <h1 className="text-emerald-500 font-black tracking-tighter font-['Inter'] text-2xl">WealthFlow</h1>
        </div>
        <button className="text-gray-400 hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-surface-container-high active:scale-95 active:duration-100">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* Shared Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-50 rounded-t-3xl bg-[#131313]/60 backdrop-blur-md tonal-shift shadow-[0_-4px_24px_rgba(16,185,129,0.06)] flex justify-around items-center px-4 pt-3 pb-8">
        <Link href="/dashboard" className={`flex flex-col items-center justify-center ${pathname === '/dashboard' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-emerald-400'} rounded-xl px-3 py-1 transition-all duration-300`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/dashboard' ? "'FILL' 1" : "'FILL' 0" }}>grid_view</span>
          <span className="text-[10px] uppercase tracking-[0.05em] font-semibold mt-1">Home</span>
        </Link>
        <Link href="/accounts" className={`flex flex-col items-center justify-center ${pathname === '/accounts' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-emerald-400'} rounded-xl px-3 py-1 transition-all duration-300`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/accounts' ? "'FILL' 1" : "'FILL' 0" }}>account_balance_wallet</span>
          <span className="text-[10px] uppercase tracking-[0.05em] font-semibold mt-1">Accounts</span>
        </Link>
        <Link href="/betting" className={`flex flex-col items-center justify-center ${pathname === '/betting' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-emerald-400'} rounded-xl px-3 py-1 transition-all duration-300`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/betting' ? "'FILL' 1" : "'FILL' 0" }}>casino</span>
          <span className="text-[10px] uppercase tracking-[0.05em] font-semibold mt-1">Betting</span>
        </Link>
        <Link href="/savings" className={`flex flex-col items-center justify-center ${pathname === '/savings' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-emerald-400'} rounded-xl px-3 py-1 transition-all duration-300`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/savings' ? "'FILL' 1" : "'FILL' 0" }}>lock</span>
          <span className="text-[10px] uppercase tracking-[0.05em] font-semibold mt-1">Savings</span>
        </Link>
        <Link href="/transactions" className={`flex flex-col items-center justify-center ${pathname === '/transactions' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-emerald-400'} rounded-xl px-3 py-1 transition-all duration-300`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/transactions' ? "'FILL' 1" : "'FILL' 0" }}>receipt_long</span>
          <span className="text-[10px] uppercase tracking-[0.05em] font-semibold mt-1">Activity</span>
        </Link>
      </nav>
    </>
  );
}
