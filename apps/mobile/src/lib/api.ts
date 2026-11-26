import { createApiClient } from '@lms/api-client';
import { getAccessToken } from './secure-storage';

/** Mobile API client. Tokens come from the encrypted keystore, sent as a Bearer header. */
export const api = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1',
  getToken: getAccessToken,
});
