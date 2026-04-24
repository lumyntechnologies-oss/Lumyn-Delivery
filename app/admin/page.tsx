'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Package, Users, BarChart, DollarSign, TrendingUp, Wallet } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalDeliveries: number
  totalUsers: number
  totalDrivers: number
  pendingDeliveries: number
  revenueToday: number
  averageRating: number
}

export default function AdminDashboard() {
  const { isSignedIn, userId } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSignedIn || !userId) {
      router.push('/sign-in')
      return
    }

    const adminUserIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',') || []
    const isUserAdmin = adminUserIds.includes(userId)

    if (!isUserAdmin) {
      router.push('/deliveries')
      return
    }

    setIsAdmin(true)
    fetchStats()
  }, [isSignedIn, userId, router])

   const fetchStats = async () => {
     try {
       const response = await fetch('/api/admin/analytics?period=month')
       const data = await response.json()
       if (data.success && data.data) {
         setStats({
           totalDeliveries: data.data.summary.totalDeliveries,
           totalUsers: data.data.summary.totalUsers,
           totalDrivers: data.data.summary.totalDrivers,
           pendingDeliveries: data.data.summary.pendingDeliveries,
           revenueToday: data.data.summary.revenueToday,
           averageRating: data.data.summary.averageRating,
         })
       } else {
         console.error('Failed to fetch stats:', data.error)
       }
     } catch (error) {
       console.error('Error fetching stats:', error)
     } finally {
       setLoading(false)
     }
   }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-secondary">You do not have access to this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="section-title mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Deliveries */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="section-subtitle">Total Deliveries</p>
                {stats && <p className="text-3xl font-bold text-primary mt-2">{stats.totalDeliveries}</p>}
              </div>
              <div className="h-10 w-10 rounded-2xl bg-accent-gold/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-accent-gold" />
              </div>
            </div>
            <p className="text-xs text-secondary">All time deliveries</p>
          </div>

          {/* Total Users */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="section-subtitle">Total Users</p>
                {stats && <p className="text-3xl font-bold text-primary mt-2">{stats.totalUsers}</p>}
              </div>
              <div className="h-10 w-10 rounded-2xl bg-accent-teal/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent-teal" />
              </div>
            </div>
            <p className="text-xs text-secondary">Registered customers</p>
          </div>

          {/* Pending Deliveries */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="section-subtitle">Pending</p>
                {stats && <p className="text-3xl font-bold text-primary mt-2">{stats.pendingDeliveries}</p>}
              </div>
              <div className="h-10 w-10 rounded-2xl bg-warning/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
            </div>
            <p className="text-xs text-secondary">Awaiting assignment</p>
          </div>

          {/* Total Drivers */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="section-subtitle">Active Drivers</p>
                {stats && <p className="text-3xl font-bold text-primary mt-2">{stats.totalDrivers}</p>}
              </div>
              <div className="h-10 w-10 rounded-2xl bg-accent-gold/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent-gold" />
              </div>
            </div>
            <p className="text-xs text-secondary">Verified drivers</p>
          </div>

          {/* Revenue Today */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="section-subtitle">Revenue Today</p>
                {stats && <p className="text-3xl font-bold text-primary mt-2">${stats.revenueToday.toFixed(2)}</p>}
              </div>
              <div className="h-10 w-10 rounded-2xl bg-success/20 flex items-center justify-center">
                <BarChart className="h-5 w-5 text-success" />
              </div>
            </div>
            <p className="text-xs text-secondary">Generated today</p>
          </div>

          {/* Average Rating */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="section-subtitle">Avg Rating</p>
                {stats && <p className="text-3xl font-bold text-primary mt-2">{stats.averageRating}</p>}
              </div>
              <div className="h-10 w-10 rounded-2xl bg-accent-gold/20 flex items-center justify-center">
                <span className="text-lg">⭐</span>
              </div>
            </div>
            <p className="text-xs text-secondary">Customer satisfaction</p>
          </div>
        </div>

        {/* Admin Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/users" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary mb-1">Manage Users</h3>
                <p className="text-sm text-secondary">View and manage all users</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-accent-teal/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent-teal" />
              </div>
            </div>
          </Link>

          <Link href="/admin/deliveries" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary mb-1">Manage Deliveries</h3>
                <p className="text-sm text-secondary">View and manage all deliveries</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-accent-gold/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-accent-gold" />
              </div>
            </div>
          </Link>

          <Link href="/admin/drivers" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary mb-1">Manage Drivers</h3>
                <p className="text-sm text-secondary">Verify and manage drivers</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-success/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-success" />
              </div>
            </div>
          </Link>

          <Link href="/admin/analytics" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary mb-1">Analytics</h3>
                <p className="text-sm text-secondary">View detailed analytics and reports</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-info/20 flex items-center justify-center">
                <BarChart className="h-5 w-5 text-info" />
              </div>
            </div>
          </Link>

          <Link href="/admin/pricing" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary mb-1">Pricing Settings</h3>
                <p className="text-sm text-secondary">Configure delivery rates & multipliers</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-accent-gold/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-accent-gold" />
              </div>
            </div>
          </Link>

          <Link href="/admin/payouts" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary mb-1">Payout Management</h3>
                <p className="text-sm text-secondary">Process driver payouts</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-success/20 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-success" />
              </div>
            </div>
           </Link>
         </div>
       </div>
     </div>
   )
 }
