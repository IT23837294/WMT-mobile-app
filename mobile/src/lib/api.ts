import { API_BASE_URL } from '@/src/config';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type RequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  formData?: FormData;
};

const readErrorMessage = (payload: any, fallback: string) => {
  if (!payload) {
    return fallback;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload.message === 'string') {
    return payload.message;
  }

  if (Array.isArray(payload.issues) && payload.issues.length > 0) {
    return payload.issues.join('\n');
  }

  return fallback;
};

export const apiUrl = (endpoint = '') => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
};

export const getImageUrl = (image?: string | null) => {
  if (!image) {
    return null;
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  const normalized = image.startsWith('/') ? image : `/${image}`;
  return `${API_BASE_URL.replace(/\/api$/, '')}${normalized}`;
};

export const formatCurrency = (value?: number | string | null) => {
  const amount = Number(value || 0);
  return `LKR ${amount.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
};

export const request = async <T,>(endpoint: string, { method = 'GET', token, body, formData }: RequestOptions = {}): Promise<T> => {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body && !formData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(apiUrl(endpoint), {
    method,
    headers,
    body: formData ? formData : body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(readErrorMessage(payload, 'Request failed'), response.status, payload);
  }

  return payload as T;
};
