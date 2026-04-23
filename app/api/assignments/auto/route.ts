import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendDeliveryStatusPush } from '@/lib/notifications/push'
import { notifyDeliveryAssigned } from '@/lib/notifications/notifier'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse } from '@/lib/api-response'

// POST /api/assignments/auto — Auto-assign a PENDING delivery to nearest available driver
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    // Only admins can trigger manual auto-assignment
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user || user.role !== 'ADMIN') {
      const [response, status] = errorResponse('Only admins can assign deliveries', 403)
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { deliveryId } = body

    if (!deliveryId) {
      const [response, status] = errorResponse('deliveryId is required', 400)
      return NextResponse.json(response, { status })
    }

    // Get the pending delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        pickupAddress: true,
        customer: true,
      },
    })

    if (!delivery) {
      const [response, status] = notFoundResponse('Delivery')
      return NextResponse.json(response, { status })
    }

    if (delivery.status !== 'PENDING') {
      const [response, status] = errorResponse(`Delivery is already ${delivery.status}`, 400)
      return NextResponse.json(response, { status })
    }

    // Find nearest available verified driver
    const availableDrivers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
        isDriverActive: true,
        isDriverVerified: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        driverRating: true,
        totalDeliveries: true,
        vehicleType: true,
        vehiclePlate: true,
        latitude: true,
        longitude: true,
      },
    })

    if (availableDrivers.length === 0) {
      const [response, status] = errorResponse('No available drivers found', 404)
      return NextResponse.json(response, { status })
    }

    // Calculate distance from pickup address to each driver (Haversine formula)
    const pickupLat = delivery.pickupAddress.latitude
    const pickupLng = delivery.pickupAddress.longitude

    if (!pickupLat || !pickupLng) {
      // Fallback: assign to highest-rated driver
      const selectedDriver = availableDrivers.sort((a, b) => (b.driverRating || 0) - (a.driverRating || 0))[0]
      
      // Assign delivery
      const updatedDelivery = await prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          driverId: selectedDriver.id,
          status: 'ASSIGNED',
          assignedAt: new Date(),
        },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              driverRating: true,
              vehicleType: true,
              vehiclePlate: true,
            },
          },
          pickupAddress: true,
          dropoffAddress: true,
          customer: true,
        },
      })

      return NextResponse.json(
        successResponse(updatedDelivery, 'Delivery assigned successfully (by rating)'),
        { status: 200 }
      )
    }

    // Calculate distance for each driver
    const driversWithDistance = availableDrivers.map(driver => {
      if (!driver.latitude || !driver.longitude) return null
      const distance = calculateDistance(
        pickupLat, pickupLng,
        driver.latitude, driver.longitude
      )
      return { ...driver, distance }
    }).filter(d => d !== null)

    // Sort by distance, then by rating as tiebreaker
    driversWithDistance.sort((a, b) => {
      const distDiff = (a.distance as number) - (b.distance as number)
      if (distDiff !== 0) return distDiff
      return (b.driverRating || 0) - (a.driverRating || 0)
    })

    const selectedDriver = driversWithDistance[0]

     // Assign delivery
     const updatedDelivery = await prisma.delivery.update({
       where: { id: deliveryId },
       data: {
         driverId: selectedDriver.id,
         status: 'ASSIGNED',
         assignedAt: new Date(),
         distance: selectedDriver.distance as number,
       },
       include: {
         driver: {
           select: {
             id: true,
             firstName: true,
             lastName: true,
             email: true,
             phone: true,
             driverRating: true,
             vehicleType: true,
             vehiclePlate: true,
           },
         },
         pickupAddress: true,
         dropoffAddress: true,
         customer: true,
       },
     })

      // Send push notification to customer
      await sendDeliveryStatusPush(deliveryId, 'ASSIGNED')
      
      // Also send email/SMS if preferences allow
      await notifyDeliveryAssigned(deliveryId)

     return NextResponse.json(
       successResponse(updatedDelivery, 'Delivery assigned successfully'),
       { status: 200 }
     )
  } catch (error) {
    console.error('Error auto-assigning delivery:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// Haversine formula for distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
