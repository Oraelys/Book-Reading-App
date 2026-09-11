import { supabase } from '@/lib/supabase';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

const API_URL = (
  configuredApiUrl || 'https://inkwell-backend-ewrq.onrender.com'
).replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new ApiError(
      `Unable to read authentication session: ${error.message}`,
      401,
    );
  }

  if (!session?.access_token) {
    throw new ApiError(
      'You must be signed in to perform this action.',
      401,
    );
  }

  return session.access_token;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(body: unknown, status: number): string {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    const value = body as Record<string, unknown>;

    if (typeof value.message === 'string') {
      return value.message;
    }

    if (Array.isArray(value.message)) {
      return value.message.join(', ');
    }

    if (typeof value.error === 'string') {
      return value.error;
    }
  }

  return `Request failed with status ${status}.`;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(body, response.status),
      response.status,
      body,
    );
  }

  return body as T;
}

export function getApiUrl(): string {
  return API_URL;
}