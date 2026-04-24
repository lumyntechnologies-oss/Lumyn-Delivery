import { prisma } from '@/lib/prisma'

export interface PricingRule {
  id?: string
  name: string
  baseFare: number
  costPerKm: number
  minimumFare: number
  vehicleType?: string
  priorityMultiplier: number
  active: boolean
}

export interface PricingConfig {
  baseFare: number
  costPerKm: number
  minimumFare: number
  priorityMultiplier: {
    NORMAL: number
    URGENT: number
    HIGH: number
    LOW: number
  }
}

// Default pricing configuration (can be overridden by admin settings)
const DEFAULT_PRICING: PricingConfig = {
  baseFare: 500, // KES 500 base
  costPerKm: 50, // KES 50 per km
  minimumFare: 800, // Minimum fare KES 800
  priorityMultiplier: {
    NORMAL: 1,
    URGENT: 1.5,
    HIGH: 1.3,
    LOW: 0.9,
  },
}

/**
 * Calculate delivery cost based on distance and priority
 */
export function calculateDeliveryCost(
  distanceKm: number,
  priority: string = 'NORMAL'
): number {
  const config = DEFAULT_PRICING

  // Calculate base cost: base fare + (distance * per km rate)
  let cost = config.baseFare + (distanceKm * config.costPerKm)

  // Apply priority multiplier
  const multiplier = config.priorityMultiplier[priority as keyof typeof config.priorityMultiplier] || 1
  cost *= multiplier

  // Ensure minimum fare
  cost = Math.max(cost, config.minimumFare)

  // Round to 2 decimal places
  return Math.round(cost * 100) / 100
}

/**
 * Format cost for display
 */
export function formatCost(cost: number, currency: string = 'KES'): string {
  const symbols: Record<string, string> = {
    KES: 'KSh ',
    USD: '$',
    EUR: '€',
    GBP: '£',
  }

  const symbol = symbols[currency] || ''
  return `${symbol}${cost.toFixed(2)}`
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0

  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

