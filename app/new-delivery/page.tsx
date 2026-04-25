'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Plus, Loader, MapPin, Trash2, Calculator, Route, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { calculateDistance, calculateDeliveryCost, formatCost } from '@/lib/pricing'

// Dynamically import map components to avoid SSR issues
const AddressPicker = dynamic(() => import('@/components/maps/address-picker'), { ssr: false })

interface Address {
  id: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  label: string
  isDefault: boolean
  latitude?: number | null
  longitude?: number | null
}

export default function NewDeliveryPage() {
  const { isSignedIn, userId } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(true)

   // Form state
   const [formData, setFormData] = useState({
     description: '',
     pickupAddressId: '',
     dropoffAddressId: '',
     tip: '',
     priority: 'NORMAL',
     notes: '',
     weight: '',
     dimensions: '',
   })

  // Distance calculation state
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null)
  const [autoCost, setAutoCost] = useState<number | null>(null)

  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    label: 'Home',
    isDefault: false,
    latitude: null as number | null,
    longitude: null as number | null,
  })

  // Address picker state: holds components from reverse geocoding
  const [pickedAddress, setPickedAddress] = useState<{
    lat: number
    lng: number
    displayName: string
    components: any
  } | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    fetchAddresses()
  }, [isSignedIn, router])

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses')
      const data = await response.json()
      if (data.success) {
        setAddresses(data.data)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setAddressForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }))
    } else {
      setAddressForm((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleMapLocationSelect = (lat: number, lng: number, displayName: string, components: any) => {
    setPickedAddress({ lat, lng, displayName, components })

    // Auto-fill form fields from reverse geocoded components
    if (components) {
      const street = components.road || components.house_number ? `${components.house_number || ''} ${components.road || ''}`.trim() : ''
      setAddressForm((prev) => ({
        ...prev,
        street,
        city: components.city || components.town || components.village || components.county || '',
        state: components.state || '',
        zipCode: components.postcode || '',
        country: components.country || prev.country,
        latitude: lat,
        longitude: lng,
      }))
    } else {
      setAddressForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }))
    }
  }

  // Auto-calculate distance & cost when addresses change
  useEffect(() => {
    if (formData.pickupAddressId && formData.dropoffAddressId) {
      const pickup = addresses.find(a => a.id === formData.pickupAddressId)
      const dropoff = addresses.find(a => a.id === formData.dropoffAddressId)

      if (pickup?.latitude && pickup?.longitude && dropoff?.latitude && dropoff?.longitude) {
        const distance = calculateDistance(
          pickup.latitude,
          pickup.longitude,
          dropoff.latitude,
          dropoff.longitude
        )
        setCalculatedDistance(distance)

        const cost = calculateDeliveryCost(distance, formData.priority)
        setAutoCost(cost)
        setFormData(prev => ({ ...prev, cost: cost.toFixed(2) }))
      }
    } else {
      setCalculatedDistance(null)
      setAutoCost(null)
    }
  }, [formData.pickupAddressId, formData.dropoffAddressId, addresses, formData.priority])

  const handleAddAddress = async () => {
    if (!addressForm.street || !addressForm.city || !addressForm.state || !addressForm.zipCode) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addressForm,
          latitude: addressForm.latitude,
          longitude: addressForm.longitude,
        }),
      })
      const data = await response.json()

      if (data.success) {
        setAddresses((prev) => [...prev, data.data])
        setAddressForm({
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States',
          label: 'Home',
          isDefault: false,
          latitude: null,
          longitude: null,
        })
        setPickedAddress(null)
        setShowAddressForm(false)
        // Auto-select the new address as pickup address if it's the first
        if (formData.pickupAddressId === '') {
          setFormData((prev) => ({
            ...prev,
            pickupAddressId: data.data.id,
          }))
        }
      }
    } catch (error) {
      console.error('Error creating address:', error)
      alert('Failed to create address')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        setAddresses((prev) => prev.filter((addr) => addr.id !== addressId))
        if (formData.pickupAddressId === addressId) {
          setFormData((prev) => ({ ...prev, pickupAddressId: '' }))
        }
        if (formData.dropoffAddressId === addressId) {
          setFormData((prev) => ({ ...prev, dropoffAddressId: '' }))
        }
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      alert('Failed to delete address')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.description || !formData.pickupAddressId || !formData.dropoffAddressId || !autoCost) {
      alert('Please fill in all required fields and select both addresses to calculate cost')
      return
    }

    if (formData.pickupAddressId === formData.dropoffAddressId) {
      alert('Pickup and dropoff addresses cannot be the same')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          pickupAddressId: formData.pickupAddressId,
          dropoffAddressId: formData.dropoffAddressId,
          cost: autoCost, // Use auto-calculated cost
          priority: formData.priority,
          notes: formData.notes || null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          dimensions: formData.dimensions || null,
        }),
      })
      const data = await response.json()

      if (data.success) {
        const deliveryId = data.data.id

        // Initialize payment if there's a tip
        const tipAmount = parseFloat(formData.tip || '0')
        if (tipAmount > 0) {
          try {
            const paymentResponse = await fetch('/api/payments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deliveryId, tipAmount }),
            })
            const paymentData = await paymentResponse.json()
            if (paymentData.success && paymentData.data.redirectUrl) {
              // Redirect to Pesapal for payment
              window.location.href = paymentData.data.redirectUrl
              return // Don't navigate away from this page, let redirect happen
            }
          } catch (paymentErr) {
            console.error('Payment error:', paymentErr)
            // Continue without payment
          }
        }

        alert('Delivery created successfully!')
        router.push(`/deliveries/${deliveryId}`)
      } else {
        alert(data.error || 'Failed to create delivery')
      }
    } catch (error) {
      console.error('Error creating delivery:', error)
      alert('Failed to create delivery')
    } finally {
      setLoading(false)
    }
  }

  if (loadingAddresses) {
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

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/deliveries" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">
          ← Back to Deliveries
        </Link>

        <h1 className="section-title mb-8">Create New Delivery</h1>

        {/* Cost Calculator Preview */}
        {calculatedDistance !== null && autoCost !== null && (
          <div className="card mb-6 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 border-accent-gold/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-accent-gold/20 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-accent-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Cost Estimate</h3>
                <p className="text-xs text-secondary">Based on distance and priority</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Route className="h-4 w-4 text-accent-gold" />
                <span>{calculatedDistance.toFixed(1)} km</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Clock className="h-4 w-4 text-accent-gold" />
                <span>~{Math.round(calculatedDistance / 30)} min</span>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-secondary">
                  <div className="flex justify-between gap-8">
                    <span>Base fare</span>
                    <span className="text-primary">KSh 500.00</span>
                  </div>
                  <div className="flex justify-between gap-8 mt-1">
                    <span>Distance ({calculatedDistance.toFixed(1)} km × KSh 50/km)</span>
                    <span className="text-primary">KSh {(calculatedDistance * 50).toFixed(2)}</span>
                  </div>
                  {formData.priority !== 'NORMAL' && (
                    <div className="flex justify-between gap-8 mt-1">
                      <span>Priority ({formData.priority})</span>
                      <span className="text-accent-gold">×{formData.priority === 'URGENT' ? '1.5' : formData.priority === 'HIGH' ? '1.3' : '0.9'}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-secondary">Total</p>
                  <p className="text-2xl font-bold text-accent-gold">{formatCost(autoCost)}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-secondary mt-3 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Cost updates automatically when addresses or priority change
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Delivery Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-6">Delivery Details</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="description" className="text-sm font-medium text-secondary block mb-2">
                  Description *
                </label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  placeholder="What are you delivering?"
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                  className="input-base w-full"
                />
              </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium text-secondary block mb-2">
                     Delivery Cost (Auto-calculated)
                   </label>
                   <div className="input-base w-full bg-secondary/5 flex items-center justify-between">
                     <span className="text-sm text-secondary">
                       {autoCost !== null ? formatCost(autoCost) : 'Select addresses to calculate'}
                     </span>
                     {autoCost !== null && (
                       <span className="text-xs text-success flex items-center gap-1">
                         <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                         </svg>
                         Calculated
                       </span>
                     )}
                   </div>
                   <p className="text-xs text-secondary mt-1">
                     Cost is automatically calculated based on distance and priority
                   </p>
                 </div>

                <div>
                  <label htmlFor="tip" className="text-sm font-medium text-secondary block mb-2">
                    Optional Tip (KSh)
                  </label>
                  <input
                    id="tip"
                    name="tip"
                    type="number"
                    step="50"
                    placeholder="0.00"
                    value={formData.tip}
                    onChange={handleFormChange}
                    className="input-base w-full"
                  />
                  <p className="text-xs text-secondary mt-1">Thank your driver for great service</p>
                </div>

                <div>
                  <label htmlFor="priority" className="text-sm font-medium text-secondary block mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleFormChange}
                    className="input-base w-full"
                  >
                    <option value="LOW">Low (-10%)</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High (+30%)</option>
                    <option value="URGENT">Urgent (+50%)</option>
                  </select>
                  <p className="text-xs text-secondary mt-1">
                    Urgent deliveries cost 1.5× base rate
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weight" className="text-sm font-medium text-secondary block mb-2">
                    Weight (kg)
                  </label>
                  <input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={formData.weight}
                    onChange={handleFormChange}
                    className="input-base w-full"
                  />
                </div>

                <div>
                  <label htmlFor="dimensions" className="text-sm font-medium text-secondary block mb-2">
                    Dimensions (L×W×H cm)
                  </label>
                  <input
                    id="dimensions"
                    name="dimensions"
                    type="text"
                    placeholder="e.g., 10×10×10"
                    value={formData.dimensions}
                    onChange={handleFormChange}
                    className="input-base w-full"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="text-sm font-medium text-secondary block mb-2">
                  Special Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Any special instructions or requirements..."
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="input-base w-full"
                />
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-primary">Addresses</h2>
              <button
                type="button"
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Plus size={16} />
                Add Address
              </button>
            </div>

             {/* Add Address Form */}
             {showAddressForm && (
               <div className="mb-6 p-4 border border-border rounded-2xl bg-secondary/5">
                 <h3 className="font-medium text-primary mb-4">Add New Address</h3>
                 <div className="space-y-4">
                   {/* Interactive Map for Address Selection */}
                   <div className="mb-4">
                     <AddressPicker
                       onLocationSelect={handleMapLocationSelect}
                       initialLat={pickedAddress?.lat}
                       initialLng={pickedAddress?.lng}
                       className="h-64"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label htmlFor="street" className="text-sm font-medium text-secondary block mb-1">
                         Street
                       </label>
                       <input
                         id="street"
                         name="street"
                         type="text"
                         placeholder="Street address"
                         value={addressForm.street}
                         onChange={handleAddressFormChange}
                         className="input-base w-full"
                       />
                     </div>
                     <div>
                       <label htmlFor="city" className="text-sm font-medium text-secondary block mb-1">
                         City
                       </label>
                       <input
                         id="city"
                         name="city"
                         type="text"
                         placeholder="City"
                         value={addressForm.city}
                         onChange={handleAddressFormChange}
                         className="input-base w-full"
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-3 gap-4">
                     <div>
                       <label htmlFor="state" className="text-sm font-medium text-secondary block mb-1">
                         State
                       </label>
                       <input
                         id="state"
                         name="state"
                         type="text"
                         placeholder="State"
                         value={addressForm.state}
                         onChange={handleAddressFormChange}
                         className="input-base w-full"
                       />
                     </div>
                     <div>
                       <label htmlFor="zipCode" className="text-sm font-medium text-secondary block mb-1">
                         Zip Code
                       </label>
                       <input
                         id="zipCode"
                         name="zipCode"
                         type="text"
                         placeholder="12345"
                         value={addressForm.zipCode}
                         onChange={handleAddressFormChange}
                         className="input-base w-full"
                       />
                     </div>
                     <div>
                       <label htmlFor="country" className="text-sm font-medium text-secondary block mb-1">
                         Country
                       </label>
                       <input
                         id="country"
                         name="country"
                         type="text"
                         placeholder="Country"
                         value={addressForm.country}
                         onChange={handleAddressFormChange}
                         className="input-base w-full"
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label htmlFor="label" className="text-sm font-medium text-secondary block mb-1">
                         Label
                       </label>
                       <select
                         id="label"
                         name="label"
                         value={addressForm.label}
                         onChange={handleAddressFormChange}
                         className="input-base w-full"
                       >
                         <option value="Home">Home</option>
                         <option value="Work">Work</option>
                         <option value="Other">Other</option>
                       </select>
                     </div>
                     <div className="flex items-center">
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input
                           type="checkbox"
                           name="isDefault"
                           checked={addressForm.isDefault}
                           onChange={handleAddressFormChange}
                           className="w-4 h-4 rounded border-border"
                         />
                         <span className="text-sm text-secondary">Set as default</span>
                       </label>
                     </div>
                   </div>

                   <div className="flex gap-2 pt-2">
                     <button
                       type="button"
                       onClick={handleAddAddress}
                       disabled={loading}
                       className="btn-primary flex-1"
                     >
                       {loading ? 'Saving...' : 'Save Address'}
                     </button>
                     <button
                       type="button"
                       onClick={() => {
                         setShowAddressForm(false)
                         setPickedAddress(null)
                         setAddressForm({
                           street: '',
                           city: '',
                           state: '',
                           zipCode: '',
                           country: 'United States',
                           label: 'Home',
                           isDefault: false,
                           latitude: null,
                           longitude: null,
                         })
                       }}
                       className="btn-secondary"
                     >
                       Cancel
                     </button>
                   </div>
                 </div>
               </div>
             )}

             {/* Saved Addresses Selection */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Pickup Address */}
               <div>
                 <label className="text-sm font-medium text-secondary block mb-2">
                   Pickup Address *
                 </label>
                 <div className="space-y-2">
                   {addresses.map((address) => (
                     <label
                       key={address.id}
                       className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                         formData.pickupAddressId === address.id
                           ? 'border-accent-gold bg-accent-gold/5'
                           : 'border-border hover:border-accent-gold/50'
                       }`}
                     >
                       <input
                         type="radio"
                         name="pickupAddressId"
                         value={address.id}
                         checked={formData.pickupAddressId === address.id}
                         onChange={handleFormChange}
                         className="mt-1"
                       />
                       <div className="flex-1">
                         <p className="text-sm font-medium text-primary">
                           {address.label}
                         </p>
                         <p className="text-xs text-secondary">
                           {address.street}, {address.city}, {address.state}
                         </p>
                         {address.latitude && (
                           <p className="text-xs text-success mt-1">
                             ✓ Has location data
                           </p>
                         )}
                       </div>
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation()
                           handleDeleteAddress(address.id)
                         }}
                         className="text-secondary hover:text-error"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                     </label>
                   ))}
                 </div>
               </div>

               {/* Dropoff Address */}
               <div>
                 <label className="text-sm font-medium text-secondary block mb-2">
                   Dropoff Address *
                 </label>
                 <div className="space-y-2">
                   {addresses.map((address) => (
                     <label
                       key={address.id}
                       className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                         formData.dropoffAddressId === address.id
                           ? 'border-accent-teal bg-accent-teal/5'
                           : 'border-border hover:border-accent-teal/50'
                       }`}
                     >
                       <input
                         type="radio"
                         name="dropoffAddressId"
                         value={address.id}
                         checked={formData.dropoffAddressId === address.id}
                         onChange={handleFormChange}
                         className="mt-1"
                       />
                       <div className="flex-1">
                         <p className="text-sm font-medium text-primary">
                           {address.label}
                         </p>
                         <p className="text-xs text-secondary">
                           {address.street}, {address.city}, {address.state}
                         </p>
                         {address.latitude && (
                           <p className="text-xs text-success mt-1">
                             ✓ Has location data
                           </p>
                         )}
                       </div>
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation()
                           handleDeleteAddress(address.id)
                         }}
                         className="text-secondary hover:text-error"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                     </label>
                   ))}
                 </div>
               </div>
             </div>

             {calculatedDistance && (
               <div className="mt-4 p-4 bg-info/5 border border-info/20 rounded-xl">
                 <p className="text-sm text-info">
                   <strong>Distance:</strong> {calculatedDistance.toFixed(2)} km
                   {formData.priority !== 'NORMAL' && (
                     <span className="ml-3">
                       <strong>Priority:</strong> {formData.priority} (×{formData.priority === 'URGENT' ? '1.5' : formData.priority === 'HIGH' ? '1.3' : '0.9'})
                     </span>
                   )}
                 </p>
               </div>
             )}
           </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !autoCost}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  Create Delivery — {formatCost(autoCost || 0)}
                </>
              )}
            </button>
            <Link href="/deliveries" className="btn-secondary">
              Cancel
            </Link>
          </div>

          {!calculatedDistance && (
            <p className="text-xs text-warning text-center">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Please select both pickup and dropoff addresses with location data to calculate distance
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
