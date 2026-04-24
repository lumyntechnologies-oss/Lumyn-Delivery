'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Loader, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Wallet, Search } from 'lucide-react'
import Link from 'next/link'

interface Payout {
  id: string
  amount: number
  currency: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  paidAt: string | null
  createdAt: string
  driver: {
    id: string
    firstName?: string
    lastName?: string
    email: string
  }
  delivery: {
    id: string
    description: string
    cost: number
  }
}

export default function AdminPayoutsPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL')
  const [search, setSearch] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      router.push('/sign-in')
      return
    }
    const adminIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',') || []
    if (!adminIds.includes(userId)) {
      router.push('/deliveries')
      return
    }
    fetchPayouts()
  }, [userId, router])

  const fetchPayouts = async () => {
    try {
      const res = await fetch(`/api/admin/payouts?status=${filter}`)
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

  const updateStatus = async (payoutId: string, status: 'PROCESSING' | 'COMPLETED' | 'FAILED') => {
    setProcessingId(payoutId)
    try {
      const res = await fetch(`/api/admin/payout/${payoutId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (json.success) {
        fetchPayouts()
      } else {
        alert(json.error || 'Failed')
      }
    } catch (error) {
      alert('Error updating payout')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredPayouts = payouts.filter(p =>
    p.driver.email.toLowerCase().includes(search.toLowerCase()) ||
    p.driver.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    p.delivery.id.slice(-6).includes(search)
  )

  const totalAmount = filteredPayouts.reduce((sum, p) => sum + p.amount, 0)
  const pendingCount = filteredPayouts.filter(p => p.status === 'PENDING').length

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

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">
          ← Back to Admin Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="section-title mb-0">Payout Management</h1>
          <div className="text-sm text-secondary">
            Total: KSh {totalAmount.toFixed(2)} | Pending: {pendingCount}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 h-5 w-5 text-secondary" />
            <input
              type="text"
              placeholder="Search by driver email, name, or delivery ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base w-full pl-12"
            />
          </div>
          <div className="flex gap-2">
            {(['ALL', 'PENDING', 'COMPLETED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-2xl font-medium whitespace-nowrap transition-all ${
                  filter === f
                    ? 'bg-accent-gold text-primary'
                    : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                }`}
              >
                {f === 'ALL' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Payouts Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/5">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-secondary">Driver</th>
                <th className="text-left p-4 text-sm font-medium text-secondary">Delivery</th>
                <th className="text-right p-4 text-sm font-medium text-secondary">Amount</th>
                <th className="text-center p-4 text-sm font-medium text-secondary">Status</th>
                <th className="text-left p-4 text-sm font-medium text-secondary">Date</th>
                <th className="text-right p-4 text-sm font-medium text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-secondary">
                    No payouts found
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="border-t border-border hover:bg-secondary/5 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-primary">{payout.driver.firstName} {payout.driver.lastName}</p>
                      <p className="text-xs text-secondary">{payout.driver.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-primary">{payout.delivery.description}</p>
                      <p className="text-xs text-secondary">#{payout.delivery.id.slice(-6)}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-bold text-primary">KSh {payout.amount.toFixed(2)}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        payout.status === 'PENDING' ? 'bg-warning/10 text-warning' :
                        payout.status === 'PROCESSING' ? 'bg-info/10 text-info' :
                        payout.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                        'bg-error/10 text-error'
                      }`}>
                        {payout.status === 'PENDING' && <Clock className="h-3 w-3" />}
                        {payout.status === 'PROCESSING' && <Loader className="h-3 w-3 animate-spin" />}
                        {payout.status === 'COMPLETED' && <CheckCircle className="h-3 w-3" />}
                        {payout.status === 'FAILED' && <XCircle className="h-3 w-3" />}
                        {payout.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-secondary">
                      {new Date(payout.createdAt).toLocaleDateString()}
                      {payout.paidAt && (
                        <p className="text-xs text-success">Paid {new Date(payout.paidAt).toLocaleDateString()}</p>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {payout.status === 'PENDING' && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => updateStatus(payout.id, 'PROCESSING')}
                            disabled={processingId === payout.id}
                            className="btn-secondary text-xs flex items-center gap-1"
                          >
                            <Wallet className="h-3 w-3" />
                            Process
                          </button>
                          <button
                            onClick={() => updateStatus(payout.id, 'FAILED')}
                            disabled={processingId === payout.id}
                            className="bg-error/10 text-error px-3 py-1 rounded-xl text-xs hover:bg-error/20 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {payout.status === 'PROCESSING' && (
                        <button
                          onClick={() => updateStatus(payout.id, 'COMPLETED')}
                          disabled={processingId === payout.id}
                          className="btn-primary text-xs flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-warning/5 border-warning/20">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-warning" />
              <span className="font-semibold text-primary">Pending Payouts</span>
            </div>
            <p className="text-2xl font-bold text-warning">
              KSh {payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </p>
            <p className="text-xs text-secondary mt-1">
              {payouts.filter(p => p.status === 'PENDING').length} drivers waiting
            </p>
          </div>

          <div className="card bg-info/5 border-info/20">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="h-5 w-5 text-info" />
              <span className="font-semibold text-primary">Processing</span>
            </div>
            <p className="text-2xl font-bold text-info">
              KSh {payouts.filter(p => p.status === 'PROCESSING').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </p>
            <p className="text-xs text-secondary mt-1">
              {payouts.filter(p => p.status === 'PROCESSING').length} being processed
            </p>
          </div>

          <div className="card bg-success/5 border-success/20">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-semibold text-primary">Total Paid Out</span>
            </div>
            <p className="text-2xl font-bold text-success">
              KSh {payouts.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </p>
            <p className="text-xs text-secondary mt-1">
              {payouts.filter(p => p.status === 'COMPLETED').length} completed payouts
            </p>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-8 p-4 bg-info/5 rounded-xl">
          <p className="text-sm text-info">
            <strong>How payout processing works:</strong><br />
            1. Driver completes delivery → payout automatically created (80% of delivery cost)<br />
            2. Driver "Requests Payout" → status becomes "Requested" (shown here as PENDING)<br />
            3. Admin "Process" → marks as PROCESSING (transfer money via M-Pesa/bank)<br />
            4. After payment sent, "Mark Paid" → status COMPLETE, driver notified<br />
            5. If issue, "Reject" → status FAILED, driver can retry
          </p>
        </div>
      </div>
    </div>
  )
}
