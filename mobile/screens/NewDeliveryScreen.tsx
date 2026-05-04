import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
  ActivityIndicator, Modal, FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import MapView, { Marker, Region, Polyline, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useRNMobileAuth } from '../hooks/useAuth';
import { deliveriesApi } from '../api/deliveries';
import { pricingApi } from '../api/pricing';
import { pickAndUploadImage } from '../utils/upload';
import { BASE_URL } from '../constants';
import type { DeliveryFormData, Address, PricingRule } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'NewDelivery'>;

export default function NewDeliveryScreen({ navigation }: Props) {
  const { user, getAuthToken } = useRNMobileAuth();

  // Form state
  const [pickupAddress, setPickupAddress] = useState<Address | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState<Address | null>(null);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [notes, setNotes] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');

  // Address selection modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressType, setAddressType] = useState<'pickup' | 'dropoff'>('pickup');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  // Pricing & map
  const [pricing, setPricing] = useState<PricingRule | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [calculatedCost, setCalculatedCost] = useState<number>(0);
  const [region, setRegion] = useState<Region | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  // Fetch pricing on mount
  useEffect(() => {
    const fetchPricing = async () => {
      const p = await pricingApi.getPricing();
      setPricing(p);
      setLoadingPricing(false);
    };
    fetchPricing();
  }, []);

  // Get user location and saved addresses
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    })();
    fetchSavedAddresses();
  }, []);

  const fetchSavedAddresses = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      // TODO: Create addresses api module
      const response = await fetch(`${BASE_URL}/api/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (json.success) {
        setSavedAddresses(json.data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const calculateDistance = useCallback(async (pickup: Address, dropoff: Address) => {
    if (!pickup.latitude || !dropoff.latitude) return;

    setCalculatingRoute(true);
    try {
      // Simple Haversine distance calculation
      const R = 6371; // Earth radius in km
      const dLat = (dropoff.latitude - pickup.latitude) * Math.PI / 180;
      const dLon = (dropoff.longitude - pickup.longitude) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pickup.latitude * Math.PI / 180) * Math.cos(dropoff.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;

      setDistance(dist);

      if (pricing) {
        const multiplier = pricing.priorityMultiplier[priority] || 1;
        const cost = pricing.baseFare + (dist * pricing.costPerKm) * multiplier;
        setCalculatedCost(Math.max(cost, pricing.minimumFare));
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
    } finally {
      setCalculatingRoute(false);
    }
  }, [pricing, priority]);

  const handlePickupSelect = (address: Address) => {
    setPickupAddress(address);
    setShowAddressModal(false);
    if (dropoffAddress) calculateDistance(address, dropoffAddress);
  };

  const handleDropoffSelect = (address: Address) => {
    setDropoffAddress(address);
    setShowAddressModal(false);
    if (pickupAddress) calculateDistance(pickupAddress, address);
  };

  const handlePriorityChange = (newPriority: typeof priority) => {
    setPriority(newPriority);
    if (pricing && distance) {
      const multiplier = pricing.priorityMultiplier[newPriority] || 1;
      const cost = pricing.baseFare + (distance * pricing.costPerKm) * multiplier;
      setCalculatedCost(Math.max(cost, pricing.minimumFare));
    }
  };

  const handleSubmit = async () => {
    if (!pickupAddress || !dropoffAddress || !description.trim() || !pricing) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const deliveryData: DeliveryFormData = {
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        description,
        cost: calculatedCost || pricing.baseFare,
        priority,
        notes: notes || undefined,
        weight: weight ? parseFloat(weight) : undefined,
        dimensions: dimensions || undefined,
      };

      const delivery = await deliveriesApi.create(deliveryData);
      if (delivery) {
        // Navigate to payment screen (tip is 0 for now)
        navigation.navigate('Payment', { deliveryId: delivery.id, tipAmount: 0 });
      } else {
        Alert.alert('Error', 'Failed to create delivery');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.title}>Create New Delivery</Text>

        {/* Pricing Info */}
        {loadingPricing ? (
          <ActivityIndicator style={{ margin: 20 }} />
        ) : pricing ? (
          <View style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Current Rates</Text>
            <Text>Base Fare: KES {pricing.baseFare}</Text>
            <Text>Per Km: KES {pricing.costPerKm}</Text>
            <Text>Minimum: KES {pricing.minimumFare}</Text>
          </View>
        ) : null}

        {/* Address Selection */}
        <Text style={styles.label}>Pickup Location *</Text>
        <TouchableOpacity
          style={[styles.addressButton, pickupAddress && styles.addressButtonSelected]}
          onPress={() => { setAddressType('pickup'); setShowAddressModal(true); }}
        >
          <Text>{pickupAddress ? `${pickupAddress.label}: ${pickupAddress.street}` : 'Select Pickup Address'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Dropoff Location *</Text>
        <TouchableOpacity
          style={[styles.addressButton, dropoffAddress && styles.addressButtonSelected]}
          onPress={() => { setAddressType('dropoff'); setShowAddressModal(true); }}
        >
          <Text>{dropoffAddress ? `${dropoffAddress.label}: ${dropoffAddress.street}` : 'Select Dropoff Address'}</Text>
        </TouchableOpacity>

        {/* Simple Map Preview */}
        {pickupAddress && dropoffAddress && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: (pickupAddress.latitude! + dropoffAddress.latitude!) / 2,
                longitude: (pickupAddress.longitude! + dropoffAddress.longitude!) / 2,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
            >
              {/* OSM Tile Layer */}
              <UrlTile
                urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
                flipY={false}
                tileSize={256}
              />
              
              <Marker
                coordinate={{ latitude: pickupAddress.latitude!, longitude: pickupAddress.longitude! }}
                title="Pickup"
                pinColor="green"
              />
              <Marker
                coordinate={{ latitude: dropoffAddress.latitude!, longitude: dropoffAddress.longitude! }}
                title="Dropoff"
                pinColor="red"
              />
              {pickupAddress.latitude && pickupAddress.longitude && dropoffAddress.latitude && dropoffAddress.longitude && (
                <Polyline
                  coordinates={[
                    { latitude: pickupAddress.latitude, longitude: pickupAddress.longitude },
                    { latitude: dropoffAddress.latitude, longitude: dropoffAddress.longitude },
                  ]}
                  strokeColor="#007AFF"
                  strokeWidth={3}
                />
              )}
            </MapView>
            {calculatingRoute && <ActivityIndicator style={styles.mapLoader} />}
            {distance !== null && (
              <Text style={styles.distanceText}>Distance: {distance.toFixed(2)} km</Text>
            )}
          </View>
        )}

        {/* Form Fields */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What are you delivering?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        {/* Priority */}
        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.priorityButton, priority === p && styles.priorityButtonSelected]}
              onPress={() => handlePriorityChange(p)}
            >
              <Text style={priority === p ? styles.priorityTextSelected : styles.priorityText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Optional fields */}
        <Text style={styles.label}>Weight (kg) - optional</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 5.5"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Dimensions (L×W×H cm) - optional</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 30×20×10"
          value={dimensions}
          onChangeText={setDimensions}
        />

        <Text style={styles.label}>Delivery Notes - optional</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any special instructions..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        {/* Cost Summary */}
        {calculatedCost > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Estimated Cost</Text>
            <Text style={styles.cost}>KES {calculatedCost.toFixed(2)}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !pickupAddress || !dropoffAddress || !description}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Delivery</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Address Selection Modal */}
      <Modal visible={showAddressModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Select {addressType === 'pickup' ? 'Pickup' : 'Dropoff'} Address
            </Text>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Text style={styles.cancelButton}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={savedAddresses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.addressItem}
                onPress={() => addressType === 'pickup' ? handlePickupSelect(item) : handleDropoffSelect(item)}
              >
                <Text style={styles.addressLabel}>{item.label}</Text>
                <Text>{item.street}, {item.city}</Text>
                <Text style={styles.addressDetail}>{item.state}, {item.zipCode}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No saved addresses. Add one in Profile.</Text>}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  pricingCard: {
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  pricingTitle: {
    fontWeight: '600',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addressButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  addressButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f9ff',
  },
  mapContainer: {
    marginVertical: 15,
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
  },
  map: {
    flex: 1,
  },
  mapLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  distanceText: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 5,
    borderRadius: 5,
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  priorityButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priorityText: {
    color: '#333',
  },
  priorityTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
  },
  cost: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  addressItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addressLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  addressDetail: {
    color: '#666',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
  },
});
