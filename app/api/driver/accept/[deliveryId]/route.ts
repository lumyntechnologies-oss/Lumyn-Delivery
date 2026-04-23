import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse } from '@/lib/api-response'

// POST /api/driver/accept/:deliveryId — Driver accepts a delivery assignment
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

    // Get driver user
    const driver = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, isDriverVerified: true },
    })

    if (!driver || driver.role !== 'DRIVER') {
      const [response, status] = errorResponse('Only drivers can accept deliveries', 403)
      return NextResponse.json(response, { status })
    }

    if (!driver.isDriverVerified) {
      const [response, status] = errorResponse('Your driver account is not verified yet', 403)
      return NextResponse.json(response, { status })
    }

    // Get delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { driver: true },
    })

    if (!delivery) {
      const [response, status] = notFoundResponse('Delivery')
      return NextResponse.json(response, { status })
    }

    if (delivery.driverId !== driver.id) {
      const [response, status] = errorResponse('This delivery is not assigned to you', 403)
      return NextResponse.json(response, { status })
    }

    if (delivery.status !== 'ASSIGNED') {
      const [response, status] = errorResponse(`Delivery is in ${delivery.status} state and cannot be accepted`, 400)
      return NextResponse.json(response, { status })
    }

    // Update delivery status to PICKED_UP (driver accepts and picks up)
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'PICKED_UP',
        pickupTime: new Date(),
      },
      include: {
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
        customer: true,
      },
    })

    return NextResponse.json(
      successResponse(updatedDelivery, 'Delivery accepted and pickup confirmed'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error accepting delivery:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
