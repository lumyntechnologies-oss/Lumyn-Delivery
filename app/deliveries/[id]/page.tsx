'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { ReviewForm } from '@/components/review-form'
import { MapPin, Phone, Mail, Calendar, Package, AlertCircle, CheckCircle, Clock, Loader, Navigation, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { LiveMap } from '@/components/maps/live-map'

interface Delivery {
  id: string
  description: string
  status: string
  priority: string
  cost: number
  tip: number
  notes?: string
  weight?: number
  dimensions?: string
  createdAt: string
  pickupTime?: string
  deliveryTime?: string
  distance?: number
  customer: {
    firstName?: string
    lastName?: string
    email: string
    phone?: string
  }
  driver?: {
    id: string
    firstName?: string
    lastName?: string
    email: string
    phone?: string
    driverRating: number
    licenseNumber: string
  }
  pickupAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    label: string
    latitude?: number | null
    longitude?: number | null
  }
  dropoffAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    label: string
    latitude?: number | null
    longitude?: number | null
  }
  review?: {
    rating: number
    comment?: string
  }
}

const statusSteps = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED']

export default function DeliveryDetailPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const params = useParams()
  const deliveryId = params.id as string

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [tip, setTip] = useState('0')
  const [connected, setConnected] = useState(false)
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number
    longitude: number
    lastLocationUpdate?: string | null
  } | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    // Initial fetch
    fetchDelivery()

    // Connect SSE for delivery updates
    const eventSource = new EventSource(`/api/track/${deliveryId}`)
    
    eventSource.onopen = () => setConnected(true)
    
    eventSource.addEventListener('delivery', (event) => {
      try {
        const data = JSON.parse(event.data)
        setDelivery(prev => prev ? { ...prev, ...data } : data)
      } catch (err) {
        console.error('Failed to parse delivery event:', err)
      }
    })

    eventSource.onerror = () => {
      setConnected(false)
      eventSource.close()
    }

    return () => eventSource.close()
  }, [isSignedIn, deliveryId])

  // Separate effect for polling driver location when driver assigned
  useEffect(() => {
    const driverId = delivery?.driver?.id
    if (!driverId) {
      setDriverLocation(null)
      return
    }

    const fetchLocation = async () => {
      try {
        const res = await fetch(`/api/driver/location?driverId=${driverId}`)
        const data = await res.json()
        if (data.success && data.data.latitude != null && data.data.longitude != null) {
          setDriverLocation({
            latitude: data.data.latitude,
            longitude: data.data.longitude,
          })
        }
      } catch (err) {
        console.error('Error fetching driver location:', err)
      }
    }

    fetchLocation()
    const interval = setInterval(fetchLocation, 3000)
    return () => clearInterval(interval)
  }, [delivery?.driver?.id])

  const fetchDelivery = async () => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`)
      const data = await response.json()
      if (data.success) {
        setDelivery(data.data)
      }
    } catch (error) {
      console.error('Error fetching delivery:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-info'
      case 'ASSIGNED': return 'text-warning'
      case 'PICKED_UP': return 'text-warning'
      case 'IN_TRANSIT': return 'text-info'
      case 'DELIVERED': return 'text-success'
      case 'CANCELLED': return 'text-error'
      case 'FAILED': return 'text-error'
      default: return 'text-secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <CheckCircle className="h-5 w-5" />
      case 'PENDING': case 'ASSIGNED': case 'PICKED_UP': case 'IN_TRANSIT': return <Clock className="h-5 w-5" />
      case 'CANCELLED': case 'FAILED': return <AlertCircle className="h-5 w-5" />
      default: return <Clock className="h-5 w-5" />
    }
  }

  const handleAddTip = async () => {
    if (!tip || parseFloat(tip) <= 0) {
      alert('Please enter a valid tip amount')
      return
    }
    setUpdating(true)
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tip: parseFloat(tip) }),
      })
      const data = await response.json()
      if (data.success) {
        setDelivery(data.data)
        alert('Tip added!')
      } else {
        alert(data.error || 'Failed to add tip')
      }
    } catch (error) {
      console.error('Error adding tip:', error)
      alert('Failed to add tip')
    } finally {
      setUpdating(false)
      setTip('0')
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

  if (!delivery) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/deliveries" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">← Back</Link>
          <div className="card text-center py-12"><p className="text-secondary">Delivery not found</p></div>
        </div>
      </div>
    )
  }

  const currentStatusIndex = statusSteps.indexOf(delivery.status)

  // Check if we can show live map (driver assigned + coordinates available)
  const canShowMap = !!(
    delivery.driver &&
    delivery.pickupAddress.latitude != null &&
    delivery.dropoffAddress.latitude != null
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/deliveries" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">← Back to Deliveries</Link>

        {/* Header */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-primary mb-2">{delivery.description}</h1>
              <p className="text-sm text-secondary">Delivery ID: {delivery.id}</p>
              <div className="flex items-center gap-2 mt-2">
                {connected ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-secondary" />}
                <span className="text-xs text-secondary">{connected ? 'Live' : 'Offline'}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`flex items-center gap-2 font-semibold ${getStatusColor(delivery.status)}`}>
                {getStatusIcon(delivery.status)}
                <span>{delivery.status.replace('_', ' ')}</span>
              </div>
              <p className="text-2xl font-bold text-accent-gold">${delivery.cost.toFixed(2)}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-secondary mb-4">Delivery Progress</h3>
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    index <= currentStatusIndex ? 'bg-accent-gold text-primary' : 'bg-secondary/10 text-secondary'
                  }`}>
                    {index < currentStatusIndex ? '✓' : index + 1}
                  </div>
                  <p className="text-xs text-secondary mt-2 text-center">{step.replace('_', ' ')}</p>
                  {index < statusSteps.length - 1 && (
                    <div className={`h-1 flex-1 mt-2 ${index < currentStatusIndex ? 'bg-accent-gold' : 'bg-secondary/10'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Map Section */}
        {canShowMap && (
          <div className="card mb-6 overflow-hidden">
            <h3 className="font-semibold text-primary mb-4">Live Tracking</h3>
            <LiveMap
              pickupLocation={{ 
                latitude: delivery.pickupAddress.latitude!, 
                longitude: delivery.pickupAddress.longitude! 
              }}
              dropoffLocation={{ 
                latitude: delivery.dropoffAddress.latitude!, 
                longitude: delivery.dropoffAddress.longitude! 
              }}
              driverLocation={driverLocation}
              driverName={delivery.driver?.firstName}
              className="h-96 w-full"
            />
          </div>
        )}

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pickup */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-accent-gold/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-accent-gold" />
                </div>
                <h3 className="font-semibold text-primary">Pickup Location</h3>
              </div>
              <p className="text-sm font-medium text-secondary mb-2">{delivery.pickupAddress.label}</p>
              <p className="text-primary font-medium">{delivery.pickupAddress.street}</p>
              <p className="text-secondary text-sm">{delivery.pickupAddress.city}, {delivery.pickupAddress.state} {delivery.pickupAddress.zipCode}</p>
              {delivery.pickupTime && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-secondary font-medium mb-1">Pickup Time</p>
                  <p className="text-primary font-medium">{new Date(delivery.pickupTime).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Dropoff */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-accent-teal/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-accent-teal" />
                </div>
                <h3 className="font-semibold text-primary">Dropoff Location</h3>
              </div>
              <p className="text-sm font-medium text-secondary mb-2">{delivery.dropoffAddress.label}</p>
              <p className="text-primary font-medium">{delivery.dropoffAddress.street}</p>
              <p className="text-secondary text-sm">{delivery.dropoffAddress.city}, {delivery.dropoffAddress.state} {delivery.dropoffAddress.zipCode}</p>
              {delivery.deliveryTime && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-secondary font-medium mb-1">Delivery Time</p>
                  <p className="text-primary font-medium">{new Date(delivery.deliveryTime).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Package Details */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-info/20 flex items-center justify-center">
                  <Package className="h-5 w-5 text-info" />
                </div>
                <h3 className="font-semibold text-primary">Package Details</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-secondary font-medium mb-1">Priority</p>
                  <span className="badge badge-warning">{delivery.priority}</span>
                </div>
                {delivery.weight && (
                  <div>
                    <p className="text-xs text-secondary font-medium mb-1">Weight</p>
                    <p className="text-primary font-medium">{delivery.weight} kg</p>
                  </div>
                )}
                {delivery.dimensions && (
                  <div>
                    <p className="text-xs text-secondary font-medium mb-1">Dimensions</p>
                    <p className="text-primary font-medium">{delivery.dimensions}</p>
                  </div>
                )}
              </div>
              {delivery.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-secondary font-medium mb-2">Special Notes</p>
                  <p className="text-primary text-sm">{delivery.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Driver Info */}
            {delivery.driver ? (
              <div className="card">
                <h3 className="font-semibold text-primary mb-4">Driver</h3>
                <div className="h-12 w-12 rounded-full bg-accent-gold/20 flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-accent-gold">
                    {delivery.driver.firstName?.[0]}{delivery.driver.lastName?.[0]}
                  </span>
                </div>
                <p className="font-medium text-primary">{delivery.driver.firstName} {delivery.driver.lastName}</p>
                <div className="flex items-center gap-1 mt-1 mb-3">
                  <span className="text-sm">⭐</span>
                  <span className="text-sm font-medium text-secondary">{delivery.driver.driverRating.toFixed(1)} rating</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-secondary hover:text-primary transition">
                    <Mail size={16} /><a href={`mailto:${delivery.driver.email}`}>{delivery.driver.email}</a>
                  </div>
                  {delivery.driver.phone && (
                    <div className="flex items-center gap-2 text-secondary hover:text-primary transition">
                      <Phone size={16} /><a href={`tel:${delivery.driver.phone}`}>{delivery.driver.phone}</a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card text-center py-8">
                <Clock className="h-8 w-8 text-secondary mx-auto mb-3 opacity-50" />
                <p className="text-secondary text-sm">Waiting for driver assignment</p>
              </div>
            )}

            {/* Pricing */}
            <div className="card">
              <h3 className="font-semibold text-primary mb-4">Pricing</h3>
              <div className="space-y-3">
                <div className="flex justify-between pb-3 border-b border-border"><p className="text-secondary">Delivery Cost</p><p className="font-medium text-primary">${delivery.cost.toFixed(2)}</p></div>
                <div className="flex justify-between pb-3 border-b border-border"><p className="text-secondary">Tip</p><p className="font-medium text-primary">${delivery.tip.toFixed(2)}</p></div>
                <div className="flex justify-between font-semibold"><p className="text-primary">Total</p><p className="text-lg text-accent-gold">${(delivery.cost + delivery.tip).toFixed(2)}</p></div>
              </div>
              {delivery.status === 'DELIVERED' && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <p className="text-xs font-medium text-secondary">Add a tip for great service</p>
                  <div className="flex gap-2">
                    <input type="number" placeholder="0.00" value={tip} onChange={e => setTip(e.target.value)} className="input-base flex-1" step="0.50" min="0" />
                    <button onClick={handleAddTip} disabled={updating} className="btn-primary">{updating ? 'Adding...' : 'Add'}</button>
                  </div>
                </div>
              )}
            </div>

            {/* Review */}
            {delivery.review ? (
              <div className="card">
                <h3 className="font-semibold text-primary mb-4">Your Review</h3>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < delivery.review!.rating ? 'text-lg' : 'text-lg opacity-30'}>⭐</span>
                  ))}
                </div>
                {delivery.review.comment && <p className="text-sm text-secondary">{delivery.review.comment}</p>}
              </div>
            ) : delivery.status === 'DELIVERED' ? (
              <ReviewForm deliveryId={delivery.id} onSubmit={fetchDelivery} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
