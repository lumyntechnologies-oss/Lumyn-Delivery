import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// POST /api/driver/location — Driver sends current location
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const driver = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!driver || driver.role !== 'DRIVER') {
      const [response, status] = errorResponse('Only drivers can update location', 403)
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { latitude, longitude, speed, heading, accuracy } = body

    if (latitude === undefined || longitude === undefined) {
      const [response, status] = errorResponse('Latitude and longitude are required', 400)
      return NextResponse.json(response, { status })
    }

    // Update driver location
    await prisma.user.update({
      where: { id: driver.id },
      data: {
        latitude,
        longitude,
        lastLocationUpdate: new Date(),
        ...(speed !== undefined && { speed }),
        ...(heading !== undefined && { heading }),
        ...(accuracy !== undefined && { accuracy }),
      },
    })

    return NextResponse.json(
      successResponse({ latitude, longitude }, 'Location updated'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating location:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// GET /api/driver/location — Get driver's current location (for customer view)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')

    if (!driverId) {
      const [response, status] = errorResponse('driverId is required', 400)
      return NextResponse.json(response, { status })
    }

    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        latitude: true,
        longitude: true,
        lastLocationUpdate: true,
        driverRating: true,
        vehicleType: true,
        vehiclePlate: true,
      },
    })

    if (!driver || driver.role !== 'DRIVER') {
      const [response, status] = errorResponse('Driver not found', 404)
      return NextResponse.json(response, { status })
    }

    return NextResponse.json(
      successResponse(driver, 'Driver location fetched'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching driver location:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
