'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Package, TrendingUp, Star, DollarSign, Loader, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface DriverStats {
  totalDeliveries: number
  activeDeliveries: number
  completedToday: number
  totalEarnings: number
  averageRating: number
}

interface Delivery {
  id: string
  description: string
  status: string
  cost: number
  customer: {
    firstName?: string
    lastName?: string
    phone?: string
  }
  pickupAddress: {
    city: string
    state: string
  }
  dropoffAddress: {
    city: string
    state: string
  }
}

export default function DriverDashboard() {
  const { isSignedIn, userId } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isDriver, setIsDriver] = useState(false)
  const [stats, setStats] = useState<DriverStats | null>(null)
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([])

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    checkDriverStatus()
  }, [isSignedIn, router])

  const checkDriverStatus = async () => {
    try {
      const response = await fetch('/api/drivers/profile')
      const data = await response.json()

      if (data.success) {
        setIsDriver(true)
        // TODO: Fetch actual stats from database
        setStats({
          totalDeliveries: 127,
          activeDeliveries: 3,
          completedToday: 8,
          totalEarnings: 2840.50,
          averageRating: 4.9,
        })

        // Fetch active deliveries
        const deliveriesResponse = await fetch('/api/deliveries?status=IN_TRANSIT')
        const deliveriesData = await deliveriesResponse.json()
        if (deliveriesData.success) {
          setActiveDeliveries(deliveriesData.data.deliveries)
        }
      } else {
        setIsDriver(false)
      }
    } catch (error) {
      console.error('Error checking driver status:', error)
      setIsDriver(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader className="h-8 w-8 text-accent-gold animate-spin" />
        </div>
      </div>
    )
  }

  if (!isDriver) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center py-12">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-primary mb-2">Not Registered as Driver</h1>
            <p className="text-secondary mb-6">
              You need to register as a driver to access this dashboard.
            </p>
            <Link href="/become-driver" className="btn-primary inline-block">
              Register as Driver
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="section-title mb-8">Driver Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Deliveries */}
          <div className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="section-subtitle">Total Deliveries</p>
                {stats && <p className="text-2xl font-bold text-primary mt-1">{stats.totalDeliveries}</p>}
              </div>
              <div className="h-8 w-8 rounded-lg bg-accent-gold/20 flex items-center justify-center">
                <Package className="h-4 w-4 text-accent-gold" />
              </div>
            </div>
            <p className="text-xs text-secondary">All time</p>
          </div>

          {/* Active Deliveries */}
          <div className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="section-subtitle">Active</p>
                {stats && <p className="text-2xl font-bold text-primary mt-1">{stats.activeDeliveries}</p>}
              </div>
              <div className="h-8 w-8 rounded-lg bg-info/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-info" />
              </div>
            </div>
            <p className="text-xs text-secondary">In progress</p>
          </div>

          {/* Completed Today */}
          <div className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="section-subtitle">Today</p>
                {stats && <p className="text-2xl font-bold text-primary mt-1">{stats.completedToday}</p>}
              </div>
              <div className="h-8 w-8 rounded-lg bg-success/20 flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
            </div>
            <p className="text-xs text-secondary">Completed</p>
          </div>

          {/* Total Earnings */}
          <div className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="section-subtitle">Earnings</p>
                {stats && <p className="text-2xl font-bold text-accent-gold mt-1">${stats.totalEarnings.toFixed(0)}</p>}
              </div>
              <div className="h-8 w-8 rounded-lg bg-accent-gold/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-accent-gold" />
              </div>
            </div>
            <p className="text-xs text-secondary">Total</p>
          </div>

          {/* Average Rating */}
          <div className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="section-subtitle">Rating</p>
                {stats && <p className="text-2xl font-bold text-primary mt-1">{stats.averageRating}</p>}
              </div>
              <div className="h-8 w-8 rounded-lg bg-accent-gold/20 flex items-center justify-center">
                <Star className="h-4 w-4 text-accent-gold" />
              </div>
            </div>
            <p className="text-xs text-secondary">Average</p>
          </div>
        </div>

        {/* Active Deliveries */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-primary">Active Deliveries</h2>
            <Link href="/deliveries?filter=assigned" className="text-accent-gold hover:text-accent-gold-light text-sm">
              View All →
            </Link>
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="card text-center py-12">
              <Package className="h-12 w-12 text-secondary mx-auto mb-4 opacity-50" />
              <p className="text-secondary mb-6">No active deliveries</p>
              <Link href="/deliveries" className="btn-primary inline-block">
                Browse Available Deliveries
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeDeliveries.map((delivery) => (
                <Link
                  key={delivery.id}
                  href={`/deliveries/${delivery.id}`}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary mb-2">{delivery.description}</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm text-secondary">
                        <div>
                          <p className="text-xs font-medium mb-0.5">Pickup</p>
                          <p>{delivery.pickupAddress.city}, {delivery.pickupAddress.state}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-0.5">Dropoff</p>
                          <p>{delivery.dropoffAddress.city}, {delivery.dropoffAddress.state}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent-gold">${delivery.cost.toFixed(2)}</p>
                      <span className="badge badge-info text-xs">{delivery.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link href="/profile" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary">My Profile</h3>
                <p className="text-sm text-secondary">View and update driver information</p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </Link>

          <Link href="/deliveries" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary">Browse Deliveries</h3>
                <p className="text-sm text-secondary">Find new delivery opportunities</p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
