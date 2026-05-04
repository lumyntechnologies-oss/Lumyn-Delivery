import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, Image, Linking
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useRNMobileAuth } from '../hooks/useAuth';
import { useDeliveryUpdates } from '../hooks/useSSE';
import { deliveriesApi } from '../api/deliveries';
import { driverApi } from '../api/driver';
import type { Delivery } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DeliveryDetails'>;

export default function DeliveryDetailsScreen({ route, navigation }: Props) {
  const { deliveryId } = route.params;
  const { user, getAuthToken } = useRNMobileAuth();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  // Real-time updates
  useDeliveryUpdates(deliveryId, (updated) => {
    setDelivery(updated);
  });

  useEffect(() => {
    fetchDelivery();
  }, [deliveryId]);

  const fetchDelivery = async () => {
    setLoading(true);
    const d = await deliveriesApi.getById(deliveryId);
    setDelivery(d);
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!user?.isDriverActive) {
      Alert.alert('Not Available', 'Please set yourself as available to accept deliveries.');
      return;
    }
    setAccepting(true);
    const result = await driverApi.acceptDelivery(deliveryId);
    if (result.success) {
      Alert.alert('Success', 'Delivery accepted!', [
        { text: 'OK', onPress: () => fetchDelivery() }
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to accept delivery');
    }
    setAccepting(false);
  };

  if (loading || !delivery) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isDriver = user?.role === 'DRIVER';
  const isAssigned = delivery.driverId === user?.id;
  const canAccept = isDriver && !delivery.driverId && delivery.status === 'ASSIGNED';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
        <Text style={styles.statusText}>{delivery.status.replace('_', ' ')}</Text>
      </View>

      {/* Priority */}
      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(delivery.priority) }]}>
        <Text style={styles.priorityText}>{delivery.priority} Priority</Text>
      </View>

      {/* Cost */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery Cost</Text>
        <Text style={styles.cost}>KES {delivery.cost.toFixed(2)}</Text>
        {delivery.tip > 0 && <Text style={styles.tip}>Tip: KES {delivery.tip.toFixed(2)}</Text>}
      </View>

      {/* Description */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Description</Text>
        <Text>{delivery.description}</Text>
        {delivery.notes && <Text style={styles.notes}>Note: {delivery.notes}</Text>}
        {delivery.weight && <Text>Weight: {delivery.weight} kg</Text>}
        {delivery.dimensions && <Text>Dimensions: {delivery.dimensions}</Text>}
      </View>

      {/* Locations with Map */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Route</Text>
        {delivery.pickupAddress && delivery.dropoffAddress && (
          <>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: (delivery.pickupAddress.latitude! + delivery.dropoffAddress.latitude!) / 2,
                  longitude: (delivery.pickupAddress.longitude! + delivery.dropoffAddress.longitude!) / 2,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
              >
                {/* OSM Tile Layer (Free) */}
                <UrlTile
                  urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maximumZ={19}
                  flipY={false}
                  tileSize={256}
                />
                
                <Marker
                  coordinate={{ latitude: delivery.pickupAddress.latitude!, longitude: delivery.pickupAddress.longitude! }}
                  title="Pickup"
                  pinColor="green"
                />
                <Marker
                  coordinate={{ latitude: delivery.dropoffAddress.latitude!, longitude: delivery.dropoffAddress.longitude! }}
                  title="Dropoff"
                  pinColor="red"
                />
                <Polyline
                  coordinates={[
                    { latitude: delivery.pickupAddress.latitude!, longitude: delivery.pickupAddress.longitude! },
                    { latitude: delivery.dropoffAddress.latitude!, longitude: delivery.dropoffAddress.longitude! },
                  ]}
                  strokeColor="#007AFF"
                  strokeWidth={3}
                />
              </MapView>
            <View style={styles.locationInfo}>
              <Text>From: {delivery.pickupAddress.street}, {delivery.pickupAddress.city}</Text>
              <Text>To: {delivery.dropoffAddress.street}, {delivery.dropoffAddress.city}</Text>
            </View>
          </>
        )}
      </View>

      {/* Driver Info */}
      {delivery.driver && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Driver</Text>
          <View style={styles.driverInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {delivery.driver.firstName?.[0]}{delivery.driver.lastName?.[0]}
              </Text>
            </View>
            <View>
              <Text style={styles.driverName}>
                {delivery.driver.firstName} {delivery.driver.lastName}
              </Text>
              <Text style={styles.driverRating}>★ {delivery.driver.driverRating.toFixed(1)}</Text>
              {delivery.driver.phone && (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${delivery.driver.phone}`)}>
                  <Text style={styles.phoneLink}>Call Driver</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Customer Info (for driver) */}
      {isDriver && delivery.customer && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <View>
            <Text>{delivery.customer.firstName} {delivery.customer.lastName}</Text>
            {delivery.customer.phone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${delivery.customer.phone}`)}>
                <Text style={styles.phoneLink}>Call Customer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timeline</Text>
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <View>
              <Text style={styles.timelineTitle}>Created</Text>
              <Text style={styles.timelineDate}>
                {new Date(delivery.createdAt).toLocaleString()}
              </Text>
            </View>
          </View>
          {delivery.assignedAt && (
            <View style={styles.timelineItem}>
              <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
              <View>
                <Text style={styles.timelineTitle}>Assigned</Text>
                <Text style={styles.timelineDate}>
                  {new Date(delivery.assignedAt).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
          {delivery.pickupTime && (
            <View style={styles.timelineItem}>
              <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
              <View>
                <Text style={styles.timelineTitle}>Picked Up</Text>
                <Text style={styles.timelineDate}>
                  {new Date(delivery.pickupTime).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
          {delivery.deliveryTime && (
            <View style={styles.timelineItem}>
              <View style={[styles.dot, { backgroundColor: '#059669' }]} />
              <View>
                <Text style={styles.timelineTitle}>Delivered</Text>
                <Text style={styles.timelineDate}>
                  {new Date(delivery.deliveryTime).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Accept Button for Drivers */}
      {canAccept && (
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAccept}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.acceptText}>Accept Delivery</Text>
              <Text style={styles.acceptSubtext}>Earn KES {(delivery.cost * 0.8).toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING': return '#6B7280';
    case 'ASSIGNED': return '#3B82F6';
    case 'PICKED_UP': return '#F59E0B';
    case 'IN_TRANSIT': return '#8B5CF6';
    case 'DELIVERED': return '#10B981';
    case 'CANCELLED': return '#EF4444';
    case 'FAILED': return '#DC2626';
    default: return '#6B7280';
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'URGENT': return '#DC2626';
    case 'HIGH': return '#F97316';
    case 'NORMAL': return '#3B82F6';
    case 'LOW': return '#6B7280';
    default: return '#6B7280';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 10,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  priorityText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: '600',
  },
  cost: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
  },
  tip: {
    fontSize: 14,
    color: '#059669',
    marginTop: 4,
  },
  notes: {
    fontStyle: 'italic',
    color: '#666',
    marginTop: 8,
  },
  map: {
    height: 200,
    borderRadius: 8,
  },
  locationInfo: {
    marginTop: 10,
  },
  locationItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
  },
  driverRating: {
    color: '#FBBF24',
  },
  phoneLink: {
    color: '#007AFF',
    marginTop: 4,
  },
  timeline: {
    gap: 15,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  timelineTitle: {
    fontWeight: '600',
  },
  timelineDate: {
    color: '#666',
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    margin: 15,
  },
  acceptText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  acceptSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
});
