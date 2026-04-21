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

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, profileImage: true },
        },
      },
    })

    if (!driver) {
      const [response, status] = errorResponse('Driver profile not found', 404)
      return NextResponse.json(response, { status })
    }

    return NextResponse.json(successResponse(driver), { status: 200 })
  } catch (error) {
    console.error('Error fetching driver profile:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { licenseExpiry, vehicleType, vehiclePlate, isActive } = body

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    const driver = await prisma.driver.update({
      where: { userId: user.id },
      data: {
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
        vehicleType: vehicleType || undefined,
        vehiclePlate: vehiclePlate || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, profileImage: true },
        },
      },
    })

    return NextResponse.json(successResponse(driver, 'Driver profile updated successfully'), { status: 200 })
  } catch (error) {
    console.error('Error updating driver profile:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
