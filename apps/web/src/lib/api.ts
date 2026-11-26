import { createApiClient } from '@lms/api-client';

/** Browser API client. Cookies (httpOnly) carry the session, so no tokens in JS. */
export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  credentials: 'include',
});
