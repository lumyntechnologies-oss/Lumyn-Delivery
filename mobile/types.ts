// Shared type definitions for the mobile app
// These mirror the backend Prisma models and API responses

export type UserRole = 'ADMIN' | 'DRIVER' | 'CUSTOMER';
export type DeliveryStatus = 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type ApplicationStatus = 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUIRED';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phone?: string;
  isAdmin: boolean;
  profileImage?: string;
  // Driver-specific fields
  licenseNumber?: string;
  licenseExpiry?: string; // ISO date
  vehicleType?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehiclePlate?: string;
  vehicleColor?: string;
  isDriverVerified: boolean;
  isDriverActive: boolean;
  driverRating: number;
  totalDeliveries: number;
  bio?: string;
  yearsOfExperience?: number;
  languages?: string[]; // JSON array
  // Location
  latitude?: number;
  longitude?: number;
  lastLocationUpdate?: string;
  // Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  // Onboarding
  onboardingStep: number;
  onboardingCompleted: boolean;
  applicationStatus?: ApplicationStatus;
}

export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  label?: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
}

export interface Delivery {
  id: string;
  customerId: string;
  driverId?: string;
  pickupAddressId: string;
  dropoffAddressId: string;
  status: DeliveryStatus;
  priority: Priority;
  description: string;
  weight?: number;
  dimensions?: string; // "L×W×H cm"
  notes?: string;
  pickupTime?: string;
  deliveryTime?: string;
  scheduledTime?: string;
  assignedAt?: string;
  // Relationships
  customer?: Pick<User, 'id' | 'firstName' | 'lastName' | 'phone' | 'profileImage'>;
  driver?: Pick<User, 'id' | 'firstName' | 'lastName' | 'driverRating' | 'phone' | 'profileImage'>;
  pickupAddress?: Address;
  dropoffAddress?: Address;
  // Financial
  cost: number;
  tip: number;
  paymentStatus: PaymentStatus;
  paymentCurrency: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryDetails extends Delivery {
  review?: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
  };
}

export interface DriverApplicationData {
  licenseNumber: string;
  licenseExpiry: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  vehicleColor?: string;
  phone?: string;
  bio?: string;
  yearsOfExperience?: number;
  languages?: string[];
  // Document URLs (from Cloudinary upload)
  idCardUrl: string;
  driversLicenseUrl: string;
  vehicleRegistrationUrl: string;
  insuranceCertificateUrl?: string;
  profilePhotoUrl?: string;
}

export interface DeliveryFormData {
  pickupAddressId: string;
  dropoffAddressId: string;
  description: string;
  cost: number; // pre-calculated from pricing API
  priority?: Priority;
  notes?: string;
  weight?: number;
  dimensions?: string;
}

export interface PricingRule {
  id?: string;
  name: string;
  baseFare: number;
  costPerKm: number;
  minimumFare: number;
  priorityMultiplier: Record<string, number>;
}

export interface DriverEarnings {
  stats: {
    totalEarnings: number;
    totalTips: number;
    weeklyEarnings: number;
    monthlyEarnings: number;
    totalDeliveries: number;
    completedDeliveries: number;
    pendingPayouts: number;
    paidOut: number;
  };
  recentDeliveries: Array<{
    id: string;
    cost: number;
    tip: number;
    status: string;
    completedAt: string;
  }>;
  payouts: Array<{
    id: string;
    amount: number;
    status: string;
    paidAt?: string;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  limit: number;
  offset: number;
}

// For SSE events
export interface SSEEvent {
  event: 'connected' | 'update' | 'statusChange' | 'ping';
  data: {
    deliveryId: string;
    status?: DeliveryStatus;
    driverId?: string;
    location?: { latitude: number; longitude: number };
    timestamp: string;
    [key: string]: any;
  };
}

// Upload response
export interface UploadResponse {
  url: string;
  publicId: string;
  size: number;
  mimeType: string;
}
