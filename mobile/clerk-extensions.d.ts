// Augment Clerk's UserResource type with our app-specific fields
import '@clerk/clerk-expo';

declare module '@clerk/clerk-expo' {
  interface UserResource {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: 'ADMIN' | 'DRIVER' | 'CUSTOMER';
    isDriverActive?: boolean;
    isDriverVerified?: boolean;
    driverRating?: number;
    totalDeliveries?: number;
    vehicleType?: string;
    vehiclePlate?: string;
    onboardingStep?: number;
    onboardingCompleted?: boolean;
    applicationStatus?: string;
    latitude?: number;
    longitude?: number;
  }
}
