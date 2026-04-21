'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Plus, Loader, MapPin, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Address {
  id: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  label: string
  isDefault: boolean
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
    cost: '',
    priority: 'NORMAL',
    notes: '',
    weight: '',
    dimensions: '',
  })

  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    label: 'Home',
    isDefault: false,
  })

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
        body: JSON.stringify(addressForm),
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
        })
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

    if (!formData.description || !formData.pickupAddressId || !formData.dropoffAddressId || !formData.cost) {
      alert('Please fill in all required fields')
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
          cost: parseFloat(formData.cost),
          priority: formData.priority,
          notes: formData.notes || null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          dimensions: formData.dimensions || null,
        }),
      })
      const data = await response.json()

      if (data.success) {
        alert('Delivery created successfully!')
        router.push(`/deliveries/${data.data.id}`)
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
                  <label htmlFor="cost" className="text-sm font-medium text-secondary block mb-2">
                    Cost ($) *
                  </label>
                  <input
                    id="cost"
                    name="cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={handleFormChange}
                    required
                    className="input-base w-full"
                  />
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
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
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
                    Dimensions (L×W×H)
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
                        ZIP Code
                      </label>
                      <input
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        placeholder="ZIP"
                        value={addressForm.zipCode}
                        onChange={handleAddressFormChange}
                        className="input-base w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="label" className="text-sm font-medium text-secondary block mb-1">
                        Label
                      </label>
                      <input
                        id="label"
                        name="label"
                        type="text"
                        placeholder="e.g., Home"
                        value={addressForm.label}
                        onChange={handleAddressFormChange}
                        className="input-base w-full"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleAddAddress}
                      disabled={loading}
                      className="btn-primary text-sm"
                    >
                      {loading ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Address List */}
            {addresses.length === 0 ? (
              <p className="text-secondary text-sm mb-6">No addresses yet. Create one to get started.</p>
            ) : (
              <div className="mb-6 space-y-3">
                {addresses.map((address) => (
                  <div key={address.id} className="p-4 border border-border rounded-2xl flex items-start justify-between hover:bg-secondary/5 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={16} className="text-accent-gold" />
                        <p className="font-medium text-primary">{address.label}</p>
                        {address.isDefault && <span className="badge badge-info text-xs">Default</span>}
                      </div>
                      <p className="text-sm text-secondary">
                        {address.street}, {address.city}, {address.state} {address.zipCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(address.id)}
                      className="p-2 hover:bg-error/10 rounded-lg transition text-error"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pickup Address */}
            <div className="mb-4">
              <label htmlFor="pickupAddressId" className="text-sm font-medium text-secondary block mb-2">
                Pickup Address *
              </label>
              <select
                id="pickupAddressId"
                name="pickupAddressId"
                value={formData.pickupAddressId}
                onChange={handleFormChange}
                required
                className="input-base w-full"
              >
                <option value="">Select pickup address</option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label} - {address.city}, {address.state}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropoff Address */}
            <div>
              <label htmlFor="dropoffAddressId" className="text-sm font-medium text-secondary block mb-2">
                Dropoff Address *
              </label>
              <select
                id="dropoffAddressId"
                name="dropoffAddressId"
                value={formData.dropoffAddressId}
                onChange={handleFormChange}
                required
                className="input-base w-full"
              >
                <option value="">Select dropoff address</option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label} - {address.city}, {address.state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Delivery'}
            </button>
            <Link href="/deliveries" className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
