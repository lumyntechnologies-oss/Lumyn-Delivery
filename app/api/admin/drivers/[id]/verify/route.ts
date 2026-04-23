import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'
import { sendDriverApplicationApprovedEmail, sendDriverApplicationRejectedEmail } from '@/lib/notifications/email'

// PATCH /api/admin/drivers/[id]/verify — Verify or reject driver application (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      const [response, status] = errorResponse('Admin access required', 403)
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { approved, rejectionReason } = body

    if (typeof approved !== 'boolean') {
      const [response, status] = errorResponse('approved field is required and must be boolean', 400)
      return NextResponse.json(response, { status })
    }

    // Check if driver exists
    const driver = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!driver || driver.role !== 'DRIVER') {
      const [response, status] = errorResponse('Driver not found', 404)
      return NextResponse.json(response, { status })
    }

    // Update driver verification status
    const updateData: any = {
      isDriverVerified: approved,
      applicationStatus: approved ? 'APPROVED' : 'REJECTED',
      isDriverActive: approved ? true : false,
    }

    // If rejecting, update all documents as not verified with reason
    if (!approved && rejectionReason) {
      await prisma.driverDocument.updateMany({
        where: { userId: driver.id },
        data: {
          isVerified: false,
          rejectionReason: rejectionReason,
        },
      })
    } else if (approved) {
      // If approved, mark all documents as verified
      await prisma.driverDocument.updateMany({
        where: { userId: driver.id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      })
    }

    const updatedDriver = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        driverRating: true,
        totalDeliveries: true,
        isDriverVerified: true,
        isDriverActive: true,
        vehicleType: true,
        vehiclePlate: true,
        licenseNumber: true,
        applicationStatus: true,
        onboardingCompleted: true,
      },
    })

    // Send email notification
    const driverName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Driver'
    try {
      if (approved) {
        await sendDriverApplicationApprovedEmail(driver.email, driverName)
      } else {
        await sendDriverApplicationRejectedEmail(driver.email, driverName, rejectionReason || 'Your application did not meet our requirements.')
      }
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(successResponse(updatedDriver, `Driver ${approved ? 'approved' : 'rejected'} successfully`), { status: 200 })
  } catch (error) {
    console.error('Error verifying driver:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
