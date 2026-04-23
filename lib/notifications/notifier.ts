import { prisma } from '@/lib/prisma'
import { sendPushNotification, PushPayload } from './push'
import { sendEmail, sendDeliveryAssignedEmail, sendDeliveryCompletedEmail } from './email'

export async function notifyUser(userId: string, payload: PushPayload & { email?: boolean }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        emailNotifications: true,
        pushNotifications: true,
      },
    })

    if (!user) return

    // Push notification
    if (user.pushNotifications) {
      await sendPushNotification(userId, payload)
    }

    // Email
    if (user.emailNotifications && payload.email && user.email) {
      await sendEmail({
        to: user.email,
        subject: payload.title,
        html: `<div><h1>${payload.title}</h1><p>${payload.body}</p></div>`,
      })
    }
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}

export async function notifyDeliveryAssigned(deliveryId: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { customer: true, driver: true },
  })

  if (!delivery || !delivery.customerId) return

  // Send push notification
  await notifyUser(delivery.customerId, {
    title: 'Driver Assigned!',
    body: `Your delivery "${delivery.description}" has been assigned to ${delivery.driver?.firstName || 'a driver'}.`,
    url: `/deliveries/${deliveryId}`,
    email: true,
  })

  // Send detailed email if customer has email
  const customerEmail = delivery.customer.email
  if (customerEmail) {
    const driverName = delivery.driver
      ? [delivery.driver.firstName, delivery.driver.lastName].filter(Boolean).join(' ') || 'Your driver'
      : 'Your driver'
    await sendDeliveryAssignedEmail(customerEmail, driverName, delivery.description, deliveryId)
  }
}

export async function notifyDeliveryStatusChange(deliveryId: string, status: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { customer: true },
  })

  if (!delivery || !delivery.customerId) return

  const messages: Record<string, { title: string; body: string; email?: boolean }> = {
    PICKED_UP: {
      title: 'Package Picked Up',
      body: 'Your driver has picked up your package.',
      email: true,
    },
    IN_TRANSIT: {
      title: 'Out for Delivery',
      body: 'Your package is on the way!',
      email: false,
    },
    DELIVERED: {
      title: 'Delivered!',
      body: 'Your package has been delivered. Thank you!',
      email: true,
    },
  }

  const msg = messages[status]
  if (msg) {
    await notifyUser(delivery.customerId, {
      ...msg,
      url: `/deliveries/${deliveryId}`,
    })

    if (status === 'DELIVERED') {
      const customerEmail = delivery.customer.email
      if (customerEmail) {
        await sendDeliveryCompletedEmail(customerEmail, delivery.description, deliveryId)
      }
    }
  }
}
