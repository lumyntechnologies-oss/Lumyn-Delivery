import { useAuth, useUser, useClerk } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

// Extend Clerk's user with our app-specific metadata
interface AppUser {
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

export function useRNMobileAuth() {
  const { getToken, signOut } = useAuth();
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  // Cast user to include our custom metadata fields
  const user = clerkUser as AppUser | null;

  // Get auth token for API calls
  const getAuthToken = async () => {
    if (!isSignedIn || !user) return null;
    try {
      const token = await getToken();
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Logout clears local token
  const logout = async () => {
    await SecureStore.deleteItemAsync('clerk_token');
    await clerkSignOut();
  };

  return {
    user,
    isSignedIn,
    isLoaded,
    getAuthToken,
    logout,
  };
}
