'use client'

import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Loader, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, FileText, Car, User, Shield, Upload, Truck } from 'lucide-react'
import Image from 'next/image'

type OnboardingStep = 'welcome' | 'license' | 'vehicle' | 'documents' | 'review' | 'complete'

interface FormData {
  // License
  licenseNumber: string
  licenseExpiry: string
  // Vehicle
  vehicleType: string
  vehicleMake: string
  vehicleModel: string
  vehicleYear: string
  vehiclePlate: string
  vehicleColor: string
  // Personal
  phone: string
  bio: string
  yearsOfExperience: string
  languages: string[]
  // Documents
  idCardUrl: string
  driversLicenseUrl: string
  vehicleRegistrationUrl: string
  insuranceCertificateUrl: string
  profilePhotoUrl: string
}

export default function DriverOnboardingPage() {
  const { isSignedIn, userId, isLoaded } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    licenseNumber: '',
    licenseExpiry: '',
    vehicleType: 'sedan',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehiclePlate: '',
    vehicleColor: '',
    phone: '',
    bio: '',
    yearsOfExperience: '',
    languages: [],
    idCardUrl: '',
    driversLicenseUrl: '',
    vehicleRegistrationUrl: '',
    insuranceCertificateUrl: '',
    profilePhotoUrl: '',
  })

  const steps: { key: OnboardingStep; label: string; icon: any }[] = [
    { key: 'welcome', label: 'Welcome', icon: User },
    { key: 'license', label: 'License', icon: FileText },
    { key: 'vehicle', label: 'Vehicle', icon: Car },
    { key: 'documents', label: 'Documents', icon: Upload },
    { key: 'review', label: 'Review', icon: Shield },
    { key: 'complete', label: 'Complete', icon: CheckCircle },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === currentStep)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    // Check if already a driver
    checkDriverStatus()
  }, [isLoaded, isSignedIn, router])

  const checkDriverStatus = async () => {
    try {
      const res = await fetch('/api/drivers/profile')
      const data = await res.json()
      if (data.success) {
        // Already a driver, redirect to dashboard
        router.push('/driver-dashboard')
      }
    } catch (error) {
      // Not a driver yet, continue with onboarding
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }))
  }

  const handleFileUpload = async (type: keyof FormData, file: File) => {
    setUploading(type)
    const formDataObj = new FormData()
    formDataObj.append('file', file)
    formDataObj.append('type', type)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj,
      })
      const data = await res.json()
      if (data.success) {
        setFormData(prev => ({ ...prev, [type]: data.url }))
      } else {
        setErrors(prev => ({ ...prev, [type]: data.error || 'Upload failed' }))
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [type]: 'Upload failed' }))
    } finally {
      setUploading(null)
    }
  }

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 'license':
        if (!formData.licenseNumber) newErrors.licenseNumber = 'License number is required'
        if (!formData.licenseExpiry) newErrors.licenseExpiry = 'License expiry is required'
        const expiry = new Date(formData.licenseExpiry)
        if (expiry < new Date()) newErrors.licenseExpiry = 'License must not be expired'
        break

      case 'vehicle':
        if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required'
        if (!formData.vehicleMake) newErrors.vehicleMake = 'Vehicle make is required'
        if (!formData.vehicleModel) newErrors.vehicleModel = 'Vehicle model is required'
        if (!formData.vehicleYear) newErrors.vehicleYear = 'Vehicle year is required'
        if (!formData.vehiclePlate) newErrors.vehiclePlate = 'License plate is required'
        break

      case 'documents':
        if (!formData.idCardUrl) newErrors.idCardUrl = 'ID card is required'
        if (!formData.driversLicenseUrl) newErrors.driversLicenseUrl = 'Driver\'s license photo is required'
        if (!formData.vehicleRegistrationUrl) newErrors.vehicleRegistrationUrl = 'Vehicle registration is required'
        if (!formData.insuranceCertificateUrl) newErrors.insuranceCertificateUrl = 'Insurance certificate is required'
        if (!formData.profilePhotoUrl) newErrors.profilePhotoUrl = 'Profile photo is required'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (!validateStep()) return
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key)
    }
  }

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key)
    }
  }

  const submitApplication = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/drivers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        setCurrentStep('complete')
      } else {
        alert(data.error || 'Failed to submit application')
      }
    } catch (error) {
      alert('Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) {
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

      {/* Progress Bar */}
      <div className="bg-white dark:bg-primary-light border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = index < currentStepIndex
              const isCurrent = index === currentStepIndex

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-success text-white'
                          : isCurrent
                          ? 'bg-accent-gold text-white'
                          : 'bg-secondary/10 text-secondary'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-xs mt-2 ${isCurrent ? 'text-accent-gold font-medium' : 'text-secondary'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-success' : 'bg-secondary/20'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'welcome' && (
          <div className="card">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-teal/20 mb-6">
                <Truck className="h-10 w-10 text-accent-teal" />
              </div>
              <h1 className="text-3xl font-bold text-primary mb-4">Become a Lumyn Driver</h1>
              <p className="text-secondary mb-8 max-w-lg mx-auto">
                Complete the following steps to join our driver network. You'll need to provide your license information,
                vehicle details, and upload required documents for verification.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                {[
                  { title: 'Quick', desc: 'Onboarding takes ~10 minutes' },
                  { title: 'Secure', desc: 'Your data is encrypted' },
                  { title: 'Free', desc: 'No hidden fees or charges' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-info/5">
                    <p className="font-semibold text-primary">{item.title}</p>
                    <p className="text-sm text-secondary">{item.desc}</p>
                  </div>
                ))}
              </div>

              <button onClick={nextStep} className="btn-primary mt-8 px-8">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'license' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">License Information</h2>
              <p className="text-secondary">Please provide your valid driver's license details</p>
            </div>

            <div className="card space-y-4">
              <div>
                <label className="text-sm font-medium text-secondary block mb-2">
                  License Number *
                </label>
                <input
                  name="licenseNumber"
                  type="text"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className={`input-base w-full ${errors.licenseNumber ? 'border-error' : ''}`}
                  placeholder="e.g., DL123456"
                />
                {errors.licenseNumber && <p className="text-error text-xs mt-1">{errors.licenseNumber}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-secondary block mb-2">
                  License Expiry Date *
                </label>
                <input
                  name="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={handleInputChange}
                  className={`input-base w-full ${errors.licenseExpiry ? 'border-error' : ''}`}
                />
                {errors.licenseExpiry && <p className="text-error text-xs mt-1">{errors.licenseExpiry}</p>}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="btn-secondary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
              <button onClick={nextStep} className="btn-primary">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'vehicle' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">Vehicle Information</h2>
              <p className="text-secondary">Tell us about the vehicle you'll be using for deliveries</p>
            </div>

            <div className="card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-secondary block mb-2">
                    Vehicle Type *
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className={`input-base w-full ${errors.vehicleType ? 'border-error' : ''}`}
                  >
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="scooter">Scooter</option>
                  </select>
                  {errors.vehicleType && <p className="text-error text-xs mt-1">{errors.vehicleType}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary block mb-2">
                    Vehicle Make *
                  </label>
                  <input
                    name="vehicleMake"
                    type="text"
                    value={formData.vehicleMake}
                    onChange={handleInputChange}
                    className={`input-base w-full ${errors.vehicleMake ? 'border-error' : ''}`}
                    placeholder="e.g., Toyota"
                  />
                  {errors.vehicleMake && <p className="text-error text-xs mt-1">{errors.vehicleMake}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary block mb-2">
                    Vehicle Model *
                  </label>
                  <input
                    name="vehicleModel"
                    type="text"
                    value={formData.vehicleModel}
                    onChange={handleInputChange}
                    className={`input-base w-full ${errors.vehicleModel ? 'border-error' : ''}`}
                    placeholder="e.g., Camry"
                  />
                  {errors.vehicleModel && <p className="text-error text-xs mt-1">{errors.vehicleModel}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary block mb-2">
                    Vehicle Year *
                  </label>
                  <input
                    name="vehicleYear"
                    type="number"
                    value={formData.vehicleYear}
                    onChange={handleInputChange}
                    className={`input-base w-full ${errors.vehicleYear ? 'border-error' : ''}`}
                    placeholder="e.g., 2020"
                  />
                  {errors.vehicleYear && <p className="text-error text-xs mt-1">{errors.vehicleYear}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-secondary block mb-2">
                    License Plate *
                  </label>
                  <input
                    name="vehiclePlate"
                    type="text"
                    value={formData.vehiclePlate}
                    onChange={handleInputChange}
                    className={`input-base w-full ${errors.vehiclePlate ? 'border-error' : ''}`}
                    placeholder="e.g., ABC123XYZ"
                  />
                  {errors.vehiclePlate && <p className="text-error text-xs mt-1">{errors.vehiclePlate}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-secondary block mb-2">
                    Vehicle Color
                  </label>
                  <input
                    name="vehicleColor"
                    type="text"
                    value={formData.vehicleColor}
                    onChange={handleInputChange}
                    className="input-base w-full"
                    placeholder="e.g., Silver"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="btn-secondary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
              <button onClick={nextStep} className="btn-primary">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'documents' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">Required Documents</h2>
              <p className="text-secondary">Please upload clear photos or scans of the following documents</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'idCard', name: 'idCardUrl', label: 'National ID Card', desc: 'Front and back' },
                { key: 'driversLicense', name: 'driversLicenseUrl', label: 'Driver\'s License', desc: 'Front side' },
                { key: 'vehicleRegistration', name: 'vehicleRegistrationUrl', label: 'Vehicle Registration', desc: 'Valid certificate' },
                { key: 'insuranceCertificate', name: 'insuranceCertificateUrl', label: 'Insurance Certificate', desc: 'Current coverage' },
                { key: 'profilePhoto', name: 'profilePhotoUrl', label: 'Profile Photo', desc: 'Clear headshot' },
              ].map((doc) => (
                <div key={doc.key} className="card">
                  <label className="text-sm font-medium text-secondary block mb-3">{doc.label}</label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      formData[doc.name as keyof FormData]
                        ? 'border-success bg-success/5'
                        : 'border-border hover:border-accent-gold'
                    }`}
                  >
                    {formData[doc.name as keyof FormData] ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="h-8 w-8 text-success mb-2" />
                        <span className="text-sm text-success font-medium">Uploaded</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-secondary mb-2" />
                        <span className="text-sm text-secondary">Click to upload</span>
                        <span className="text-xs text-secondary/70 mt-1">{doc.desc}</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(doc.name as keyof FormData, file)
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  {uploading === doc.name && (
                    <p className="text-xs text-accent-gold mt-2 flex items-center justify-center gap-1">
                      <Loader className="h-3 w-3 animate-spin" /> Uploading...
                    </p>
                  )}
                  {errors[doc.name] && <p className="text-error text-xs mt-2">{errors[doc.name]}</p>}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="btn-secondary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
              <button onClick={nextStep} className="btn-primary">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">Review Your Application</h2>
              <p className="text-secondary">Please verify all information before submitting</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* License Info */}
              <div className="card">
                <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent-gold" />
                  License
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary">Number:</span>
                    <span className="text-primary font-medium">{formData.licenseNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Expiry:</span>
                    <span className="text-primary font-medium">{new Date(formData.licenseExpiry).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="card">
                <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                  <Car className="h-5 w-5 text-accent-gold" />
                  Vehicle
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary">Type:</span>
                    <span className="text-primary font-medium capitalize">{formData.vehicleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Make/Model:</span>
                    <span className="text-primary font-medium">{formData.vehicleMake} {formData.vehicleModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Year:</span>
                    <span className="text-primary font-medium">{formData.vehicleYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Plate:</span>
                    <span className="text-primary font-medium">{formData.vehiclePlate}</span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="card md:col-span-2">
                <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-accent-gold" />
                  Documents
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { key: 'idCardUrl', label: 'ID Card' },
                    { key: 'driversLicenseUrl', label: 'Driver License' },
                    { key: 'vehicleRegistrationUrl', label: 'Vehicle Reg' },
                    { key: 'insuranceCertificateUrl', label: 'Insurance' },
                    { key: 'profilePhotoUrl', label: 'Profile Photo' },
                  ].map(doc => (
                    <div key={doc.key} className="flex items-center gap-2 text-sm">
                      {formData[doc.key as keyof FormData] ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-error" />
                      )}
                      <span className={formData[doc.key as keyof FormData] ? 'text-success' : 'text-error'}>
                        {doc.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm text-warning">
                <p className="font-medium mb-1">Before you submit:</p>
                <ul className="list-disc list-inside space-y-1 opacity-90 text-xs">
                  <li>Ensure all documents are clear and legible</li>
                  <li>Information must match your official documents</li>
                  <li>Application review takes 1-2 business days</li>
                  <li>You'll be notified via email once verified</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="btn-secondary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
              <button
                onClick={submitApplication}
                disabled={loading}
                className="btn-primary bg-accent-teal hover:bg-accent-teal-light"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="card text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-4">Application Submitted!</h1>
            <p className="text-secondary max-w-md mx-auto mb-6">
              Thank you for applying to become a Lumyn driver. Your application is now under review.
              We'll notify you by email once your verification is complete.
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Loader className="h-4 w-4 animate-spin text-accent-gold" />
                Review in progress
              </div>
            </div>
            <div className="mt-8 p-4 bg-info/5 rounded-xl max-w-md mx-auto">
              <p className="text-sm text-info">
                <strong>What's next?</strong><br />
                Our team will verify your documents within 1-2 business days. You can check your status
                in the driver dashboard.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
