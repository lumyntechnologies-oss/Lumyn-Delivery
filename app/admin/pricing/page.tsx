'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Loader, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import Link from 'next/link'

interface PricingRule {
  id: string
  name: string
  baseFare: number
  costPerKm: number
  minimumFare: number
  priorityMultiplier: {
    NORMAL: number
    URGENT: number
    HIGH: number
    LOW: number
  }
  vehicleType: string | null
  active: boolean
  createdAt: string
}

export default function AdminPricingPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    baseFare: 500,
    costPerKm: 50,
    minimumFare: 800,
    priorityMultiplier: { NORMAL: 1, URGENT: 1.5, HIGH: 1.3, LOW: 0.9 },
    vehicleType: '',
  })

  useEffect(() => {
    if (!userId) {
      router.push('/sign-in')
      return
    }
    // Check admin
    const adminIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',') || []
    if (!adminIds.includes(userId)) {
      router.push('/deliveries')
      return
    }
    fetchRules()
  }, [userId, router])

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/admin/pricing')
      const data = await res.json()
      if (data.success) {
        setRules(data.data)
      }
    } catch (error) {
      console.error('Error fetching pricing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vehicleType: formData.vehicleType || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        fetchRules()
        setFormData({
          name: '',
          baseFare: 500,
          costPerKm: 50,
          minimumFare: 800,
          priorityMultiplier: { NORMAL: 1, URGENT: 1.5, HIGH: 1.3, LOW: 0.9 },
          vehicleType: '',
        })
      } else {
        alert(data.error || 'Failed to save')
      }
    } catch (error) {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (rule: PricingRule) => {
    setEditingId(rule.id)
    setFormData({
      name: rule.name,
      baseFare: rule.baseFare,
      costPerKm: rule.costPerKm,
      minimumFare: rule.minimumFare,
      priorityMultiplier: rule.priorityMultiplier,
      vehicleType: rule.vehicleType || '',
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: '',
      baseFare: 500,
      costPerKm: 50,
      minimumFare: 800,
      priorityMultiplier: { NORMAL: 1, URGENT: 1.5, HIGH: 1.3, LOW: 0.9 },
      vehicleType: '',
    })
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">
          ← Back to Admin Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="section-title mb-0">Pricing Settings</h1>
          <div className="text-sm text-secondary">
            Configure delivery rates and priority multipliers
          </div>
        </div>

        {/* Create New Rule Form */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Pricing Rule
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary block mb-2">Rule Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Standard Rates"
                  className="input-base w-full"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-secondary block mb-2">Base Fare (KSh)</label>
                <input
                  type="number"
                  value={formData.baseFare}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseFare: parseFloat(e.target.value) }))}
                  className="input-base w-full"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-secondary block mb-2">Cost per km (KSh)</label>
                <input
                  type="number"
                  value={formData.costPerKm}
                  onChange={(e) => setFormData(prev => ({ ...prev, costPerKm: parseFloat(e.target.value) }))}
                  className="input-base w-full"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-secondary block mb-2">Minimum Fare (KSh)</label>
                <input
                  type="number"
                  value={formData.minimumFare}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumFare: parseFloat(e.target.value) }))}
                  className="input-base w-full"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary block mb-2">Low Priority Multiplier</label>
                 <input
                   type="number"
                   step="0.1"
                   value={formData.priorityMultiplier.LOW}
                   onChange={(e) => setFormData(prev => ({
                     ...prev,
                     priorityMultiplier: { ...prev.priorityMultiplier, LOW: parseFloat(e.target.value) }
                   }))}
                   className="input-base w-full"
                   min="0.1"
                   max="1"
                 />
              </div>
              <div>
                <label className="text-sm font-medium text-secondary block mb-2">Normal Multiplier</label>
                 <input
                   type="number"
                   step="0.1"
                   value={formData.priorityMultiplier.NORMAL}
                   onChange={(e) => setFormData(prev => ({
                     ...prev,
                     priorityMultiplier: { ...prev.priorityMultiplier, NORMAL: parseFloat(e.target.value) }
                   }))}
                   className="input-base w-full"
                   min="0.1"
                 />
              </div>
              <div>
                <label className="text-sm font-medium text-secondary block mb-2">High Multiplier</label>
                 <input
                   type="number"
                   step="0.1"
                   value={formData.priorityMultiplier.HIGH}
                   onChange={(e) => setFormData(prev => ({
                     ...prev,
                     priorityMultiplier: { ...prev.priorityMultiplier, HIGH: parseFloat(e.target.value) }
                   }))}
                   className="input-base w-full"
                   min="1"
                 />
              </div>
              <div>
                <label className="text-sm font-medium text-secondary block mb-2">Urgent Multiplier</label>
                 <input
                   type="number"
                   step="0.1"
                   value={formData.priorityMultiplier.URGENT}
                   onChange={(e) => setFormData(prev => ({
                     ...prev,
                     priorityMultiplier: { ...prev.priorityMultiplier, URGENT: parseFloat(e.target.value) }
                   }))}
                   className="input-base w-full"
                   min="1"
                 />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-secondary block mb-2">Vehicle Type (optional, leave blank for all)</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                className="input-base w-full"
              >
                <option value="">All Vehicles</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="truck">Truck</option>
                <option value="van">Van</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="bicycle">Bicycle</option>
                <option value="scooter">Scooter</option>
              </select>
            </div>

            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Pricing Rule'}
            </button>
          </form>
        </div>

        {/* Existing Rules */}
        <div className="card">
          <h2 className="text-lg font-semibold text-primary mb-4">Active Pricing Rules</h2>
          {rules.length === 0 ? (
            <p className="text-secondary">No pricing rules configured. Using defaults.</p>
          ) : (
            <div className="space-y-4">
              {rules.map(rule => (
                <div key={rule.id} className="border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-primary">{rule.name}</h3>
                      <p className="text-sm text-secondary mt-1">
                        Base: KSh {rule.baseFare} | Per km: KSh {rule.costPerKm} | Min: KSh {rule.minimumFare}
                      </p>
                      <p className="text-xs text-secondary mt-1">
                        Multipliers: Low({(rule.priorityMultiplier as any).LOW}) 
                        Normal({(rule.priorityMultiplier as any).NORMAL}) 
                        High({(rule.priorityMultiplier as any).HIGH}) 
                        Urgent({(rule.priorityMultiplier as any).URGENT})
                        {rule.vehicleType && ` • Vehicle: ${rule.vehicleType}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        disabled={editingId === rule.id}
                        className="btn-secondary text-sm p-2"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Rates Display */}
        <div className="mt-8 card bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 border-accent-gold/20">
          <h2 className="text-lg font-bold text-primary mb-4">Current Active Rates</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-secondary">Base Fare</p>
              <p className="text-xl font-bold text-primary">KSh {rules[0]?.baseFare || 500}</p>
            </div>
            <div>
              <p className="text-xs text-secondary">Per Kilometer</p>
              <p className="text-xl font-bold text-primary">KSh {rules[0]?.costPerKm || 50}</p>
            </div>
            <div>
              <p className="text-xs text-secondary">Minimum Fare</p>
              <p className="text-xl font-bold text-primary">KSh {rules[0]?.minimumFare || 800}</p>
            </div>
            <div>
              <p className="text-xs text-secondary">Urgent Multiplier</p>
              <p className="text-xl font-bold text-accent-gold">×{(rules[0]?.priorityMultiplier as any)?.URGENT || 1.5}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
