import apiClient from './client';
import type { DriverEarnings, DriverApplicationData, Delivery, UploadResponse } from '../types';

export const driverApi = {
  // Get driver earnings
  getEarnings: async (): Promise<DriverEarnings | null> => {
    const response = await apiClient.get<{ success: boolean; data: DriverEarnings }>('/api/driver/earnings');
    return response.data.success ? response.data.data : null;
  },

  // Accept a delivery
  acceptDelivery: async (deliveryId: string): Promise<{ success: boolean; error?: string; delivery?: Delivery }> => {
    const response = await apiClient.post<{ success: boolean; data?: Delivery; error?: string }>(`/api/driver/accept/${deliveryId}`);
    return {
      success: response.data.success,
      error: response.data.error,
      delivery: response.data.data || undefined,
    };
  },

  // Update driver location
  updateLocation: async (latitude: number, longitude: number): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/api/driver/location', {
      latitude,
      longitude,
    });
    return response.data;
  },

  // Get available deliveries for assignment (for admin/customer)
  getAvailableDrivers: async (): Promise<{ drivers: any[] } | null> => {
    const response = await apiClient.get<{ success: boolean; data: { drivers: any[] } }>('/api/drivers/available');
    return response.data.success ? response.data.data : null;
  },

  // Get driver's available assignments
  getAssignments: async (): Promise<Delivery[]> => {
    const response = await apiClient.get<{ success: boolean; data: Delivery[] }>('/api/assignments');
    return response.data.data || [];
  },

  // Upload driver documents (Cloudinary)
  uploadDocument: async (file: any, type: string): Promise<{ success: boolean; url: string } | null> => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.mimeType || 'image/jpeg',
      name: file.fileName || `doc_${Date.now()}.jpg`,
    } as any);
    formData.append('type', type);

    const response = await apiClient.post<{ success: boolean; data: { url: string } }>('/api/cloudinary-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.success ? { success: true, url: response.data.data.url } : null;
  },

  // Submit driver application
  submitApplication: async (data: DriverApplicationData): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post<{ success: boolean; message?: string }>('/api/drivers/apply', data);
    return response.data;
  },
};
