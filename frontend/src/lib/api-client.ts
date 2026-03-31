let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

interface ApiErrorBody {
  statusCode: number;
  error: string;
  code: string;
  message: string | string[];
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly serverMessage: string | string[];

  constructor(status: number, body: ApiErrorBody | null) {
    const serverMessage = body?.message ?? 'An unexpected error occurred';
    const readable = Array.isArray(serverMessage) ? serverMessage.join('\n') : serverMessage;
    super(readable);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.code ?? 'UNKNOWN';
    this.serverMessage = serverMessage;
  }
}

async function parseErrorBody(res: Response): Promise<ApiErrorBody | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = fetch('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      setAccessToken(data.accessToken);
      return data.accessToken as string | null;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`/api/v1${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      const retryRes = await fetch(`/api/v1${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!retryRes.ok) {
        throw new ApiError(retryRes.status, await parseErrorBody(retryRes));
      }

      return retryRes.json();
    }

    // Refresh failed — clear token and throw
    setAccessToken(null);
    throw new ApiError(401, { statusCode: 401, error: 'UNAUTHORIZED', code: 'SESSION_EXPIRED', message: 'Session expired' });
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorBody(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
