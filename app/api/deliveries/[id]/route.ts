import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse } from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

     const delivery = await prisma.delivery.findUnique({
       where: { id },
       include: {
         customer: {
           select: { id: true, firstName: true, lastName: true, email: true, phone: true },
         },
         driver: {
           select: {
             id: true,
             driverRating: true,
             licenseNumber: true,
             firstName: true,
             lastName: true,
             email: true,
             phone: true,
           },
         },
         pickupAddress: true,
         dropoffAddress: true,
         review: true,
       },
     })

    if (!delivery) {
      const [response, status] = notFoundResponse('Delivery')
      return NextResponse.json(response, { status })
    }

    // Check access - only customer, assigned driver, or admin can view
    if (
      user.role !== 'ADMIN' &&
      delivery.customerId !== user.id &&
      delivery.driver?.id !== user.id
    ) {
      const [response, status] = errorResponse('You do not have access to this delivery', 403)
      return NextResponse.json(response, { status })
    }

    return NextResponse.json(successResponse(delivery), { status: 200 })
  } catch (error) {
    console.error('Error fetching delivery:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const { id } = await params
    const body = await request.json()
    const { status, tip, notes } = body

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      select: { customerId: true, driverId: true },
    })

    if (!delivery) {
      const [response, status] = notFoundResponse('Delivery')
      return NextResponse.json(response, { status })
    }

    // Check access - only customer, assigned driver, or admin can update
    if (
      user.role !== 'ADMIN' &&
      delivery.customerId !== user.id &&
      delivery.driverId !== user.id
    ) {
      const [response, status] = errorResponse('You do not have access to update this delivery', 403)
      return NextResponse.json(response, { status })
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: {
        status: status || undefined,
        tip: tip !== undefined ? parseFloat(tip) : undefined,
        notes: notes || undefined,
      },
       include: {
         customer: {
           select: { id: true, firstName: true, lastName: true, email: true, phone: true },
         },
         driver: {
           select: {
             id: true,
             driverRating: true,
             licenseNumber: true,
             firstName: true,
             lastName: true,
             email: true,
             phone: true,
           },
         },
         pickupAddress: true,
         dropoffAddress: true,
         review: true,
       },
    })

    return NextResponse.json(successResponse(updatedDelivery, 'Delivery updated successfully'), { status: 200 })
  } catch (error) {
    console.error('Error updating delivery:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
