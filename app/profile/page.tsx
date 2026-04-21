'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Navbar } from '@/components/navbar'
import { Loader } from 'lucide-react'

interface UserProfile {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  role: string
  isAdmin: boolean
  profileImage?: string
  createdAt: string
}

export default function ProfilePage() {
  const { isSignedIn, userId } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  })

  useEffect(() => {
    if (!isSignedIn || !userId) return

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        const data = await response.json()
        if (data.success) {
          setProfile(data.data)
          setFormData({
            firstName: data.data.firstName || '',
            lastName: data.data.lastName || '',
            phone: data.data.phone || '',
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [isSignedIn, userId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        setProfile(data.data)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="section-title mb-8">Profile</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="h-8 w-8 text-accent-gold animate-spin" />
          </div>
        ) : profile ? (
          <div className="card">
            {/* Basic Info */}
            <div className="mb-8 pb-8 border-b border-border">
              <h2 className="text-lg font-semibold text-primary mb-4">Personal Information</h2>

              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-secondary">Full Name</p>
                    <p className="text-lg text-primary mt-1">
                      {profile.firstName} {profile.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary">Email</p>
                    <p className="text-lg text-primary mt-1">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary">Phone</p>
                    <p className="text-lg text-primary mt-1">{profile.phone || 'Not provided'}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary text-sm mt-4"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="text-sm font-medium text-secondary block mb-1">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="input-base w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="text-sm font-medium text-secondary block mb-1">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="input-base w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="text-sm font-medium text-secondary block mb-1">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-base w-full"
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={handleSave} className="btn-primary text-sm">
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Account Info */}
            <div>
              <h2 className="text-lg font-semibold text-primary mb-4">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-secondary">Role</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="badge badge-info">{profile.role}</span>
                    {profile.isAdmin && <span className="badge badge-warning">Admin</span>}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary">Member Since</p>
                  <p className="text-lg text-primary mt-1">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-secondary">Unable to load profile</p>
          </div>
        )}
      </div>
    </div>
  )
}
