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
      select: { id: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    const address = await prisma.address.findUnique({
      where: { id },
    })

    if (!address || address.userId !== user.id) {
      const [response, status] = notFoundResponse('Address')
      return NextResponse.json(response, { status })
    }

    return NextResponse.json(successResponse(address), { status: 200 })
  } catch (error) {
    console.error('Error fetching address:', error)
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
    const { street, city, state, zipCode, country, label, latitude, longitude, isDefault } = body

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    const address = await prisma.address.findUnique({
      where: { id },
    })

    if (!address || address.userId !== user.id) {
      const [response, status] = notFoundResponse('Address')
      return NextResponse.json(response, { status })
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        street: street || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        country: country || undefined,
        label: label || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
      },
    })

    return NextResponse.json(successResponse(updatedAddress, 'Address updated successfully'), { status: 200 })
  } catch (error) {
    console.error('Error updating address:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

export async function DELETE(
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
      select: { id: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    const address = await prisma.address.findUnique({
      where: { id },
    })

    if (!address || address.userId !== user.id) {
      const [response, status] = notFoundResponse('Address')
      return NextResponse.json(response, { status })
    }

    await prisma.address.delete({
      where: { id },
    })

    return NextResponse.json(successResponse(null, 'Address deleted successfully'), { status: 200 })
  } catch (error) {
    console.error('Error deleting address:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
