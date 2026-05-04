import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Switch
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useRNMobileAuth } from '../hooks/useAuth';
import type { Address } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Addresses'>;

export default function AddressesScreen({ navigation }: Props) {
  const { getAuthToken } = useRNMobileAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    street: '', city: '', state: '', zipCode: '', country: '', label: 'Home',
    latitude: '', longitude: '', isDefault: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      // Use direct fetch for now; would ideally use addressesApi module
      const response = await fetch('https://lumyn-delivery.vercel.app/api/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (json.success) {
        setAddresses(json.data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.street || !formData.city || !formData.state || !formData.zipCode || !formData.country) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch('https://lumyn-delivery.vercel.app/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });
      const json = await response.json();
      if (json.success) {
        setAddresses([...addresses, json.data]);
        setShowForm(false);
        setFormData({ street: '', city: '', state: '', zipCode: '', country: '', label: 'Home', latitude: '', longitude: '', isDefault: false });
      } else {
        Alert.alert('Error', json.error || 'Failed to save address');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getAuthToken();
            await fetch(`https://lumyn-delivery.vercel.app/api/addresses/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            setAddresses(addresses.filter(a => a.id !== id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete address');
          }
        },
      },
    ]);
  };

  if (showForm) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.title}>Add New Address</Text>
        <TextInput style={styles.input} placeholder="Street Address *" value={formData.street} onChangeText={(t) => setFormData({ ...formData, street: t })} />
        <TextInput style={styles.input} placeholder="City *" value={formData.city} onChangeText={(t) => setFormData({ ...formData, city: t })} />
        <TextInput style={styles.input} placeholder="State/Province *" value={formData.state} onChangeText={(t) => setFormData({ ...formData, state: t })} />
        <TextInput style={styles.input} placeholder="ZIP/Postal Code *" value={formData.zipCode} onChangeText={(t) => setFormData({ ...formData, zipCode: t })} />
        <TextInput style={styles.input} placeholder="Country *" value={formData.country} onChangeText={(t) => setFormData({ ...formData, country: t })} />
        <TextInput
          style={styles.input}
          placeholder="Label (Home, Work, etc.)"
          value={formData.label}
          onChangeText={(t) => setFormData({ ...formData, label: t })}
        />
        <View style={styles.switchRow}>
          <Text>Set as default</Text>
          <Switch value={formData.isDefault} onValueChange={(v) => setFormData({ ...formData, isDefault: v })} />
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Address</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowForm(false)}>
          <Text>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Saved Addresses</Text>
      {addresses.length === 0 ? (
        <Text style={styles.empty}>No addresses saved yet. Add one to create deliveries.</Text>
      ) : (
        addresses.map((addr) => (
          <View key={addr.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.label}>{addr.label}</Text>
              {addr.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
            </View>
             <Text>{addr.street}</Text>
             <Text>{addr.city}, {addr.state} {addr.zipCode}</Text>
             <Text>{addr.country}</Text>
             <View style={styles.cardActions}>
               <TouchableOpacity onPress={() => handleDelete(addr.id)}>
                 <Text style={styles.deleteLink}>Delete</Text>
               </TouchableOpacity>
             </View>
          </View>
        ))
      )}
      <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
        <Text style={styles.addButtonText}>+ Add New Address</Text>
      </TouchableOpacity>
    </ScrollView>
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    color: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 20,
  },
  deleteLink: {
    color: '#EF4444',
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
  },
  addButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
