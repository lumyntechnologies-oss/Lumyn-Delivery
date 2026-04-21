import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

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

    let whereClause: any = {}
    if (verified === 'true') {
      whereClause.isVerified = true
    } else if (verified === 'false') {
      whereClause.isVerified = false
    }

    const drivers = await prisma.driver.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { rating: 'desc' },
    })

    const total = await prisma.driver.count({ where: whereClause })

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
      select: { id: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    // Check if user is already a driver
    const existingDriver = await prisma.driver.findUnique({
      where: { userId: user.id },
    })

    if (existingDriver) {
      const [response, status] = errorResponse('User is already registered as a driver', 400)
      return NextResponse.json(response, { status })
    }

    // Update user role to DRIVER
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'DRIVER' },
    })

    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        licenseNumber,
        licenseExpiry: new Date(licenseExpiry),
        vehicleType,
        vehiclePlate,
        isVerified: false,
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
    })

    return NextResponse.json(successResponse(driver, 'Driver registered successfully'), { status: 201 })
  } catch (error) {
    console.error('Error creating driver:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
