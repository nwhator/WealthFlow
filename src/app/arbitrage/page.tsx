import { bookmarkOpportunity } from './actions'

type Outcome = {
  name: string
  odds: number
  bookmaker: string
  stake: number
}

type ArbitrageOp = {
  sport: string
  match: string
  market: string
  arbitragePercentage: number
  guaranteedProfit: number
  stakeDistribution: Outcome[]
}

export default function ArbitrageDashboard() {
  const [opportunities, setOpportunities] = useState<ArbitrageOp[]>([])
  const [loading, setLoading] = useState(true)
  const [investment, setInvestment] = useState(10000)
  const [filter, setFilter] = useState('All')
  const [savingId, setSavingId] = useState<number | null>(null)

  const handleBookmark = async (op: ArbitrageOp, idx: number) => {
    setSavingId(idx)
    const res = await bookmarkOpportunity({
      match: op.match,
      sport: op.sport,
      market: op.market,
      arbitrage_percentage: op.arbitragePercentage,
      profit_estimate: op.guaranteedProfit,
      details: {
        stakeDistribution: op.stakeDistribution
      }
    })
    setSavingId(null)
    if (res.error) alert(res.error)
    else alert('Opportunity bookmarked!')
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/arbitrage/calculate?investment=${investment}`)
      const data = await res.json()
      setOpportunities(data)
    } catch (error) {
      console.error('Failed to fetch arbitrage data', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [investment])

  const filtered = opportunities.filter((op) => {
    if (filter === 'All') return true
    return op.sport.toLowerCase().includes(filter.toLowerCase())
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount).replace('NGN', '₦')
  }

  return (
    <div className="min-h-screen bg-surface-dim pb-32">
      <main className="pt-24 px-6 max-w-screen-2xl mx-auto">
        <section className="mb-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="max-w-2xl">
              <span className="text-xs uppercase tracking-[0.05em] text-primary mb-2 block font-medium">Live Market Intelligence</span>
              <h1 className="text-5xl font-bold tracking-tight leading-tight mb-4 text-on-surface">Arbitrage Desk</h1>
              <p className="text-on-surface-variant text-lg max-w-lg leading-relaxed">
                Identify and execute high-yield discrepancies across global sportsbooks in real-time.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="bg-surface-container-low p-6 rounded-xl min-w-[200px]">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">Total Investment Reference</p>
                <div className="flex items-center gap-2">
                    <span className="text-xl text-primary font-bold">₦</span>
                    <input 
                        type="number" 
                        value={investment} 
                        onChange={(e) => setInvestment(Number(e.target.value))}
                        className="bg-transparent text-2xl font-bold text-on-surface border-none outline-none w-32 tracking-tighter" 
                    />
                </div>
              </div>
              <div className="bg-surface-container-low p-6 rounded-xl min-w-[150px]">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold font-bold">Active Opps</p>
                <p className="text-3xl font-bold text-on-surface tracking-tighter">{loading ? '...' : filtered.length}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            {['All', 'Football', 'Basketball', 'Tennis'].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${filter === f ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-on-surface-variant italic">Reflecting real-time global pool</span>
          </div>
        </div>

        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1,2,3,4,5,6].map(i => <div key={i} className="bg-surface-container-low rounded-xl h-64 border border-outline-variant/10"></div>)}
             </div>
        ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-outline-variant/10 border-dashed">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 opacity-50">search_off</span>
                <p className="text-on-surface-variant font-medium">No profitable arbitrage opportunities found right now.</p>
                <button onClick={fetchData} className="mt-4 text-primary font-bold uppercase tracking-widest text-xs">Run Fresh Scan</button>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((op, idx) => (
                    <div key={idx} className={`bg-surface-container-low rounded-xl overflow-hidden group hover:bg-surface-container transition-all duration-300 border border-outline-variant/10 ${op.arbitragePercentage > 2 ? 'ring-1 ring-primary/20 bg-primary/5' : ''}`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">{op.sport}</span>
                                    <h3 className="text-xl font-bold text-on-surface">{op.match}</h3>
                                </div>
                                <div className={`px-3 py-1 rounded-md border text-sm font-bold ${op.arbitragePercentage > 2 ? 'bg-primary/20 text-primary border-primary/20' : 'bg-secondary/20 text-secondary border-secondary/20'}`}>
                                    {op.arbitragePercentage.toFixed(2)}%
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                {op.stakeDistribution.map((outcome, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high border border-outline-variant/10">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-on-surface">{outcome.bookmaker}</span>
                                                <span className="text-[10px] text-on-surface-variant uppercase font-semibold">{outcome.name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-mono font-bold text-primary block">{outcome.odds.toFixed(2)}</span>
                                            <span className="text-[10px] text-on-surface-variant font-medium">Split: {formatCurrency(outcome.stake)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Guaranteed Return</span>
                                    <span className="text-xl font-bold text-primary tracking-tight">{formatCurrency(op.guaranteedProfit)}</span>
                                </div>
                                <button 
                                    onClick={() => handleBookmark(op, idx)}
                                    disabled={savingId === idx}
                                    className="bg-primary/10 text-primary px-5 py-2 rounded-full font-bold text-xs hover:bg-primary/20 active:scale-95 transition-all uppercase tracking-widest border border-primary/20 disabled:opacity-50"
                                >
                                    {savingId === idx ? '...' : 'Track'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  )
}
