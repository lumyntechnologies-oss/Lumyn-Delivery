'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { DollarSign, TrendingUp, Calendar, CreditCard, Loader, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'

interface EarningsData {
  stats: {
    totalEarnings: number
    totalTips: number
    weeklyEarnings: number
    monthlyEarnings: number
    totalDeliveries: number
    completedDeliveries: number
    pendingPayouts: number
    paidOut: number
  }
  recentDeliveries: {
    id: string
    cost: number
    tip: number
    date: string
    payoutStatus: string
  }[]
  payouts: {
    id: string
    amount: number
    currency: string
    status: string
    paidAt: string | null
    createdAt: string
  }[]
}

export default function DriverEarningsPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EarningsData | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    fetchEarnings()
  }, [isSignedIn])

  const fetchEarnings = async () => {
    try {
      const res = await fetch('/api/driver/earnings')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toFixed(2)}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-warning" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-error" />
      default:
        return <Clock className="h-4 w-4 text-secondary" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 text-accent-gold animate-spin" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="card text-center py-12">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-primary mb-2">Unable to Load Earnings</h1>
            <p className="text-secondary">Please try again later</p>
            <button onClick={fetchEarnings} className="btn-primary mt-4">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/driver-dashboard" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="section-title mb-8">Earnings Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-start gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-success/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-secondary">Total Earnings</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(data.stats.totalEarnings)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent-gold" />
              </div>
              <div>
                <p className="text-xs text-secondary">This Week</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(data.stats.weeklyEarnings)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-accent-teal/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-accent-teal" />
              </div>
              <div>
                <p className="text-xs text-secondary">This Month</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(data.stats.monthlyEarnings)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-info/20 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-secondary">Pending Payout</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(data.stats.pendingPayouts)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payout History */}
          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-4">Payout History</h2>
            {data.payouts.length === 0 ? (
              <p className="text-secondary text-sm">No payouts yet</p>
            ) : (
              <div className="space-y-3">
                {data.payouts.map(payout => (
                  <div key={payout.id} className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-primary">{formatCurrency(payout.amount)}</p>
                      <p className="text-xs text-secondary">
                        {new Date(payout.createdAt).toLocaleDateString()}
                        {payout.paidAt && ` • Paid ${new Date(payout.paidAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      payout.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                      payout.status === 'PENDING' ? 'bg-warning/10 text-warning' :
                      'bg-error/10 text-error'
                    }`}>
                      {getStatusIcon(payout.status)}
                      {payout.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Deliveries */}
          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-4">Recent Deliveries</h2>
            {data.recentDeliveries.length === 0 ? (
              <p className="text-secondary text-sm">No completed deliveries yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentDeliveries.map(delivery => (
                  <div key={delivery.id} className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-primary">{formatCurrency(delivery.cost)}</p>
                      {delivery.tip > 0 && (
                        <p className="text-xs text-accent-gold">+{formatCurrency(delivery.tip)} tip</p>
                      )}
                      <p className="text-xs text-secondary">
                        {delivery.date ? new Date(delivery.date).toLocaleDateString() : 'Pending'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      delivery.payoutStatus === 'COMPLETED' ? 'bg-success/10 text-success' :
                      delivery.payoutStatus === 'PENDING' ? 'bg-warning/10 text-warning' :
                      'bg-secondary/10 text-secondary'
                    }`}>
                      {getStatusIcon(delivery.payoutStatus)}
                      {delivery.payoutStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 card bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 border-accent-gold/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-accent-gold/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-accent-gold" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">Total Lifetime Earnings</h3>
              <p className="text-sm text-secondary">All completed deliveries + tips</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-accent-gold mb-2">{formatCurrency(data.stats.totalEarnings + data.stats.totalTips)}</p>
          <div className="flex gap-6 text-sm text-secondary">
            <span>Deliveries: {data.stats.completedDeliveries}</span>
            <span>Tips: {formatCurrency(data.stats.totalTips)}</span>
            <span>Avg: {data.stats.completedDeliveries > 0 ? formatCurrency(data.stats.totalEarnings / data.stats.completedDeliveries) : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
