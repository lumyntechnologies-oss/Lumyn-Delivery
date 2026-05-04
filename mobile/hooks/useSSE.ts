import { useEffect, useRef, useCallback } from 'react';
import type { Delivery, DeliveryStatus } from '../types';
import apiClient from '../api/client';

type DeliveryUpdateCallback = (delivery: Delivery) => void;

export function useDeliveryUpdates(deliveryId: string | null, onUpdate: DeliveryUpdateCallback, intervalMs: number = 3000) {
  const lastUpdateRef = useRef<Date>(new Date(0));
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!deliveryId) return;

    const poll = async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: Delivery }>(`/api/deliveries/${deliveryId}`);
        if (response.data.success && response.data.data) {
          // Only fire callback if delivery actually changed
          const delivery = response.data.data;
          if (new Date(delivery.updatedAt) > lastUpdateRef.current) {
            lastUpdateRef.current = new Date(delivery.updatedAt);
            onUpdate(delivery);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll
    poll();
    // Set up interval
    timerRef.current = setInterval(poll, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [deliveryId, onUpdate, intervalMs]);

  const forceRefresh = useCallback(async () => {
    if (!deliveryId) return;
    try {
      const response = await apiClient.get<{ success: boolean; data: Delivery }>(`/api/deliveries/${deliveryId}`);
      if (response.data.success && response.data.data) {
        onUpdate(response.data.data);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    }
  }, [deliveryId, onUpdate]);

  return { forceRefresh };
}

// For tracking driver location updates in background
export function useLocationUpdates(driverId: string | null, onLocationUpdate: (lat: number, lon: number) => void) {
  useEffect(() => {
    if (!driverId) return;

    const poll = async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: { latitude: number; longitude: number } }>(
          `/api/drivers/${driverId}/location`
        );
        if (response.data.success && response.data.data) {
          onLocationUpdate(response.data.data.latitude, response.data.data.longitude);
        }
      } catch (error) {
        // Silently fail
      }
    };

    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, [driverId, onLocationUpdate]);
}
