import { Redirect } from 'expo-router';

import { useAuth } from '@/src/context/AuthContext';

export default function Index() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return null;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
