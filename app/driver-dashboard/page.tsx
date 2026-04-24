'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Package, TrendingUp, Star, DollarSign, Loader, AlertCircle, Power, PowerOff, Navigation, MapPin, Phone, Mail, CheckCircle, Shield, Clock, FileText, Edit3, Car, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useSSE } from '@/hooks/useSSE'

interface Delivery {
  id: string
  status: string
  description: string
  cost: number
  priority: string
  notes?: string
  weight?: number
  dimensions?: string
  createdAt: string
  pickupTime?: string
  deliveryTime?: string
  distance?: number
  estimatedTime?: number
  customer: {
    firstName?: string
    lastName?: string
    email: string
    phone?: string
  }
  pickupAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    label: string
  }
  dropoffAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    label: string
  }
}

interface DriverProfile {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  licenseNumber?: string
  licenseExpiry?: string
  vehicleType?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleYear?: number
  vehiclePlate?: string
  isDriverVerified: boolean
  isDriverActive: boolean
  driverRating: number
  totalDeliveries: number
  applicationStatus: string
  bio?: string
  profileImage?: string
}

export default function DriverDashboardPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isDriver, setIsDriver] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [stats, setStats] = useState<{
    totalJobs: number
    active: number
    today: number
    earnings: number
    rating: number
  } | null>(null)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    fetchDriverData()
    fetchDeliveries()
  }, [isSignedIn])

  // Real-time updates via SSE
  const { connected } = useSSE(profile?.id || null, {
    onMessage: (message) => {
      console.log('SSE message:', message)
      // Refresh deliveries when update received
      if (message.type === 'statusChange' || message.type === 'update') {
        fetchDeliveries()
      }
    },
    onStatusChange: (status, deliveryId) => {
      console.log(`Delivery ${deliveryId} status changed to ${status}`)
      fetchDeliveries()
    },
  })

  const fetchDriverData = async () => {
    try {
      const response = await fetch('/api/drivers/profile')
      const data = await response.json()
      if (data.success) {
        setIsDriver(true)
        setProfile(data.data)
        setIsOnline(data.data.isDriverActive || false)
        setStats(data.data.stats || {
          totalJobs: data.data.totalDeliveries || 0,
          active: 0,
          today: 0,
          earnings: 0,
          rating: data.data.driverRating || 0,
        })
      } else {
        setIsDriver(false)
      }
    } catch (error) {
      console.error('Error fetching driver profile:', error)
      setIsDriver(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveries = async () => {
    try {
      const response = await fetch('/api/deliveries?role=DRIVER&status=ASSIGNED,PICKED_UP,IN_TRANSIT')
      const data = await response.json()
      if (data.success) {
        setDeliveries(data.data.deliveries)
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error)
    }
  }

  const toggleAvailability = async () => {
    try {
      const response = await fetch('/api/drivers/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isOnline }),
      })
      const data = await response.json()
      if (data.success) {
        setIsOnline(!isOnline)
      } else {
        alert(data.error || 'Failed to update availability')
      }
    } catch (error) {
      console.error('Error toggling availability:', error)
      alert('Failed to update availability')
    }
  }

  const acceptDelivery = async (deliveryId: string) => {
    setAccepting(deliveryId)
    try {
      const response = await fetch(`/api/driver/accept/${deliveryId}`, { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        fetchDeliveries()
      } else {
        alert(data.error || 'Failed to accept delivery')
      }
    } catch (error) {
      console.error('Error accepting delivery:', error)
      alert('Failed to accept delivery')
    } finally {
      setAccepting(null)
    }
  }

  const updateStatus = async (deliveryId: string, newStatus: 'IN_TRANSIT' | 'DELIVERED') => {
    setUpdatingStatus(deliveryId)
    try {
      const response = await fetch(`/api/driver/status/${deliveryId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await response.json()
      if (data.success) {
        fetchDeliveries()
      } else {
        alert(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'badge-warning'
      case 'PICKED_UP': return 'badge-info'
      case 'IN_TRANSIT': return 'badge-info'
      case 'DELIVERED': return 'badge-success'
      default: return 'badge-info'
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

  if (!isDriver) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center py-12">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-primary mb-2">Not Registered as Driver</h1>
            <p className="text-secondary mb-6">You need to register as a driver to access this dashboard.</p>
            <Link href="/become-driver" className="btn-primary inline-block">Register as Driver</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="section-title">Driver Dashboard</h1>
          <button
            onClick={toggleAvailability}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold transition-all ${
              isOnline ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
            }`}
          >
            {isOnline ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
            {isOnline ? 'Online' : 'Offline'}
          </button>
        </div>

        {/* Verification Banner */}
        {profile && !profile.isDriverVerified && (
          <div className="card mb-6 bg-warning/5 border border-warning/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center mt-1">
                  <Shield className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-warning mb-1">Verification Pending</h3>
                  <p className="text-sm text-secondary">
                    Your driver application is under review. This usually takes 1-2 business days.
                    {profile.applicationStatus === 'REJECTED' && ' Your application was rejected. Please check your email for details.'}
                  </p>
                </div>
              </div>
              <Link href="/become-driver" className="btn-secondary text-sm whitespace-nowrap">
                View Application
              </Link>
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="card mb-6 bg-warning/5 border-warning/20">
            <p className="text-warning text-sm">You are currently offline. Go online to receive delivery assignments.</p>
          </div>
        )}

         {/* Profile Overview */}
         {profile && (
          <div className="card mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-accent-gold/20 flex items-center justify-center">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                  <span className="text-2xl font-bold text-accent-gold">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-secondary">{profile.email}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1 text-secondary">
                      <Phone className="h-3 w-3" />
                      {profile.phone || 'No phone'}
                    </span>
                    <span className="flex items-center gap-1 text-secondary">
                      <Car className="h-3 w-3" />
                      {profile.vehicleMake} {profile.vehicleModel} ({profile.vehicleYear})
                    </span>
                  </div>
                </div>
              </div>
               <div className="flex-1 flex flex-wrap items-center gap-4">
                 <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
                   profile.isDriverVerified ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                 }`}>
                   <Shield className="h-4 w-4" />
                   <span className="font-medium">
                     {profile.isDriverVerified ? 'Verified Driver' : 'Verification Pending'}
                   </span>
                 </div>
                 <Link href="/driver/earnings" className="btn-secondary text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Earnings
                  </Link>
                  <Link href="/driver/payouts" className="btn-secondary text-sm flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Payouts
                  </Link>
                  <Link href="/become-driver" className="btn-secondary text-sm flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </Link>
                  <Link href="/driver/payouts" className="btn-secondary text-sm flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Payouts
                  </Link>
                  <Link href="/become-driver" className="btn-secondary text-sm flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </Link>
               </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
           {stats && [
             { label: 'Total Jobs', value: String(stats.totalJobs), icon: Package, color: 'accent-gold' },
             { label: 'Active', value: String(stats.active), icon: TrendingUp, color: 'info' },
             { label: 'Today', value: String(stats.today), icon: CheckCircle, color: 'success' },
             { label: 'Earnings', value: `$${stats.earnings.toFixed(2)}`, icon: DollarSign, color: 'accent-gold' },
             { label: 'Rating', value: stats.rating.toFixed(1), icon: Star, color: 'accent-gold' },
           ].map((stat) => (
             <div key={stat.label} className="card">
               <div className="flex items-start gap-3 mb-2">
                 <div className={`h-8 w-8 rounded-lg bg-${stat.color}/20 flex items-center justify-center`}>
                   <stat.icon className={`h-4 w-4 text-${stat.color}`} />
                 </div>
                 <div>
                   <p className="text-xs text-secondary">{stat.label}</p>
                   <p className="text-xl font-bold text-primary">{stat.value}</p>
                 </div>
               </div>
             </div>
           ))}
         </div>

        {/* Deliveries */}
        <h2 className="text-xl font-bold text-primary mb-4">Active Deliveries</h2>
        {deliveries.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="h-12 w-12 text-secondary mx-auto mb-4 opacity-50" />
            <p className="text-secondary">{isOnline ? 'No active deliveries. Wait for an assignment!' : 'Go online to receive deliveries.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-primary">{delivery.description}</h3>
                      <span className={`badge ${getStatusColor(delivery.status)}`}>{delivery.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-secondary mb-1">Priority: {delivery.priority}</p>
                    {delivery.distance && <p className="text-sm text-secondary">{delivery.distance.toFixed(1)} km away</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-accent-gold">${delivery.cost.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent-gold/20 flex items-center justify-center mt-1">
                      <MapPin className="h-4 w-4 text-accent-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-secondary font-medium">Pickup ({delivery.pickupAddress.label})</p>
                      <p className="text-sm text-primary">{delivery.pickupAddress.street}, {delivery.pickupAddress.city}, {delivery.pickupAddress.state}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent-teal/20 flex items-center justify-center mt-1">
                      <MapPin className="h-4 w-4 text-accent-teal" />
                    </div>
                    <div>
                      <p className="text-xs text-secondary font-medium">Dropoff ({delivery.dropoffAddress.label})</p>
                      <p className="text-sm text-primary">{delivery.dropoffAddress.street}, {delivery.dropoffAddress.city}, {delivery.dropoffAddress.state}</p>
                    </div>
                  </div>
                </div>

                {delivery.status === 'ASSIGNED' && (
                  <div className="mb-4 p-3 bg-secondary/5 rounded-xl">
                    <p className="text-xs text-secondary font-medium mb-2">Customer</p>
                    <div className="flex items-center gap-4 text-sm">
                      {delivery.customer.phone && (
                        <span className="flex items-center gap-1 text-primary">
                          <Phone size={14} /> {delivery.customer.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-primary">
                        <Mail size={14} /> {delivery.customer.email}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {delivery.status === 'ASSIGNED' && (
                    <button
                      onClick={() => acceptDelivery(delivery.id)}
                      disabled={accepting === delivery.id}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      {accepting === delivery.id ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Accept & Pick Up
                    </button>
                  )}
                  {delivery.status === 'PICKED_UP' && (
                    <button
                      onClick={() => updateStatus(delivery.id, 'IN_TRANSIT')}
                      disabled={updatingStatus === delivery.id}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      {updatingStatus === delivery.id ? <Loader className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                      Start Transit
                    </button>
                  )}
                  {delivery.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => updateStatus(delivery.id, 'DELIVERED')}
                      disabled={updatingStatus === delivery.id}
                      className="btn-primary flex items-center gap-2 text-sm bg-success hover:bg-success/90"
                    >
                      {updatingStatus === delivery.id ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
