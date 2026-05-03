import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Screen from '@/src/components/Screen';
import { useAuth } from '@/src/context/AuthContext';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Please complete all fields and use a 6+ character password.');
      return;
    }

    setLoading(true);
    setError(null);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password,
      role: 'customer'
    });
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)');
      return;
    }

    setError(result.message || 'Registration failed');
  };

  return (
    <Screen scroll backgroundColor="#f4f7f9">
      <View style={styles.card}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Register as a customer and start ordering from the pharmacy catalog.</Text>
        <TextInput placeholder="Full name" placeholderTextColor="#94a3b8" style={styles.input} value={name} onChangeText={setName} />
        <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor="#94a3b8" style={styles.input} value={email} onChangeText={setEmail} />
        <TextInput keyboardType="phone-pad" placeholder="Phone" placeholderTextColor="#94a3b8" style={styles.input} value={phone} onChangeText={setPhone} />
        <TextInput secureTextEntry placeholder="Password" placeholderTextColor="#94a3b8" style={styles.input} value={password} onChangeText={setPassword} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Create account</Text>}
        </Pressable>
        <Text style={styles.helper}>
          Already registered? <Link href="/(auth)/login" style={styles.link}>Sign in</Link>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    gap: 12
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a'
  },
  subtitle: {
    color: '#64748b',
    lineHeight: 21,
    marginBottom: 6
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
    marginTop: 4,
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
  }
});
