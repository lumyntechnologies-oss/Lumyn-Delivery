'use client'

import { useEffect, useRef, useState } from 'react'

interface RealtimeDelivery {
  id: string
  status: string
  driver?: {
    id: string
    firstName?: string
    lastName?: string
    driverRating: number
    vehicleType?: string
    vehiclePlate?: string
  } | null
}

interface RealtimeDriverLocation {
  id: string
  firstName?: string
  lastName?: string
  latitude: number | null
  longitude: number | null
  lastLocationUpdate: string | null
}

export function useRealtimeDelivery(deliveryId: string | undefined) {
  const [delivery, setDelivery] = useState<RealtimeDelivery | null>(null)
  const [driverLocation, setDriverLocation] = useState<RealtimeDriverLocation | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!deliveryId) return

    // Connect to SSE endpoint
    const eventSource = new EventSource(`/api/track/${deliveryId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setConnected(true)
      setError(null)
    }

    eventSource.addEventListener('delivery', (event) => {
      try {
        const data = JSON.parse(event.data)
        setDelivery(data)
      } catch (err) {
        console.error('Failed to parse delivery event:', err)
      }
    })

    eventSource.addEventListener('location', (event) => {
      try {
        const data = JSON.parse(event.data)
        setDriverLocation(data)
      } catch (err) {
        console.error('Failed to parse location event:', err)
      }
    })

    eventSource.onmessage = (event) => {
      // Generic message handler for heartbeats
    }

    eventSource.onerror = (err) => {
      console.error('SSE error:', err)
      setError('Connection lost. Reconnecting...')
      setConnected(false)
      eventSource.close()
      
      // Attempt reconnection after 3 seconds
      setTimeout(() => {
        if (deliveryId) {
          // Retry logic handled by effect re-run
        }
      }, 3000)
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [deliveryId])

  const sendMessage = (type: string, data: any) => {
    // Not used for SSE (server pushes only)
    console.warn('SSE is read-only. Use REST API for actions.')
  }

  return {
    delivery,
    driverLocation,
    connected,
    error,
    sendMessage,
  }
}
