import { Platform } from 'react-native';

const normalizeBaseUrl = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  return value.replace(/\/$/, '');
};

const defaultBaseUrl = Platform.select({
  android: 'http://10.0.2.2:5001/api',
  ios: 'http://localhost:5001/api',
  default: 'http://localhost:5001/api'
});

export const API_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL) ?? defaultBaseUrl;
