import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { DocumentType } from '@prisma/client'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// POST /api/drivers/apply — Submit driver application with all details
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const {
      licenseNumber,
      licenseExpiry,
      vehicleType,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehiclePlate,
      vehicleColor,
      phone,
      bio,
      yearsOfExperience,
      languages,
      idCardUrl,
      driversLicenseUrl,
      vehicleRegistrationUrl,
      insuranceCertificateUrl,
      profilePhotoUrl,
    } = body

    // Validate required fields
    if (!licenseNumber || !licenseExpiry || !vehicleType || !vehicleMake || !vehicleModel || !vehicleYear || !vehiclePlate) {
      const [response, status] = errorResponse('Missing required driver fields', 400)
      return NextResponse.json(response, { status })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    // Update user to driver role and add all details
    const updateData: any = {
      role: 'DRIVER',
      licenseNumber,
      licenseExpiry: new Date(licenseExpiry),
      vehicleType,
      vehicleMake,
      vehicleModel,
      vehicleYear: parseInt(vehicleYear),
      vehiclePlate,
      vehicleColor: vehicleColor || undefined,
      phone: phone || undefined,
      bio: bio || undefined,
      yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined,
      languages: languages ? JSON.stringify(languages) : undefined,
      isDriverActive: true,
      onboardingStep: 6,
      onboardingCompleted: true,
      applicationStatus: 'SUBMITTED',
    }

    const driver = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        role: true,
        licenseNumber: true,
        licenseExpiry: true,
        vehicleType: true,
        vehicleMake: true,
        vehicleModel: true,
        vehicleYear: true,
        vehiclePlate: true,
        vehicleColor: true,
        isDriverVerified: true,
        isDriverActive: true,
        driverRating: true,
        totalDeliveries: true,
        bio: true,
        yearsOfExperience: true,
        languages: true,
        applicationStatus: true,
        onboardingCompleted: true,
      },
    })

    // Create driver document records
    const documents = [
      { type: 'ID_CARD', url: idCardUrl },
      { type: 'DRIVERS_LICENSE', url: driversLicenseUrl },
      { type: 'VEHICLE_REGISTRATION', url: vehicleRegistrationUrl },
      { type: 'INSURANCE_CERTIFICATE', url: insuranceCertificateUrl },
      { type: 'PROFILE_PHOTO', url: profilePhotoUrl },
    ]

    for (const doc of documents) {
      await prisma.driverDocument.create({
        data: {
          userId: user.id,
          type: doc.type as any,
          name: doc.type.replace('_', ' '),
          url: doc.url,
          mimeType: 'image/jpeg',
          size: 0,
        },
      })
    }

    return NextResponse.json(successResponse(driver, 'Driver application submitted successfully'), { status: 201 })
  } catch (error) {
    console.error('Error submitting driver application:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
