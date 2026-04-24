'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

export interface SSEMessage {
  type: 'connected' | 'update' | 'statusChange' | 'ping' | 'error'
  deliveryId?: string
  status?: string
  timestamp?: number
  [key: string]: any
}

interface UseSSEOptions {
  onMessage?: (message: SSEMessage) => void
  onStatusChange?: (status: string, deliveryId: string) => void
  onUpdate?: (data: any) => void
  onError?: (error: Event) => void
}

export function useSSE(deliveryId: string | null, options: UseSSEOptions = {}) {
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const { onMessage, onStatusChange, onUpdate, onError } = options

  useEffect(() => {
    if (!deliveryId) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
        setConnected(false)
      }
      return
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Create new EventSource connection
    const eventSource = new EventSource(`/api/sse?deliveryId=${deliveryId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE connection established')
      setConnected(true)
    }

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data: SSEMessage = JSON.parse(event.data)
        setLastMessage(data)
        onMessage?.(data)

        if (data.type === 'statusChange' && data.status) {
          onStatusChange?.(data.status, data.deliveryId || deliveryId)
        } else if (data.type === 'update') {
          onUpdate?.(data)
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err)
      }
    }

    eventSource.onerror = (error: Event) => {
      console.error('SSE connection error:', error)
      setConnected(false)
      onError?.(error)
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          // Reconnection will happen via useEffect when deliveryId doesn't change
        }
      }, 5000)
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
      setConnected(false)
    }
  }, [deliveryId, onMessage, onStatusChange, onUpdate, onError])

  const sendMessage = useCallback((event: string, data: any) => {
    // Note: SSE is server-to-client only. For client-to-server, use regular fetch
    console.warn('SSE is read-only. Use fetch/POST to send data to server.')
  }, [])

  return {
    connected,
    lastMessage,
    sendMessage,
    eventSource: eventSourceRef.current,
  }
}
