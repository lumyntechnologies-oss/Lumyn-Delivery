import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// GET /api/drivers — Get all drivers (admin only)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const verified = searchParams.get('verified')

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user || user.role !== 'ADMIN') {
      const [response, status] = errorResponse('Admin access required', 403)
      return NextResponse.json(response, { status })
    }

    let whereClause: any = { role: 'DRIVER' }
    if (verified === 'true') {
      whereClause.isDriverVerified = true
    } else if (verified === 'false') {
      whereClause.isDriverVerified = false
    }

    const drivers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        driverRating: true,
        totalDeliveries: true,
        isDriverVerified: true,
        isDriverActive: true,
        vehicleType: true,
        vehiclePlate: true,
        licenseNumber: true,
        createdAt: true,
      },
      take: limit,
      skip: offset,
      orderBy: { driverRating: 'desc' },
    })

    const total = await prisma.user.count({ where: whereClause })

    return NextResponse.json(
      successResponse({ drivers, total, limit, offset }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching drivers:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// POST /api/drivers — Register as driver (create driver profile)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { licenseNumber, licenseExpiry, vehicleType, vehiclePlate } = body

    if (!licenseNumber || !licenseExpiry || !vehicleType || !vehiclePlate) {
      const [response, status] = errorResponse('Missing required driver fields', 400)
      return NextResponse.json(response, { status })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    if (user.role === 'DRIVER') {
      const [response, status] = errorResponse('User is already registered as a driver', 400)
      return NextResponse.json(response, { status })
    }

    // Update user to driver role and add driver details
    const driver = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'DRIVER',
        licenseNumber,
        licenseExpiry: new Date(licenseExpiry),
        vehicleType,
        vehiclePlate,
        isDriverActive: true,
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        role: true,
        licenseNumber: true,
        licenseExpiry: true,
        vehicleType: true,
        vehiclePlate: true,
        isDriverVerified: true,
        isDriverActive: true,
        driverRating: true,
        totalDeliveries: true,
      },
    })

    return NextResponse.json(successResponse(driver, 'Driver registered successfully'), { status: 201 })
  } catch (error) {
    console.error('Error creating driver:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
