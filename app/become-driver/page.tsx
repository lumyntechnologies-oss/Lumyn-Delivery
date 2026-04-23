'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Loader, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface DriverProfile {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  licenseNumber: string
  vehicleType: string
  vehiclePlate: string
  isDriverVerified: boolean
  isDriverActive: boolean
  driverRating: number
  totalDeliveries: number
}

export default function BecomeDriverPage() {
  const { isSignedIn, userId } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [existingDriver, setExistingDriver] = useState<DriverProfile | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    licenseNumber: '',
    licenseExpiry: '',
    vehicleType: 'sedan',
    vehiclePlate: '',
  })

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    checkExistingDriver()
  }, [isSignedIn, router])

  const checkExistingDriver = async () => {
    try {
      const response = await fetch('/api/drivers/profile')
      const data = await response.json()
      if (data.success) {
        setExistingDriver(data.data)
      }
    } catch (error) {
      console.error('Error checking driver profile:', error)
    } finally {
      setCheckingExisting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.licenseNumber ||
      !formData.licenseExpiry ||
      !formData.vehicleType ||
      !formData.vehiclePlate
    ) {
      alert('Please fill in all required fields')
      return
    }

    // Validate license expiry is in the future
    const expiryDate = new Date(formData.licenseExpiry)
    if (expiryDate < new Date()) {
      alert('License expiry date must be in the future')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        setTimeout(() => {
          router.push('/driver-dashboard')
        }, 2000)
      } else {
        alert(data.error || 'Failed to register as driver')
      }
    } catch (error) {
      console.error('Error registering as driver:', error)
      alert('Failed to register as driver')
    } finally {
      setLoading(false)
    }
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader className="h-8 w-8 text-accent-gold animate-spin" />
        </div>
      </div>
    )
  }

  // Already a driver
  if (existingDriver) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/driver-dashboard" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">
            ← Go to Dashboard
          </Link>

          <div className="card text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">You&apos;re Already a Driver!</h1>
             <p className="text-secondary mb-6">
               Your driver profile is registered and{' '}
               {existingDriver.isDriverVerified ? 'verified' : 'pending verification'}
             </p>
            <div className="bg-secondary/5 rounded-2xl p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-secondary font-medium mb-1">License</p>
                  <p className="text-primary font-semibold">{existingDriver.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-secondary font-medium mb-1">Vehicle</p>
                  <p className="text-primary font-semibold">{existingDriver.vehicleType}</p>
                </div>
                <div>
                  <p className="text-secondary font-medium mb-1">Plate</p>
                  <p className="text-primary font-semibold">{existingDriver.vehiclePlate}</p>
                </div>
                 <div>
                   <p className="text-secondary font-medium mb-1">Status</p>
                   <span className={`badge ${existingDriver.isDriverVerified ? 'badge-success' : 'badge-warning'}`}>
                     {existingDriver.isDriverVerified ? 'Verified' : 'Pending'}
                   </span>
                 </div>
              </div>
            </div>
            <Link href="/driver-dashboard" className="btn-primary inline-block">
              Go to Driver Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="card text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">Registration Submitted!</h1>
            <p className="text-secondary">
              Welcome to the Lumyn driver network. Your profile is under review and will be verified shortly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="section-title mb-2">Become a Lumyn Driver</h1>
        <p className="text-secondary mb-8">Register as a driver and start earning with Lumyn</p>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* License Information */}
          <div>
            <h2 className="text-lg font-semibold text-primary mb-4">License Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="licenseNumber" className="text-sm font-medium text-secondary block mb-2">
                  License Number *
                </label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  placeholder="e.g., DL123456"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  required
                  className="input-base w-full"
                />
              </div>

              <div>
                <label htmlFor="licenseExpiry" className="text-sm font-medium text-secondary block mb-2">
                  License Expiry Date *
                </label>
                <input
                  id="licenseExpiry"
                  name="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={handleInputChange}
                  required
                  className="input-base w-full"
                />
                <p className="text-xs text-secondary mt-1">Must be valid and not expired</p>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="pt-4 border-t border-border">
            <h2 className="text-lg font-semibold text-primary mb-4">Vehicle Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="vehicleType" className="text-sm font-medium text-secondary block mb-2">
                  Vehicle Type *
                </label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  required
                  className="input-base w-full"
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="scooter">Scooter</option>
                </select>
              </div>

              <div>
                <label htmlFor="vehiclePlate" className="text-sm font-medium text-secondary block mb-2">
                  Vehicle License Plate *
                </label>
                <input
                  id="vehiclePlate"
                  name="vehiclePlate"
                  type="text"
                  placeholder="e.g., ABC123XYZ"
                  value={formData.vehiclePlate}
                  onChange={handleInputChange}
                  required
                  className="input-base w-full"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="pt-4 border-t border-border bg-info/5 rounded-2xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div className="text-sm text-info">
                <p className="font-medium mb-2">Requirements:</p>
                <ul className="space-y-1 text-xs opacity-90">
                  <li>Valid driver's license (not expired)</li>
                  <li>Vehicle properly registered and insured</li>
                  <li>Vehicle safety inspection passed</li>
                  <li>Background check will be performed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Registering...' : 'Register as Driver'}
            </button>
            <Link href="/" className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
