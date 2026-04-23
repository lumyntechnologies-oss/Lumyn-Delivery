'use client'

import { useEffect, useRef } from 'react'

interface LocationData {
  latitude: number
  longitude: number
  speed?: number
  heading?: number
  accuracy?: number
}

export function useDriverLocationTracking(enabled: boolean, intervalMs: number = 5000) {
  const watchIdRef = useRef<number | null>(null)
  const lastSentRef = useRef<{ lat: number; lng: number } | null>(null)
  const THRESHOLD_METERS = 10 // Minimum distance change to send update

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !navigator.geolocation) {
      return
    }

    const sendLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude, speed, heading, accuracy } = position.coords

      // Only send if location changed significantly or first update
      const last = lastSentRef.current
      const shouldSend = !last || calculateDistance(last.lat, last.lng, latitude, longitude) >= THRESHOLD_METERS

      if (!shouldSend) return

      lastSentRef.current = { lat: latitude, lng: longitude }

      try {
        await fetch('/api/driver/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude,
            longitude,
            speed,
            heading,
            accuracy,
          }),
        })
      } catch (err) {
        console.error('Failed to send location:', err)
      }
    }

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      sendLocation,
      (error) => console.error('Geolocation error:', error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    // Initial send
    navigator.geolocation.getCurrentPosition(sendLocation, console.error, {
      enableHighAccuracy: true,
    })

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [enabled])

  // Helper for distance calculation (Haversine)
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }
}
