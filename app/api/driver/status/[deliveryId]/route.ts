import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { notifyDeliveryStatusChange } from '@/lib/notifications/notifier'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse } from '@/lib/api-response'

// POST /api/driver/status/:deliveryId — Driver updates delivery status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const { deliveryId } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['IN_TRANSIT', 'DELIVERED'].includes(status)) {
      const [response, statusCode] = errorResponse('Status must be IN_TRANSIT or DELIVERED', 400)
      return NextResponse.json(response, { status: statusCode })
    }

    // Get driver user
    const driver = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, isDriverVerified: true },
    })

    if (!driver || driver.role !== 'DRIVER') {
      const [response, statusCode] = errorResponse('Only drivers can update delivery status', 403)
      return NextResponse.json(response, { status: statusCode })
    }

    // Get delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { driver: true },
    })

    if (!delivery) {
      const [response, statusCode] = notFoundResponse('Delivery')
      return NextResponse.json(response, { status: statusCode })
    }

    if (delivery.driverId !== driver.id) {
      const [response, statusCode] = errorResponse('This delivery is not assigned to you', 403)
      return NextResponse.json(response, { status: statusCode })
    }

    // Validate status transition
    if (status === 'IN_TRANSIT' && delivery.status !== 'PICKED_UP') {
      const [response, statusCode] = errorResponse('Cannot mark as in transit before pickup', 400)
      return NextResponse.json(response, { status: statusCode })
    }

    if (status === 'DELIVERED' && delivery.status !== 'IN_TRANSIT') {
      const [response, statusCode] = errorResponse('Cannot deliver before in transit', 400)
      return NextResponse.json(response, { status: statusCode })
    }

    // Prepare update
    const updateData: any = { status }
    if (status === 'IN_TRANSIT') {
      updateData.estimatedTime = calculateEstimatedTime(delivery.distance || 0)
    } else if (status === 'DELIVERED') {
      updateData.deliveryTime = new Date()
      // Increment driver's total deliveries
      await prisma.user.update({
        where: { id: driver.id },
        data: { totalDeliveries: { increment: 1 } },
      })
    }

    // Update delivery
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            driverRating: true,
            vehicleType: true,
            vehiclePlate: true,
          },
        },
        pickupAddress: true,
        dropoffAddress: true,
        review: true,
      },
    })

     // Send notifications (push, email, SMS based on prefs)
     await notifyDeliveryStatusChange(deliveryId, status)

    const message = status === 'IN_TRANSIT' ? 'Delivery in transit' : 'Delivery completed'
    return NextResponse.json(
      successResponse(updatedDelivery, message),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating delivery status:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// Simple ETA calculator (assumes avg 30km/h in city)
function calculateEstimatedTime(distanceKm: number): number {
  const avgSpeedKmH = 30
  const timeHours = distanceKm / avgSpeedKmH
  return Math.round(timeHours * 60) // minutes
}
