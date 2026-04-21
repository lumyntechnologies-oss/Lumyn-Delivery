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
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    return NextResponse.json(successResponse(user), { status: 200 })
  } catch (error) {
    console.error('Error fetching profile:', error)
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
    const { firstName, lastName, phone } = body

    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
      },
    })

    return NextResponse.json(successResponse(user, 'Profile updated successfully'), { status: 200 })
  } catch (error) {
    console.error('Error updating profile:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
