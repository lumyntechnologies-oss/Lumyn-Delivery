import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'
import { checkAdminAccess } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      const [response, status] = errorResponse('You do not have access to this resource', 403)
      return NextResponse.json(response, { status })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'month'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    // Get total deliveries
    const totalDeliveries = await prisma.delivery.count()
    const deliveriesInPeriod = await prisma.delivery.count({
      where: { createdAt: { gte: startDate } },
    })

    // Get total users
    const totalUsers = await prisma.user.count()
    const customersCount = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    })

    // Get total drivers
    const totalDrivers = await prisma.driver.count()
    const verifiedDrivers = await prisma.driver.count({
      where: { isVerified: true },
    })

    // Get revenue
    const deliveryRevenue = await prisma.delivery.aggregate({
      _sum: { cost: true },
    })
    const tipRevenue = await prisma.delivery.aggregate({
      _sum: { tip: true },
    })
    const totalRevenue = (deliveryRevenue._sum.cost || 0) + (tipRevenue._sum.tip || 0)

    const revenueInPeriod = await prisma.delivery.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { cost: true },
    })

    // Get delivery status breakdown
    const deliveryStatus = await prisma.delivery.groupBy({
      by: ['status'],
      _count: true,
    })

    // Get average rating
    const ratings = await prisma.review.aggregate({
      _avg: { rating: true },
    })

    // Get most active drivers
    const topDrivers = await prisma.driver.findMany({
      take: 5,
      orderBy: { totalDeliveries: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    })

    // Get revenue by day (last 7 days)
    const revenueTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayRevenue = await prisma.delivery.aggregate({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: { cost: true },
      })

      revenueTrend.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue._sum.cost || 0,
      })
    }

    const analytics = {
      summary: {
        totalDeliveries,
        deliveriesInPeriod,
        totalUsers,
        customersCount,
        totalDrivers,
        verifiedDrivers,
        totalRevenue,
        revenueInPeriod: revenueInPeriod._sum.cost || 0,
        averageRating: ratings._avg.rating || 0,
      },
      deliveryStatus,
      topDrivers,
      revenueTrend,
    }

    return NextResponse.json(successResponse(analytics), { status: 200 })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
