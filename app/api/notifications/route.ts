import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// POST /api/notifications/subscribe — Save push subscription
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { subscription, deviceType } = body

    if (!subscription || !subscription.endpoint) {
      const [response, status] = errorResponse('Invalid subscription', 400)
      return NextResponse.json(response, { status })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    // Check if subscription exists for this user
    const existing = await prisma.pushSubscription.findFirst({
      where: { userId: user.id },
    })

    if (existing) {
      // Update existing
      const updated = await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys?.p256dh || '',
            auth: subscription.keys?.auth || '',
          },
          deviceType: deviceType || 'browser',
          isActive: true,
          updatedAt: new Date(),
        },
      })
      return NextResponse.json(successResponse(updated, 'Push subscription updated'), { status: 200 })
    }

    // Create new
    const pushSubscription = await prisma.pushSubscription.create({
      data: {
        userId: user.id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys?.p256dh || '',
          auth: subscription.keys?.auth || '',
        },
        deviceType: deviceType || 'browser',
        isActive: true,
      },
    })

    return NextResponse.json(successResponse(pushSubscription, 'Push subscription saved'), { status: 200 })
  } catch (error) {
    console.error('Error saving push subscription:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// DELETE /api/notifications/subscribe — Remove push subscription
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id },
    })

    return NextResponse.json(successResponse(null, 'Push subscription removed'), { status: 200 })
  } catch (error) {
    console.error('Error deleting push subscription:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// GET /api/notifications — Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
      },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    return NextResponse.json(successResponse(user), { status: 200 })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// PUT /api/notifications — Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { emailNotifications, smsNotifications, pushNotifications } = body

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(smsNotifications !== undefined && { smsNotifications }),
        ...(pushNotifications !== undefined && { pushNotifications }),
      },
      select: {
        id: true,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
      },
    })

    return NextResponse.json(successResponse(updatedUser, 'Notification preferences updated'), { status: 200 })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
