export interface ApiClientOptions {
  baseUrl: string;
  /** Web: 'include' so httpOnly cookies are sent. */
  credentials?: RequestCredentials;
  /** Mobile: returns the access token from secure storage. */
  getToken?: () => Promise<string | null>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API error ${status}`);
  }
}

export function createApiClient(opts: ApiClientOptions) {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const token = await opts.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${opts.baseUrl}${path}`, {
      method,
      headers,
      credentials: opts.credentials,
      body:
        body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
    const data = res.status === 204 ? undefined : await res.json().catch(() => undefined);
    if (!res.ok) throw new ApiError(res.status, data);
    return data as T;
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
  };
}
