import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useRNMobileAuth } from '../hooks/useAuth';
import { driverApi } from '../api/driver';
import { subscribeToNotifications } from '../utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { logout, user } = useRNMobileAuth();
  const [isDriverActive, setIsDriverActive] = useState(user?.isDriverActive || false);
  const [loading, setLoading] = useState(false);

  const isDriver = user?.role === 'DRIVER';
  const isOnline = isDriverActive;

  const handleToggleActive = async (value: boolean) => {
    setLoading(true);
    setIsDriverActive(value);
    try {
      await driverApi.updateLocation(user?.latitude || 0, user?.longitude || 0);
      // In production, you'd call updateAvailability endpoint
    } catch (error) {
      console.error('Failed to update availability:', error);
      Alert.alert('Error', 'Failed to update availability status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.firstName || 'Driver'}</Text>

      {/* Role badge */}
      <View style={[styles.badge, isDriver ? styles.badgeDriver : styles.badgeCustomer]}>
        <Text style={styles.badgeText}>{isDriver ? '🚚 Driver' : '👤 Customer'}</Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* Common: My Deliveries */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Deliveries')}>
          <Text style={styles.buttonText}>📦 My Deliveries</Text>
        </TouchableOpacity>

        {/* Customer: New Delivery */}
        {!isDriver && (
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('NewDelivery')}>
            <Text style={styles.buttonText}>➕ Create Delivery</Text>
          </TouchableOpacity>
        )}

        {/* Driver: Dashboard */}
        {isDriver && (
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('DriverDashboard')}>
            <Text style={styles.buttonText}>📊 Dashboard</Text>
          </TouchableOpacity>
        )}

        {/* Both: Map */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Map')}>
          <Text style={styles.buttonText}>🗺️ Live Map</Text>
        </TouchableOpacity>

        {/* Driver: Online toggle */}
        {isDriver && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleToggleActive(!isOnline)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '⏳' : isOnline ? '🟢 Go Offline' : '🔴 Go Online'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Customer: Become Driver (if not driver) */}
        {!isDriver && (
          <TouchableOpacity
            style={[styles.button, styles.driverButton]}
            onPress={() => navigation.navigate('DriverOnboarding')}
          >
            <Text style={styles.buttonText}>🚗 Become a Driver</Text>
          </TouchableOpacity>
        )}

        {/* Profile */}
        <TouchableOpacity style={[styles.button, styles.profileButton]} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.buttonText}>👤 Profile</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeDriver: {
    backgroundColor: '#DCFCE7',
  },
  badgeCustomer: {
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    fontWeight: '600',
    color: '#374151',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButton: {
    borderWidth: 2,
  },
  onlineButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  offlineButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  driverButton: {
    backgroundColor: '#8B5CF6',
  },
  profileButton: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});
