'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Navbar } from '@/components/navbar'
import { Plus, Loader } from 'lucide-react'
import Link from 'next/link'

interface Delivery {
  id: string
  status: string
  description: string
  cost: number
  createdAt: string
  customer?: { firstName?: string; lastName?: string }
  driver?: { user?: { firstName?: string; lastName?: string } }
}

export default function DeliveriesPage() {
  const { isSignedIn, userId } = useAuth()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!isSignedIn || !userId) return

    const fetchDeliveries = async () => {
      try {
        const params = new URLSearchParams()
        if (filter !== 'all') params.append('status', filter)

        const response = await fetch(`/api/deliveries?${params}`)
        const data = await response.json()

        if (data.success) {
          setDeliveries(data.data.deliveries)
        }
      } catch (error) {
        console.error('Error fetching deliveries:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeliveries()
  }, [isSignedIn, userId, filter])

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'badge-info'
      case 'ASSIGNED':
        return 'badge-warning'
      case 'PICKED_UP':
        return 'badge-warning'
      case 'IN_TRANSIT':
        return 'badge-info'
      case 'DELIVERED':
        return 'badge-success'
      case 'CANCELLED':
        return 'badge-error'
      case 'FAILED':
        return 'badge-error'
      default:
        return 'badge-info'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="section-title">Your Deliveries</h1>
          <Link
            href="/new-delivery"
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={18} />
            New Delivery
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {['all', 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-2xl font-medium whitespace-nowrap transition-all ${
                filter === status
                  ? 'bg-accent-gold text-primary'
                  : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Deliveries List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="h-8 w-8 text-accent-gold animate-spin" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-secondary mb-4">No deliveries found.</p>
            <Link href="/new-delivery" className="btn-primary inline-block">
              Create Your First Delivery
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {deliveries.map((delivery) => (
              <Link
                key={delivery.id}
                href={`/deliveries/${delivery.id}`}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-primary">{delivery.description}</h3>
                      <span className={`badge ${getStatusBadgeClass(delivery.status)}`}>
                        {delivery.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-secondary mb-2">{formatDate(delivery.createdAt)}</p>
                    {delivery.driver && (
                      <p className="text-sm text-secondary">
                        Driver: {delivery.driver.user?.firstName || 'Pending Assignment'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-accent-gold">${delivery.cost.toFixed(2)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
