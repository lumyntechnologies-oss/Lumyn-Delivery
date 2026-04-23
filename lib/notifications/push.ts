import * as webpush from 'web-push'
import { prisma } from '@/lib/prisma'

// Initialize VAPID
webpush.setVapidDetails(
  'mailto:admin@lumyn-delivery.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  url?: string
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { 
        userId,
        isActive: true 
      },
    })

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions for user ${userId}`)
      return { success: 0, failed: 0 }
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys as any,
            },
            JSON.stringify({
              ...payload,
              data: { ...payload.data, url: payload.url },
            })
          )
          return { success: true }
        } catch (error: any) {
          // If subscription is invalid (410 Gone), delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } })
          }
          return { success: false, error }
        }
      })
    )

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failedCount = results.length - successCount

    return { success: successCount, failed: failedCount }
  } catch (error) {
    console.error('Error sending push notifications:', error)
    return { success: 0, failed: 0 }
  }
}

export async function sendDeliveryStatusPush(deliveryId: string, newStatus: string) {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        customer: { select: { id: true, email: true, firstName: true, lastName: true } },
        driver: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    })

    if (!delivery) return

    const statusMessages = {
      ASSIGNED: {
        title: 'Driver Assigned!',
        body: `Your delivery "${delivery.description}" has been assigned to a driver.`,
        url: `/deliveries/${deliveryId}`,
      },
      PICKED_UP: {
        title: 'Package Picked Up',
        body: `Driver has picked up your delivery "${delivery.description}".`,
        url: `/deliveries/${deliveryId}`,
      },
      IN_TRANSIT: {
        title: 'Out for Delivery',
        body: `Your delivery "${delivery.description}" is now in transit.`,
        url: `/deliveries/${deliveryId}`,
      },
      DELIVERED: {
        title: 'Delivered!',
        body: `Your delivery "${delivery.description}" has been completed.`,
        url: `/deliveries/${deliveryId}`,
      },
    }

    const message = statusMessages[newStatus as keyof typeof statusMessages]
    if (!message) return

    // Send to customer
    if (delivery.customerId) {
      await sendPushNotification(delivery.customerId, {
        ...message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
      })
    }

    // Send to driver (different message)
    if (delivery.driverId && newStatus === 'ASSIGNED') {
      await sendPushNotification(delivery.driverId, {
        title: 'New Delivery Assigned',
        body: `You've been assigned to "${delivery.description}". Accept now!`,
        url: `/driver-dashboard`,
      })
    }
  } catch (error) {
    console.error('Error sending delivery status push:', error)
  }
}
