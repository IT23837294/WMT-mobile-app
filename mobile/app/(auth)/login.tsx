import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Screen from '@/src/components/Screen';
import { useAuth } from '@/src/context/AuthContext';

export default function LoginScreen() {
  const { login, errorMessage } = useAuth();
  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('customer123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorMessage);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 3, [email, password]);

  const handleLogin = async () => {
    if (!canSubmit) {
      setError('Enter a valid email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    const result = await login(email.trim(), password, 'customer');
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)');
      return;
    }

    setError(result.message || 'Login failed');
  };

  return (
    <Screen scroll backgroundColor="#eef4ff">
      <View style={styles.hero}>
        <Text style={styles.kicker}>Pharmacy mobile</Text>
        <Text style={styles.title}>Refill, track, and manage medicines on the go.</Text>
        <Text style={styles.subtitle}>Connects directly to the existing pharmacy backend for login, medicines, cart, and orders.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign in</Text>
        <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor="#94a3b8" style={styles.input} value={email} onChangeText={setEmail} />
        <TextInput secureTextEntry placeholder="Password" placeholderTextColor="#94a3b8" style={styles.input} value={password} onChangeText={setPassword} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Continue</Text>}
        </Pressable>
        <Text style={styles.helper}>
          New here? <Link href="/(auth)/register" style={styles.link}>Create an account</Link>
        </Text>
      </View>

      <View style={styles.demoCard}>
        <Text style={styles.demoTitle}>Demo account</Text>
        <Text style={styles.demoText}>customer@example.com / customer123</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 18,
    marginBottom: 20,
    padding: 24,
    borderRadius: 28,
    backgroundColor: '#0f172a'
  },
  kicker: {
    color: '#86efac',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 12,
    fontWeight: '800'
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    marginTop: 10
  },
  subtitle: {
    color: '#cbd5e1',
    marginTop: 12,
    lineHeight: 22
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    gap: 12
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a'
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: '#0f766e',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center'
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16
  },
  helper: {
    color: '#64748b',
    textAlign: 'center'
  },
  link: {
    color: '#0f766e',
    fontWeight: '700'
  },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 12
  },
  demoCard: {
    backgroundColor: '#ecfeff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#a5f3fc',
    marginTop: 16
  },
  demoTitle: {
    color: '#155e75',
    fontWeight: '800',
    marginBottom: 6
  },
  demoText: {
    color: '#0f172a'
  }
});
