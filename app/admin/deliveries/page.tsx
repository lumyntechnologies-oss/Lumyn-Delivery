'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Search, Loader } from 'lucide-react'
import Link from 'next/link'

interface Delivery {
  id: string
  description: string
  status: string
  cost: number
  priority: string
  createdAt: string
  customer?: {
    firstName?: string
    lastName?: string
    email: string
  }
  driver?: {
    user?: {
      firstName?: string
      lastName?: string
    }
  }
}

export default function AdminDeliveriesPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const statuses = ['all', 'PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']

   const fetchDeliveries = async (search?: string) => {
     try {
       const params = new URLSearchParams()
       if (statusFilter !== 'all') params.append('status', statusFilter)
       if (search) params.append('search', search)
       params.append('limit', '50')
       params.append('offset', '0')

       const response = await fetch(`/api/deliveries?${params.toString()}`)
       const data = await response.json()
       if (data.success && data.data) {
         setDeliveries(data.data.deliveries || [])
       } else {
         setDeliveries([])
       }
     } catch (error) {
       console.error('Error fetching deliveries:', error)
       setDeliveries([])
     } finally {
       setLoading(false)
     }
   }

   useEffect(() => {
     if (!userId) {
       router.push('/sign-in')
       return
     }

     const adminUserIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',') || []
     if (!adminUserIds.includes(userId)) {
       router.push('/deliveries')
       return
     }

     fetchDeliveries(searchTerm)
   }, [userId, router, statusFilter])

   useEffect(() => {
     const timeoutId = setTimeout(() => {
       fetchDeliveries(searchTerm)
     }, 300)
     return () => clearTimeout(timeoutId)
   }, [searchTerm])

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'badge-error'
      case 'HIGH':
        return 'badge-warning'
      case 'NORMAL':
        return 'badge-info'
      case 'LOW':
        return 'badge-success'
      default:
        return 'badge-info'
    }
  }

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

   const filteredDeliveries = deliveries

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="section-title mb-8">Manage Deliveries</h1>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 h-5 w-5 text-secondary" />
            <input
              type="text"
              placeholder="Search deliveries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base w-full pl-12"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-2xl font-medium whitespace-nowrap transition-all text-sm ${
                  statusFilter === status
                    ? 'bg-accent-gold text-primary'
                    : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Deliveries Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="h-8 w-8 text-accent-gold animate-spin" />
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-secondary">No deliveries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Description</th>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Customer</th>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Status</th>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Priority</th>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Cost</th>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Date</th>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="border-b border-border hover:bg-secondary/5">
                    <td className="py-4 px-4 text-primary font-medium">{delivery.description}</td>
                    <td className="py-4 px-4 text-secondary text-sm">
                      {delivery.customer?.firstName} {delivery.customer?.lastName}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`badge ${getStatusBadgeClass(delivery.status)}`}>
                        {delivery.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`badge ${getPriorityBadgeClass(delivery.priority)}`}>
                        {delivery.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-primary font-medium">${delivery.cost.toFixed(2)}</td>
                    <td className="py-4 px-4 text-secondary text-sm">{formatDate(delivery.createdAt)}</td>
                    <td className="py-4 px-4">
                      <button className="text-accent-gold hover:text-accent-gold-light text-sm font-medium">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
