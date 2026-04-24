import { z } from 'zod'

// Delivery creation schema
export const deliverySchema = z.object({
  description: z.string().min(5, 'Description must be at least 5 characters').max(200),
  pickupAddressId: z.string().uuid('Invalid pickup address'),
  dropoffAddressId: z.string().uuid('Invalid dropoff address'),
  cost: z.number().min(100, 'Minimum cost is KSh 100').max(100000, 'Maximum cost is KSh 100,000'),
  tip: z.number().min(0).max(50000).optional().default(0),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  notes: z.string().max(500).optional(),
  weight: z.number().min(0).max(1000).optional(),
  dimensions: z.string().regex(/^\d+×\d+×\d+$/i, 'Format: L×W×H in cm').optional().or(z.literal('')),
})

// Driver application schema
export const driverApplicationSchema = z.object({
  licenseNumber: z.string().min(5, 'License number required'),
  licenseExpiry: z.string().refine(
    (date) => new Date(date) > new Date(),
    { message: 'License must not be expired' }
  ),
  vehicleType: z.enum(['sedan', 'suv', 'truck', 'van', 'motorcycle', 'bicycle', 'scooter']),
  vehicleMake: z.string().min(2, 'Vehicle make required'),
  vehicleModel: z.string().min(2, 'Vehicle model required'),
  vehicleYear: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  vehiclePlate: z.string().min(3, 'License plate required'),
  vehicleColor: z.string().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  bio: z.string().max(500).optional(),
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
  languages: z.array(z.string()).max(5).optional(),
  // URLs will be validated by existence, not format
  idCardUrl: z.string().url('Invalid ID card URL'),
  driversLicenseUrl: z.string().url('Invalid driver license URL'),
  vehicleRegistrationUrl: z.string().url('Invalid registration URL'),
  insuranceCertificateUrl: z.string().url('Invalid insurance URL'),
  profilePhotoUrl: z.string().url('Invalid profile photo URL'),
})

// Address schema
export const addressSchema = z.object({
  street: z.string().min(5, 'Street address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State/Province required'),
  zipCode: z.string().min(3, 'ZIP code required'),
  country: z.string().min(2, 'Country required'),
  label: z.enum(['Home', 'Work', 'Other']),
  isDefault: z.boolean().default(false),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

// User profile update schema
export const profileUpdateSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
})

// Type helpers
export type DeliveryFormData = z.infer<typeof deliverySchema>
export type DriverApplicationData = z.infer<typeof driverApplicationSchema>
export type AddressFormData = z.infer<typeof addressSchema>
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>

// Validation helpers
export function validateDelivery(data: unknown) {
  return deliverySchema.safeParse(data)
}

export function validateDriverApplication(data: unknown) {
  return driverApplicationSchema.safeParse(data)
}

export function validateAddress(data: unknown) {
  return addressSchema.safeParse(data)
}

export function validateProfileUpdate(data: unknown) {
  return profileUpdateSchema.safeParse(data)
}
