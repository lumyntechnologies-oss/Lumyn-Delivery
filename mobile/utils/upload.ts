import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/client';
import type { UploadResponse } from '../types';

export async function uploadImage(file: ImagePicker.ImagePickerAsset, type: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    type: file.mimeType || 'image/jpeg',
    name: file.fileName || `upload_${Date.now()}.jpg`,
  } as any);
  formData.append('type', type);

  const response = await apiClient.post<{ success: boolean; data: UploadResponse; error?: string }>('/api/cloudinary-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.data.success) {
    throw new Error(response.data.error || 'Upload failed');
  }

  return response.data.data;
}

export async function pickAndUploadImage(type: string): Promise<UploadResponse | null> {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    alert('Permission to access media library is required');
    return null;
  }

  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (pickerResult.canceled) return null;

  try {
    return await uploadImage(pickerResult.assets[0], type);
  } catch (error: any) {
    alert(`Upload failed: ${error.message}`);
    return null;
  }
}

export async function takeAndUploadPhoto(type: string): Promise<UploadResponse | null> {
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  if (!permissionResult.granted) {
    alert('Permission to use camera is required');
    return null;
  }

  const cameraResult = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.8,
  });

  if (cameraResult.canceled) return null;

  try {
    return await uploadImage(cameraResult.assets[0], type);
  } catch (error: any) {
    alert(`Upload failed: ${error.message}`);
    return null;
  }
}
