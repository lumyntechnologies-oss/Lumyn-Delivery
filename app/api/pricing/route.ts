import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// GET /api/pricing — Get active pricing rules (frontend uses this)
export async function GET(request: NextRequest) {
  try {
    // Allow anyone to fetch pricing (no auth required for frontend calculator)
    const rules = await prisma.pricingRule.findMany({
      where: { active: true },
      orderBy: { updatedAt: 'desc' },
    })

    if (rules.length === 0) {
      // Return default pricing
      return NextResponse.json(
        successResponse({
          default: {
            baseFare: 500,
            costPerKm: 50,
            minimumFare: 800,
            priorityMultiplier: { NORMAL: 1, URGENT: 1.5, HIGH: 1.3, LOW: 0.9 },
          }
        }),
        { status: 200 }
      )
    }

    const activeRule = rules[0]
    return NextResponse.json(
      successResponse({
        id: activeRule.id,
        baseFare: activeRule.baseFare,
        costPerKm: activeRule.baseFare,
        minimumFare: activeRule.minimumFare,
        priorityMultiplier: JSON.parse(activeRule.priorityMultiplier as string),
        vehicleType: activeRule.vehicleType,
        name: activeRule.name,
      }),
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { baseFare: 500, costPerKm: 50, minimumFare: 800, priorityMultiplier: { NORMAL: 1, URGENT: 1.5, HIGH: 1.3, LOW: 0.9 } },
      { status: 200 }
    )
  }
}
