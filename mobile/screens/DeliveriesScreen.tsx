import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useRNMobileAuth } from '../hooks/useAuth';
import { deliveriesApi } from '../api/deliveries';

type Props = NativeStackScreenProps<RootStackParamList, 'Deliveries'>;

export default function DeliveriesScreen({ navigation }: Props) {
  const { isSignedIn, user } = useRNMobileAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      let deliveriesArray: any[] = [];
      if (user?.role === 'DRIVER') {
        const result = await deliveriesApi.getAll({ limit: 50 });
        deliveriesArray = result.data;
      } else {
        deliveriesArray = await deliveriesApi.getMyDeliveries();
      }
      setDeliveries(deliveriesArray);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user?.role]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
  };

  const handleDeliveryPress = (deliveryId: string) => {
    navigation.navigate('DeliveryDetails', { deliveryId });
  };

  const handleAccept = async (deliveryId: string) => {
    Alert.alert('Accept Delivery', 'Are you sure you want to accept this delivery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            const result = await driverApi.acceptDelivery(deliveryId);
            if (result.success) {
              Alert.alert('Success', 'Delivery accepted!');
              fetchDeliveries();
            } else {
              Alert.alert('Error', result.error || 'Failed to accept');
            }
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={deliveries}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleDeliveryPress(item.id)}
          disabled={item.status !== 'ASSIGNED'}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.priority}>{item.priority}</Text>
          </View>
          <Text style={styles.cardTitle}>#{item.id.slice(-6)}</Text>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          <View style={styles.costRow}>
            <Text style={styles.cost}>KES {item.cost.toFixed(2)}</Text>
            {item.tip > 0 && <Text style={styles.tip}>+ KES {item.tip} tip</Text>}
          </View>
          <View style={styles.addresses}>
            <Text style={styles.addressLabel}>From:</Text>
            <Text numberOfLines={1}>{item.pickupAddress?.street}, {item.pickupAddress?.city}</Text>
            <Text style={[styles.addressLabel, { marginTop: 4 }]}>To:</Text>
            <Text numberOfLines={1}>{item.dropoffAddress?.street}, {item.dropoffAddress?.city}</Text>
          </View>
          {user?.role === 'DRIVER' && item.status === 'ASSIGNED' && !item.driverId && (
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAccept(item.id)}
            >
              <Text style={styles.acceptText}>Accept Delivery</Text>
            </TouchableOpacity>
          )}
          {item.driver && (
            <Text style={styles.assigned}>Assigned to: {item.driver.firstName} {item.driver.lastName}</Text>
          )}
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          {user?.role === 'DRIVER' ? 'No deliveries assigned yet' : 'No deliveries yet'}
        </Text>
      }
    />
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

import { driverApi } from '../api/driver';

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priority: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F97316',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 10,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  tip: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 8,
  },
  addresses: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addressLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  acceptText: {
    color: '#fff',
    fontWeight: '600',
  },
  assigned: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    padding: 40,
    color: '#6B7280',
    fontSize: 16,
  },
});
