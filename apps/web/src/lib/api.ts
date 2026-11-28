import { createApiClient, createAuthApi } from '@lms/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/** Browser API client. httpOnly cookies carry the session, so no tokens are ever visible to JS. */
export const api = createApiClient({
  baseUrl,
  credentials: 'include',
  // On 401, swap the refresh cookie for a new pair and retry once.
  refresh: async () => {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (res.ok) return true;
    // Another tab refreshed at the same moment; its new cookies are already set.
    const body = (await res.json().catch(() => undefined)) as { code?: string } | undefined;
    return body?.code === 'REFRESH_RACE';
  },
});

export const authApi = createAuthApi(api);
