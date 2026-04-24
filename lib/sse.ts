import { EventEmitter } from 'events'

// Global event emitter for SSE
export const deliveryEvents = new EventEmitter()

// Helper to broadcast delivery updates
export function broadcastDeliveryUpdate(deliveryId: string, data: any) {
  deliveryEvents.emit('deliveryUpdate', { deliveryId, ...data })
}

export function broadcastStatusChange(deliveryId: string, status: string, driverId?: string) {
  deliveryEvents.emit('statusChange', { deliveryId, status, driverId })
}
