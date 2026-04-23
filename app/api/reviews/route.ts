import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deliveryId = searchParams.get('deliveryId')
    const driverId = searchParams.get('driverId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause: any = {}

    if (deliveryId) {
      whereClause.deliveryId = deliveryId
    }

    if (driverId) {
      whereClause.delivery = {
        driver: {
          id: driverId,
        },
      }
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        user: {
          select: { firstName: true, lastName: true, profileImage: true },
        },
        delivery: {
          select: { description: true },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.review.count({ where: whereClause })

    return NextResponse.json(
      successResponse({ reviews, total, limit, offset }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching reviews:', error)
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
    const { deliveryId, rating, comment } = body

    if (!deliveryId || rating === undefined) {
      const [response, status] = errorResponse('Missing required fields', 400)
      return NextResponse.json(response, { status })
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      const [response, status] = errorResponse('Rating must be a whole number between 1 and 5', 400)
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

    // Check if delivery exists and user is the customer
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { customerId: true, driverId: true, status: true },
    })

    if (!delivery) {
      const [response, status] = errorResponse('Delivery not found', 404)
      return NextResponse.json(response, { status })
    }

    if (delivery.customerId !== user.id) {
      const [response, status] = errorResponse('Only the customer can review this delivery', 403)
      return NextResponse.json(response, { status })
    }

    if (delivery.status !== 'DELIVERED') {
      const [response, status] = errorResponse('Can only review completed deliveries', 400)
      return NextResponse.json(response, { status })
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { deliveryId },
    })

    if (existingReview) {
      const [response, status] = errorResponse('Review already exists for this delivery', 400)
      return NextResponse.json(response, { status })
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        deliveryId,
        userId: user.id,
        rating,
        comment: comment || null,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, profileImage: true },
        },
        delivery: {
          select: { description: true, driverId: true },
        },
      },
    })

    // Update driver rating
    if (delivery.driverId) {
      const allReviews = await prisma.review.findMany({
        where: {
          delivery: {
            driverId: delivery.driverId,
          },
        },
        select: { rating: true },
      })

       const averageRating =
         allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

       await prisma.user.update({
         where: { id: delivery.driverId },
         data: { driverRating: averageRating },
       })
    }

    return NextResponse.json(successResponse(review, 'Review created successfully'), { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
