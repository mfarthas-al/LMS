import type {
  AdminCreateUserInput,
  AdminCreateUserResponse,
  AdminListUsersInput,
  AdminUserRow,
  AuthResponse,
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  Paginated,
  RegisterInput,
  SessionInfo,
} from '@lms/shared';

export interface ApiClientOptions {
  baseUrl: string;
  /** Web: 'include' so httpOnly cookies are sent. */
  credentials?: RequestCredentials;
  /** Mobile: returns the access token from secure storage. */
  getToken?: () => Promise<string | null>;
  /** Extra headers on every request, e.g. { 'x-client-type': 'mobile' }. */
  headers?: Record<string, string>;
  /**
   * Called once when a request gets 401. Return true if the session was refreshed and the
   * request should be retried. Web: POST /auth/refresh (cookies). Mobile: refresh from secure storage.
   */
  refresh?: () => Promise<boolean>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(apiErrorMessage(body) ?? `API error ${status}`);
  }

  /** Machine-readable code from the API, e.g. "PASSWORD_CHANGE_REQUIRED". */
  get code(): string | undefined {
    const b = this.body as { code?: unknown } | undefined;
    return typeof b?.code === 'string' ? b.code : undefined;
  }

  /** Per-field validation messages (from zod's flatten()), if any. */
  get fieldErrors(): Record<string, string[]> {
    const b = this.body as { fieldErrors?: Record<string, string[]> } | undefined;
    return b?.fieldErrors ?? {};
  }
}

function apiErrorMessage(body: unknown): string | undefined {
  const b = body as { message?: unknown; formErrors?: string[]; fieldErrors?: Record<string, string[]> } | undefined;
  if (typeof b?.message === 'string') return b.message;
  if (Array.isArray(b?.message)) return b.message.join(', ');
  const first = b?.formErrors?.[0] ?? Object.values(b?.fieldErrors ?? {})[0]?.[0];
  return first;
}

/** Auth routes never trigger an automatic refresh-and-retry. */
const NO_RETRY = /^\/auth\/(login|register|refresh|logout)/;

export function createApiClient(opts: ApiClientOptions) {
  let refreshing: Promise<boolean> | null = null;

  /** Concurrent 401s share one refresh call. */
  function refreshOnce(): Promise<boolean> {
    if (!opts.refresh) return Promise.resolve(false);
    refreshing ??= opts.refresh().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  async function request<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers };
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

    if (res.status === 401 && !retried && !NO_RETRY.test(path) && (await refreshOnce())) {
      return request<T>(method, path, body, true);
    }

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

export type ApiClient = ReturnType<typeof createApiClient>;

/** Typed wrappers for the auth and admin account routes. */
export function createAuthApi(api: ApiClient) {
  return {
    register: (input: RegisterInput) => api.post<AuthResponse>('/auth/register', input),
    login: (input: LoginInput) => api.post<AuthResponse>('/auth/login', input),
    refresh: (refreshToken?: string) =>
      api.post<AuthResponse>('/auth/refresh', refreshToken ? { refreshToken } : {}),
    logout: (refreshToken?: string) => api.post<void>('/auth/logout', refreshToken ? { refreshToken } : {}),
    me: () => api.get<AuthUser>('/auth/me'),
    changePassword: (input: ChangePasswordInput) => api.post<AuthUser>('/auth/change-password', input),
    sessions: () => api.get<SessionInfo[]>('/auth/sessions'),
    revokeSession: (id: string) => api.delete<void>(`/auth/sessions/${encodeURIComponent(id)}`),

    admin: {
      listUsers: (query: Partial<AdminListUsersInput> = {}) => {
        const qs = new URLSearchParams(
          Object.entries(query)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)]),
        ).toString();
        return api.get<Paginated<AdminUserRow>>(`/admin/users${qs ? `?${qs}` : ''}`);
      },
      createUser: (input: AdminCreateUserInput) => api.post<AdminCreateUserResponse>('/admin/users', input),
      setUserStatus: (id: string, isActive: boolean) =>
        api.patch<AdminUserRow>(`/admin/users/${encodeURIComponent(id)}/status`, { isActive }),
      resetUserPassword: (id: string) =>
        api.post<AdminCreateUserResponse>(`/admin/users/${encodeURIComponent(id)}/reset-password`),
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
