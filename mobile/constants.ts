export const BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://lumyn-delivery.vercel.app';

export const API_ENDPOINTS = {
  deliveries: '/api/deliveries',
  pricing: '/api/pricing',
  drivers: '/api/drivers',
  assignments: '/api/assignments',
  cloudinary: '/api/cloudinary-upload',
  sse: '/api/sse',
} as const;

