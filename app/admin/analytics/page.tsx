'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import Link from 'next/link'
import { TrendingUp, Calendar, Loader } from 'lucide-react'

interface Analytics {
  summary: {
    totalDeliveries: number
    deliveriesInPeriod: number
    totalUsers: number
    customersCount: number
    totalDrivers: number
    verifiedDrivers: number
    totalRevenue: number
    revenueInPeriod: number
    averageRating: number
  }
  deliveryStatus: Array<{ status: string; _count: number }>
  topDrivers: Array<{
    id: string
    totalDeliveries: number
    rating: number
    user: { firstName?: string; lastName?: string }
  }>
  revenueTrend: Array<{ date: string; revenue: number }>
}

export default function AnalyticsPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      router.push('/sign-in')
      return
    }

    const adminUserIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',') || []
    if (!adminUserIds.includes(userId)) {
      router.push('/deliveries')
      return
    }

    fetchAnalytics()
  }, [userId, router, dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?period=${dateRange}`)
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="section-title">Analytics & Reports</h1>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-2xl font-medium text-sm transition-all ${
                  dateRange === range
                    ? 'bg-accent-gold text-primary'
                    : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Sections */}
        <div className="grid gap-6 mb-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card h-32 bg-secondary/5 animate-pulse rounded-2xl" />
              ))
            ) : analytics ? (
              <>
                <div className="card">
                  <p className="section-subtitle mb-3">Total Deliveries</p>
                  <p className="text-3xl font-bold text-primary mb-2">{analytics.summary.totalDeliveries}</p>
                  <p className="text-xs text-secondary">{analytics.summary.deliveriesInPeriod} in this period</p>
                </div>

                <div className="card">
                  <p className="section-subtitle mb-3">Active Users</p>
                  <p className="text-3xl font-bold text-primary mb-2">{analytics.summary.customersCount}</p>
                  <p className="text-xs text-secondary">{analytics.summary.totalUsers} total</p>
                </div>

                <div className="card">
                  <p className="section-subtitle mb-3">Total Revenue</p>
                  <p className="text-3xl font-bold text-accent-gold mb-2">${analytics.summary.totalRevenue.toFixed(0)}</p>
                  <p className="text-xs text-secondary">${analytics.summary.revenueInPeriod.toFixed(0)} this period</p>
                </div>

                <div className="card">
                  <p className="section-subtitle mb-3">Avg. Rating</p>
                  <p className="text-3xl font-bold text-primary mb-2">{analytics.summary.averageRating.toFixed(1)}/5</p>
                  <p className="text-xs text-secondary">{analytics.summary.verifiedDrivers} verified drivers</p>
                </div>
              </>
            ) : null}
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">Revenue Trends</h2>
              <TrendingUp className="h-5 w-5 text-accent-gold" />
            </div>
            {loading ? (
              <div className="h-64 bg-secondary/5 rounded-2xl flex items-center justify-center">
                <Loader className="h-6 w-6 text-accent-gold animate-spin" />
              </div>
            ) : analytics ? (
              <div className="space-y-4">
                {analytics.revenueTrend.map((item) => (
                  <div key={item.date} className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg">
                    <span className="text-sm text-secondary font-medium">{item.date}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-8 bg-accent-gold/30 rounded" style={{ width: `${(item.revenue / 1000) * 100}px` }} />
                      <span className="text-sm font-semibold text-accent-gold w-20 text-right">${item.revenue.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary text-center py-8">No data available</p>
            )}
          </div>

          {/* Delivery Performance */}
          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-4">Delivery Performance</h2>
            {analytics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analytics.deliveryStatus.map((status) => (
                  <div key={status.status} className="p-4 bg-secondary/5 rounded-2xl">
                    <p className="text-xs text-secondary font-medium mb-2">{status.status.replace('_', ' ')}</p>
                    <p className="text-2xl font-bold text-primary">{status._count}</p>
                    <p className="text-xs text-secondary mt-1">
                      {((status._count / analytics.summary.totalDeliveries) * 100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-24 bg-secondary/5 rounded-2xl flex items-center justify-center">
                <Loader className="h-6 w-6 text-accent-gold animate-spin" />
              </div>
            )}
          </div>

          {/* Driver Statistics */}
          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-4">Top Drivers</h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-secondary/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : analytics?.topDrivers && analytics.topDrivers.length > 0 ? (
              <div className="space-y-3">
                {analytics.topDrivers.map((driver, index) => (
                  <div key={driver.id} className="p-4 bg-secondary/5 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-accent-gold">#{index + 1}</span>
                        <div>
                          <p className="font-semibold text-primary">{driver.user.firstName} {driver.user.lastName}</p>
                          <p className="text-xs text-secondary">{driver.totalDeliveries} deliveries</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{driver.rating.toFixed(1)} ⭐</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary text-center py-8">No driver data available</p>
            )}
          </div>

          {/* User Growth */}
          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-4">User Growth</h2>
            <div className="h-48 bg-secondary/5 rounded-2xl flex items-center justify-center">
              <p className="text-secondary">Chart placeholder - connect to charting library</p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="card">
          <h2 className="text-lg font-semibold text-primary mb-4">Export Reports</h2>
          <div className="flex gap-3 flex-wrap">
            <button className="btn-primary text-sm">Export as CSV</button>
            <button className="btn-primary text-sm">Export as PDF</button>
            <button className="btn-secondary text-sm">Generate Report</button>
          </div>
        </div>
      </div>
    </div>
  )
}
