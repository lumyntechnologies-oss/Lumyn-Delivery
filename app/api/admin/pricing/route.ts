import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const pricingSchema = z.object({
  name: z.string().min(1, 'Name required'),
  baseFare: z.number().min(0),
  costPerKm: z.number().min(0),
  minimumFare: z.number().min(0),
  priorityMultiplier: z.record(z.number()),
  vehicleType: z.string().optional(),
})

// GET /api/admin/pricing — Get all pricing rules (admin only)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    // Check admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })
    if (!user || user.role !== 'ADMIN') {
      const [response, status] = errorResponse('Admin access required', 403)
      return NextResponse.json(response, { status })
    }

    const rules = await prisma.pricingRule.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(
      successResponse(rules.map(r => ({
        ...r,
        priorityMultiplier: JSON.parse(r.priorityMultiplier as string),
      }))),
      { status: 200 }
    )
  } catch (error) {
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// POST /api/admin/pricing — Create pricing rule (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })
    if (!user || user.role !== 'ADMIN') {
      const [response, status] = errorResponse('Admin access required', 403)
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const validated = pricingSchema.parse(body)

    const rule = await prisma.pricingRule.create({
      data: {
        name: validated.name,
        baseFare: validated.baseFare,
        costPerKm: validated.costPerKm,
        minimumFare: validated.minimumFare,
        priorityMultiplier: JSON.stringify(validated.priorityMultiplier),
        vehicleType: validated.vehicleType || null,
        active: true,
      },
    })

    return NextResponse.json(
      successResponse({ ...rule, priorityMultiplier: validated.priorityMultiplier }, 'Pricing rule created'),
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('Validation error: ' + error.errors[0]?.message),
        { status: 400 }
      )
    }
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
