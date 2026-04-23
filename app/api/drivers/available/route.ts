import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// GET /api/drivers/available — Get all available drivers (for customers/admins)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    // Only admins and customers can see available drivers
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'CUSTOMER')) {
      const [response, status] = errorResponse('Unauthorized', 403)
      return NextResponse.json(response, { status })
    }

    const availableDrivers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
        isDriverActive: true,
        isDriverVerified: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        driverRating: true,
        totalDeliveries: true,
        vehicleType: true,
        vehiclePlate: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { driverRating: 'desc' },
    })

    return NextResponse.json(
      successResponse({ drivers: availableDrivers }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching available drivers:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// POST /api/drivers/available — Driver toggles availability & updates location
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, isDriverActive: true },
    })

    if (!user || user.role !== 'DRIVER') {
      const [response, status] = errorResponse('Only drivers can update availability', 403)
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { isActive, latitude, longitude } = body

    // Update driver availability and optionally location
    const updatedDriver = await prisma.user.update({
      where: { id: user.id },
      data: {
        isDriverActive: isActive !== undefined ? isActive : !user.isDriverActive,
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(latitude !== undefined || longitude !== undefined ? { lastLocationUpdate: new Date() } : {}),
      },
      select: {
        id: true,
        isDriverActive: true,
        latitude: true,
        longitude: true,
        lastLocationUpdate: true,
      },
    })

    return NextResponse.json(
      successResponse(updatedDriver, `Driver is now ${updatedDriver.isDriverActive ? 'online' : 'offline'}`),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating driver availability:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
