'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Search, Loader, CheckCircle, Clock, XCircle, Eye, FileText, Car, User, AlertTriangle, Check, X, ChevronDown } from 'lucide-react'
import Link from 'next/link'

type ApplicationStatus = 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUIRED'

interface DriverDocument {
  id: string
  type: string
  name: string
  url: string
  isVerified: boolean
  rejectionReason?: string
}

  interface DriverDocument {
    id: string
    type: string
    name: string
    url: string
    isVerified: boolean
    rejectionReason?: string
  }

  interface Driver {
    id: string
    clerkId: string
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    licenseNumber: string
    licenseExpiry: string
    vehicleType: string
    vehicleMake?: string
    vehicleModel?: string
    vehicleYear?: number
    vehiclePlate: string
    isDriverVerified: boolean
    isDriverActive: boolean
    driverRating: number
    totalDeliveries: number
    applicationStatus: ApplicationStatus
    onboardingCompleted: boolean
    bio?: string
    yearsOfExperience?: number
    languages: string[]
    driverDocuments?: DriverDocument[]
    createdAt: string
  }

export default function AdminDriversPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      router.push('/sign-in')
      return
    }

    fetchDrivers()
  }, [userId, router])

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers')
      const data = await response.json()
      if (data.success && data.data) {
        setDrivers(data.data.drivers || [])
      } else {
        setDrivers([])
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (driverId: string, approved: boolean, rejectionReason?: string) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, rejectionReason }),
      })
      const data = await response.json()
      if (data.success) {
        fetchDrivers()
        setShowDetails(false)
        setSelectedDriver(null)
      } else {
        alert(data.error || 'Failed to update driver status')
      }
    } catch (error) {
      console.error('Error updating driver:', error)
      alert('Error updating driver status')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${driver.firstName || ''} ${driver.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === 'pending') return matchesSearch && (driver.applicationStatus === 'SUBMITTED' || driver.applicationStatus === 'UNDER_REVIEW')
    if (filterStatus === 'approved') return matchesSearch && driver.applicationStatus === 'APPROVED'
    if (filterStatus === 'rejected') return matchesSearch && driver.applicationStatus === 'REJECTED'
    return matchesSearch
  })

  const getStatusBadge = (status: ApplicationStatus) => {
    const styles = {
      PENDING: 'bg-secondary/10 text-secondary',
      SUBMITTED: 'bg-info/10 text-info',
      UNDER_REVIEW: 'bg-warning/10 text-warning',
      APPROVED: 'bg-success/10 text-success',
      REJECTED: 'bg-error/10 text-error',
      ADDITIONAL_INFO_REQUIRED: 'bg-warning/10 text-warning',
    }

    const icons = {
      PENDING: <Clock className="h-3 w-3" />,
      SUBMITTED: <FileText className="h-3 w-3" />,
      UNDER_REVIEW: <Loader className="h-3 w-3 animate-spin" />,
      APPROVED: <CheckCircle className="h-3 w-3" />,
      REJECTED: <XCircle className="h-3 w-3" />,
      ADDITIONAL_INFO_REQUIRED: <AlertTriangle className="h-3 w-3" />,
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.replace('_', ' ')}
      </span>
    )
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">
          ← Back to Admin Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="section-title mb-0">Driver Applications</h1>
          <div className="text-sm text-secondary">
            Total: {drivers.length} | Pending: {drivers.filter(d => d.applicationStatus === 'SUBMITTED' || d.applicationStatus === 'UNDER_REVIEW').length}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 h-5 w-5 text-secondary" />
            <input
              type="text"
              placeholder="Search by name, email, or license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base w-full pl-12"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
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
        {filteredDrivers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-secondary">No driver applications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDrivers.map((driver) => (
              <div key={driver.id} className="card">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-primary text-lg">
                        {driver.firstName} {driver.lastName}
                      </h3>
                      {getStatusBadge(driver.applicationStatus)}
                    </div>
                    <p className="text-sm text-secondary mb-3">{driver.email}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-secondary text-xs mb-1">License</p>
                        <p className="text-primary font-medium">{driver.licenseNumber}</p>
                      </div>
                      <div>
                        <p className="text-secondary text-xs mb-1">Vehicle</p>
                        <p className="text-primary font-medium">{driver.vehicleMake} {driver.vehicleModel} ({driver.vehicleYear})</p>
                      </div>
                      <div>
                        <p className="text-secondary text-xs mb-1">Plate</p>
                        <p className="text-primary font-medium">{driver.vehiclePlate}</p>
                      </div>
                      <div>
                        <p className="text-secondary text-xs mb-1">Applied</p>
                        <p className="text-primary font-medium">{new Date(driver.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedDriver(driver)
                        setShowDetails(true)
                      }}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Review
                    </button>
                    {driver.applicationStatus === 'SUBMITTED' && (
                      <>
                        <button
                          onClick={() => handleVerify(driver.id, true)}
                          disabled={actionLoading}
                          className="btn-primary bg-success hover:bg-success/90 text-white text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVerify(driver.id, false)}
                          disabled={actionLoading}
                          className="btn-primary bg-error hover:bg-error/90 text-white text-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Driver Details Modal */}
      {showDetails && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-primary-light rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-primary-light border-b border-border p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Driver Application Review</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedDriver(null)
                }}
                className="text-secondary hover:text-primary"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <section>
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-accent-gold" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-secondary/5 rounded-xl text-sm">
                  <div>
                    <p className="text-secondary">Full Name</p>
                    <p className="text-primary font-medium">{selectedDriver.firstName} {selectedDriver.lastName}</p>
                  </div>
                  <div>
                    <p className="text-secondary">Email</p>
                    <p className="text-primary font-medium">{selectedDriver.email}</p>
                  </div>
                  <div>
                    <p className="text-secondary">Phone</p>
                    <p className="text-primary font-medium">{selectedDriver.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-secondary">Experience</p>
                    <p className="text-primary font-medium">{selectedDriver.yearsOfExperience || 0} years</p>
                  </div>
                  <div>
                    <p className="text-secondary">Languages</p>
                    <p className="text-primary font-medium">
                      {selectedDriver.languages ? JSON.parse(selectedDriver.languages).join(', ') : 'N/A'}
                    </p>
                  </div>
                </div>
              </section>

              {/* License Info */}
              <section>
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent-gold" />
                  License Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-secondary/5 rounded-xl text-sm">
                  <div>
                    <p className="text-secondary">License Number</p>
                    <p className="text-primary font-medium">{selectedDriver.licenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-secondary">Expiry Date</p>
                    <p className="text-primary font-medium">{new Date(selectedDriver.licenseExpiry).toLocaleDateString()}</p>
                  </div>
                </div>
              </section>

              {/* Vehicle Info */}
              <section>
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <Car className="h-5 w-5 text-accent-gold" />
                  Vehicle Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/5 rounded-xl text-sm">
                  <div>
                    <p className="text-secondary">Type</p>
                    <p className="text-primary font-medium capitalize">{selectedDriver.vehicleType}</p>
                  </div>
                  <div>
                    <p className="text-secondary">Make/Model</p>
                    <p className="text-primary font-medium">{selectedDriver.vehicleMake} {selectedDriver.vehicleModel}</p>
                  </div>
                  <div>
                    <p className="text-secondary">Year</p>
                    <p className="text-primary font-medium">{selectedDriver.vehicleYear}</p>
                  </div>
                  <div>
                    <p className="text-secondary">Plate</p>
                    <p className="text-primary font-medium">{selectedDriver.vehiclePlate}</p>
                  </div>
                </div>
              </section>

              {/* Documents */}
              <section>
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent-gold" />
                  Uploaded Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedDriver.driverDocuments?.map((doc) => (
                    <div key={doc.id} className="border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-primary text-sm">{doc.name}</span>
                        {doc.isVerified ? (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <Check className="h-3 w-3" /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-warning">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-gold hover:text-accent-gold-light text-sm flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        View Document
                      </a>
                      {doc.rejectionReason && (
                        <p className="text-xs text-error mt-2">Rejected: {doc.rejectionReason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Bio */}
              {selectedDriver.bio && (
                <section>
                  <h3 className="font-semibold text-primary mb-3">About</h3>
                  <p className="text-secondary text-sm bg-secondary/5 p-4 rounded-xl">{selectedDriver.bio}</p>
                </section>
              )}

              {/* Actions */}
              {selectedDriver.applicationStatus === 'SUBMITTED' && (
                <div className="border-t border-border pt-6 flex gap-4">
                  <button
                    onClick={() => handleVerify(selectedDriver.id, true)}
                    disabled={actionLoading}
                    className="btn-primary bg-success hover:bg-success/90 text-white flex-1 flex items-center justify-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Approve Application
                  </button>
                  <button
                    onClick={() => handleVerify(selectedDriver.id, false)}
                    disabled={actionLoading}
                    className="btn-primary bg-error hover:bg-error/90 text-white flex-1 flex items-center justify-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Reject Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
