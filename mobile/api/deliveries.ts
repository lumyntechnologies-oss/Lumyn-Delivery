import apiClient from './client';
import type { Delivery, DeliveryFormData, PaginatedResponse } from '../types';

export const deliveriesApi = {
  // Create new delivery
  create: async (data: DeliveryFormData): Promise<Delivery | null> => {
    const response = await apiClient.post<{ success: boolean; data: Delivery }>('/api/deliveries', data);
    return response.data.success ? response.data.data : null;
  },

  // List deliveries (filtered by user role automatically)
  getAll: async (params?: { status?: string; limit?: number; offset?: number }): Promise<PaginatedResponse<Delivery>> => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await apiClient.get<{ success: boolean; data: Delivery[]; total: number; limit: number; offset: number }>(`/api/deliveries${query}`);
    return {
      success: response.data.success,
      data: response.data.data || [],
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  },

  // Get single delivery details
  getById: async (id: string): Promise<Delivery | null> => {
    const response = await apiClient.get<{ success: boolean; data: Delivery }>(`/api/deliveries/${id}`);
    return response.data.success ? response.data.data : null;
  },

  // Get user's own deliveries (for customer)
  getMyDeliveries: async (): Promise<Delivery[]> => {
    const response = await apiClient.get<{ success: boolean; data: Delivery[] }>('/api/deliveries?role=customer');
    return response.data.data || [];
  },

  // Initialize payment for a delivery
  initializePayment: async (deliveryId: string, tipAmount: number = 0) => {
    const response = await apiClient.post<{ success: boolean; data: { paymentId: string; redirectUrl: string } }>('/api/payments', {
      deliveryId,
      tipAmount,
    });
    return response.data.success ? response.data.data : null;
  },
};
