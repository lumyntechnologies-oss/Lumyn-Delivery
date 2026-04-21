'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Search, Loader, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface Driver {
  id: string
  licenseNumber: string
  vehicleType: string
  vehiclePlate: string
  isVerified: boolean
  isActive: boolean
  rating: number
  totalDeliveries: number
  user: {
    firstName?: string
    lastName?: string
    email: string
  }
}

export default function AdminDriversPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending'>('all')

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

    fetchDrivers()
  }, [userId, router])

  const fetchDrivers = async () => {
    try {
      // TODO: Implement actual API endpoint
      setDrivers([])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${driver.user.firstName} ${driver.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === 'verified') return matchesSearch && driver.isVerified
    if (filterStatus === 'pending') return matchesSearch && !driver.isVerified
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="section-title mb-8">Manage Drivers</h1>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 h-5 w-5 text-secondary" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base w-full pl-12"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'verified', 'pending'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-2xl font-medium whitespace-nowrap transition-all ${
                  filterStatus === status
                    ? 'bg-accent-gold text-primary'
                    : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Drivers List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="h-8 w-8 text-accent-gold animate-spin" />
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-secondary">No drivers found.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredDrivers.map((driver) => (
              <div key={driver.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-primary">
                        {driver.user.firstName} {driver.user.lastName}
                      </h3>
                      {driver.isVerified ? (
                        <span className="flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                          <CheckCircle size={14} /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs bg-warning/10 text-warning px-2 py-1 rounded-full">
                          <Clock size={14} /> Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-secondary mb-3">{driver.user.email}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-secondary text-xs mb-1">License</p>
                        <p className="text-primary font-medium">{driver.licenseNumber}</p>
                      </div>
                      <div>
                        <p className="text-secondary text-xs mb-1">Vehicle</p>
                        <p className="text-primary font-medium">{driver.vehicleType}</p>
                      </div>
                      <div>
                        <p className="text-secondary text-xs mb-1">Deliveries</p>
                        <p className="text-primary font-medium">{driver.totalDeliveries}</p>
                      </div>
                      <div>
                        <p className="text-secondary text-xs mb-1">Rating</p>
                        <p className="text-primary font-medium">⭐ {driver.rating.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-sm">View Profile</button>
                    {!driver.isVerified && (
                      <button className="btn-primary text-sm">Verify</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
