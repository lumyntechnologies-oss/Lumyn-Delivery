'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Loader, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Wallet } from 'lucide-react'
import Link from 'next/link'

interface Payout {
  id: string
  amount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'FAILED'
  paidAt: string | null
  createdAt: string
  delivery: {
    id: string
    description: string
    cost: number
  }
}

export default function DriverPayoutsPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }
    fetchPayouts()
  }, [isSignedIn])

  const fetchPayouts = async () => {
    try {
      const res = await fetch('/api/driver/payouts')
      const json = await res.json()
      if (json.success) {
        setPayouts(json.data.payouts)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestPayout = async (payoutId: string) => {
    if (!confirm('Request payout? This will mark it as ready for payment.')) return
    
    setRequesting(payoutId)
    try {
      const res = await fetch(`/api/driver/payout/${payoutId}/request`, {
        method: 'POST',
      })
      const json = await res.json()
      if (json.success) {
        fetchPayouts()
        alert('Payout requested! Admin will process it.')
      } else {
        alert(json.error || 'Failed')
      }
    } catch (error) {
      alert('Error requesting payout')
    } finally {
      setRequesting(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-warning" />
      case 'PAID': return <CheckCircle className="h-4 w-4 text-success" />
      case 'FAILED': return <XCircle className="h-4 w-4 text-error" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const pendingAmount = payouts
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPaid = payouts
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0)

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/driver-dashboard" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="section-title mb-8">Payouts</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-secondary">Pending</p>
                <p className="text-xl font-bold text-primary">KSh {pendingAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-secondary">Total Paid</p>
                <p className="text-xl font-bold text-primary">KSh {totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-accent-gold" />
              </div>
              <div>
                <p className="text-xs text-secondary">Total Payouts</p>
                <p className="text-xl font-bold text-primary">{payouts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payout List */}
        <div className="card">
          <h2 className="text-lg font-semibold text-primary mb-4">Payout History</h2>
          {payouts.length === 0 ? (
            <p className="text-secondary text-center py-8">No payouts yet. Complete deliveries to earn money!</p>
          ) : (
            <div className="space-y-3">
              {payouts.map(payout => (
                <div key={payout.id} className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl">
                  <div>
                    <p className="font-medium text-primary">
                      {payout.delivery?.description || 'Delivery payout'}
                      <span className="text-xs text-secondary ml-2">#{payout.delivery?.id.slice(-6)}</span>
                    </p>
                    <p className="text-sm text-secondary">
                      {new Date(payout.createdAt).toLocaleDateString()}
                      {payout.delivery?.cost && ` • Delivery: KSh ${payout.delivery.cost}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-primary">KSh {payout.amount.toFixed(2)}</p>
                      <span className={`text-xs flex items-center gap-1 justify-end ${payout.status === 'PENDING' ? 'text-warning' : payout.status === 'PAID' ? 'text-success' : 'text-error'}`}>
                        {getStatusIcon(payout.status)}
                        {payout.status}
                      </span>
                    </div>
                    {payout.status === 'PENDING' && (
                      <button
                        onClick={() => requestPayout(payout.id)}
                        disabled={requesting === payout.id}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        <Wallet className="h-4 w-4" />
                        Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-info/5 rounded-xl">
          <p className="text-sm text-info">
            <strong>How payouts work:</strong><br />
            1. Complete a delivery → funds added to your balance (80% of delivery cost)<br />
            2. Request payout when ready (minimum KSh 500)<br />
            3. Admin approves → payment sent via M-Pesa/bank transfer within 24-48 hours
          </p>
        </div>
      </div>
    </div>
  )
}
