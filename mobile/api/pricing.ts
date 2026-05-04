import apiClient from './client';
import type { PricingRule } from '../types';

export const pricingApi = {
  // Get current pricing configuration
  getPricing: async (): Promise<PricingRule | null> => {
    const response = await apiClient.get<{ success: boolean; data: PricingRule }>('/api/pricing');
    return response.data.success ? response.data.data : null;
  },

  // Calculate delivery cost (same as GET /api/pricing)
  calculate: async (options: { distanceKm: number; priority?: string }): Promise<number> => {
    const pricing = await getPricing();
    if (!pricing) throw new Error('Pricing not available');

    const multiplier = pricing.priorityMultiplier[options.priority || 'NORMAL'];
    const calculated = pricing.baseFare + (options.distanceKm * pricing.costPerKm) * multiplier;

    return Math.max(calculated, pricing.minimumFare);
  },
};

async function getPricing(): Promise<PricingRule | null> {
  return pricingApi.getPricing();
}
