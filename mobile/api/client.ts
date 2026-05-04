import axios, { AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../constants';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add auth token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('clerk_token');
  if (token) {
    // Use set method to preserve AxiosHeaders instance
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Response interceptor: handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('clerk_token');
      // TODO: Trigger logout via navigation
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await SecureStore.getItemAsync('clerk_token');
  const headers: Record<string, string> = token 
    ? { Authorization: `Bearer ${token}` } 
    : {};
  
  const config: RequestInit = {
    headers: { ...headers, 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };
  
  return fetch(`${BASE_URL}${endpoint}`, config);
};


