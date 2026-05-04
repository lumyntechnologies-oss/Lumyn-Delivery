import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Image, Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useRNMobileAuth } from '../hooks/useAuth';
import { pickAndUploadImage, takeAndUploadPhoto } from '../utils/upload';
import { driverApi } from '../api/driver';
import type { DriverApplicationData } from '../types';

type Step = 1 | 2 | 3 | 4;

type Props = NativeStackScreenProps<RootStackParamList, 'DriverOnboarding'>;

export default function DriverOnboardingScreen({ navigation }: Props) {
  const { user, getAuthToken } = useRNMobileAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<DriverApplicationData>>({
    // Step 1: Personal Info (already have from user profile)
    // Step 2: Vehicle Info
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    vehiclePlate: '',
    vehicleColor: '',
    // Step 3: Experience & Bio
    phone: '',
    bio: '',
    yearsOfExperience: 0,
    languages: ['English'],
    // Step 4: Documents (URLs from Cloudinary)
    idCardUrl: '',
    driversLicenseUrl: '',
    vehicleRegistrationUrl: '',
    insuranceCertificateUrl: '',
    profilePhotoUrl: '',
  });

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((currentStep + 1) as Step);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.vehicleType || !formData.vehicleMake || !formData.vehicleModel ||
        !formData.vehiclePlate || !formData.vehicleYear) {
      Alert.alert('Error', 'Please fill in all required vehicle fields');
      return;
    }
    if (!formData.idCardUrl || !formData.driversLicenseUrl ||
        !formData.vehicleRegistrationUrl) {
      Alert.alert('Error', 'Please upload all required documents');
      return;
    }

    setLoading(true);
    try {
      const result = await driverApi.submitApplication(formData as DriverApplicationData);
      if (result.success) {
        Alert.alert('Success', 'Your driver application has been submitted for review.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', result.message || 'Submission failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  // Document upload handlers
  const handleUpload = async (field: keyof DriverApplicationData, type: string) => {
    const result = await pickAndUploadImage(type);
    if (result) {
      setFormData({ ...formData, [field]: result.url });
    }
  };

  const handleTakePhoto = async (field: keyof DriverApplicationData, type: string) => {
    const result = await takeAndUploadPhoto(type);
    if (result) {
      setFormData({ ...formData, [field]: result.url });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Progress Indicator */}
      <View style={styles.progressBar}>
        {[1, 2, 3, 4].map((step) => (
          <View
            key={step}
            style={[
              styles.progressStep,
              currentStep >= step && styles.progressStepActive,
            ]}
          />
        ))}
      </View>

      {/* Step 1: Personal Info (read-only with edit option) */}
      {currentStep === 1 && (
        <View>
          <Text style={styles.title}>Personal Information</Text>
          <Text style={styles.subtitle}>Verify your personal details</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              value={formData.phone || ''}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next Step</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Vehicle Information */}
      {currentStep === 2 && (
        <View>
          <Text style={styles.title}>Vehicle Information</Text>
          <Text style={styles.subtitle}>Tell us about your vehicle</Text>

          <Text style={styles.label}>Vehicle Type *</Text>
          <View style={styles.options}>
            {['MOTORBIKE', 'SCOOTER', 'CAR', 'VAN', 'TRUCK'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.option,
                  formData.vehicleType === type && styles.optionSelected,
                ]}
                onPress={() => setFormData({ ...formData, vehicleType: type })}
              >
                <Text style={formData.vehicleType === type ? styles.optionTextSelected : styles.optionText}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Make (e.g., Honda)"
            value={formData.vehicleMake}
            onChangeText={(text) => setFormData({ ...formData, vehicleMake: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Model (e.g., CB150)"
            value={formData.vehicleModel}
            onChangeText={(text) => setFormData({ ...formData, vehicleModel: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Year"
            value={formData.vehicleYear?.toString()}
            onChangeText={(text) => setFormData({ ...formData, vehicleYear: parseInt(text) || new Date().getFullYear() })}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="License Plate *"
            value={formData.vehiclePlate}
            onChangeText={(text) => setFormData({ ...formData, vehiclePlate: text.toUpperCase() })}
            autoCapitalize="characters"
          />
          <TextInput
            style={styles.input}
            placeholder="Color (optional)"
            value={formData.vehicleColor}
            onChangeText={(text) => setFormData({ ...formData, vehicleColor: text })}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next Step</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 3: Experience & Bio */}
      {currentStep === 3 && (
        <View>
          <Text style={styles.title}>Experience</Text>
          <Text style={styles.subtitle}>Help us get to know you</Text>

          <Text style={styles.label}>Years of Delivery Experience</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.yearsOfExperience?.toString()}
            onChangeText={(text) => setFormData({ ...formData, yearsOfExperience: parseInt(text) || 0 })}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Bio (brief introduction)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell customers about yourself..."
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            multiline
            numberOfLines={4}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Upload Documents</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 4: Document Upload */}
      {currentStep === 4 && (
        <View>
          <Text style={styles.title}>Documents</Text>
          <Text style={styles.subtitle}>Upload required documents (max 10MB each)</Text>

          {/* ID Card */}
          <Text style={styles.label}>National ID Card *</Text>
          <View style={styles.uploadRow}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleUpload('idCardUrl', 'id_card')}
            >
              <Text style={styles.uploadButtonText}>Pick Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, styles.uploadButtonSecondary]}
              onPress={() => handleTakePhoto('idCardUrl', 'id_card')}
            >
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
          {formData.idCardUrl && <Text style={styles.uploaded}>✓ Uploaded</Text>}

          {/* Driver's License */}
          <Text style={styles.label}>Driver's License *</Text>
          <View style={styles.uploadRow}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleUpload('driversLicenseUrl', 'drivers_license')}
            >
              <Text style={styles.uploadButtonText}>Pick Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, styles.uploadButtonSecondary]}
              onPress={() => handleTakePhoto('driversLicenseUrl', 'drivers_license')}
            >
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
          {formData.driversLicenseUrl && <Text style={styles.uploaded}>✓ Uploaded</Text>}

          {/* Vehicle Registration */}
          <Text style={styles.label}>Vehicle Registration *</Text>
          <View style={styles.uploadRow}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleUpload('vehicleRegistrationUrl', 'vehicle_registration')}
            >
              <Text style={styles.uploadButtonText}>Pick Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, styles.uploadButtonSecondary]}
              onPress={() => handleTakePhoto('vehicleRegistrationUrl', 'vehicle_registration')}
            >
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
          {formData.vehicleRegistrationUrl && <Text style={styles.uploaded}>✓ Uploaded</Text>}

          {/* Insurance (optional) */}
          <Text style={[styles.label, { marginTop: 10 }]}>Insurance Certificate (optional)</Text>
          <View style={styles.uploadRow}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleUpload('insuranceCertificateUrl', 'insurance')}
            >
              <Text style={styles.uploadButtonText}>Pick Image</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Photo */}
          <Text style={[styles.label, { marginTop: 10 }]}>Profile Photo (optional)</Text>
          <View style={styles.uploadRow}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleUpload('profilePhotoUrl', 'profile_photo')}
            >
              <Text style={styles.uploadButtonText}>Pick Image</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 30,
  },
  progressStep: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  value: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    color: '#374151',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  optionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    color: '#374151',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  uploadButtonSecondary: {
    backgroundColor: '#EFF6FF',
    borderColor: '#007AFF',
  },
  uploadButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  uploaded: {
    color: '#10B981',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
