import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/notifications/push'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// POST /api/notifications/test — Send test push notification to current user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const result = await sendPushNotification(userId, {
      title: 'Test Notification',
      body: 'This is a test push notification from Lumyn Delivery!',
      icon: '/icon-192x192.png',
      url: '/deliveries',
    })

    return NextResponse.json(
      successResponse(result, `Sent: ${result.success}, Failed: ${result.failed}`),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending test notification:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
