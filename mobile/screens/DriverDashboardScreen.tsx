import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useRNMobileAuth } from '../hooks/useAuth';
import apiClient from '../api/client';

export default function DriverDashboardScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [earnings, setEarnings] = useState(0);
  const { isSignedIn } = useRNMobileAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    // Fetch earnings
    apiClient.get('/api/driver/earnings').then(res => {
      setEarnings(res.data.total || 0);
    }).catch(console.error);

    // Get location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, [isSignedIn]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Dashboard</Text>
      <View style={styles.statsCard}>
        <Text style={styles.statLabel}>This Week Earnings</Text>
        <Text style={styles.statValue}>${earnings.toFixed(2)}</Text>
      </View>
      <View style={styles.locationCard}>
        <Text style={styles.sectionTitle}>Live Location</Text>
        {location ? (
          <Text style={styles.locationText}>
            Lat: {location.coords.latitude.toFixed(4)}, Lon: {location.coords.longitude.toFixed(4)}
          </Text>
        ) : errorMsg ? (
          <Text style={styles.error}>{errorMsg}</Text>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: '#10B981',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  statLabel: {
    color: 'white',
    fontSize: 16,
  },
  statValue: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  locationCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
  },
  error: {
    color: '#EF4444',
  },
});

