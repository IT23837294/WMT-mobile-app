import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import Screen from '@/src/components/Screen';
import Section from '@/src/components/Section';
import { useAuth } from '@/src/context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState(user?.address?.street || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [stateName, setStateName] = useState(user?.address?.state || '');
  const [zipCode, setZipCode] = useState(user?.address?.zipCode || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setStreet(user?.address?.street || '');
    setCity(user?.address?.city || '');
    setStateName(user?.address?.state || '');
    setZipCode(user?.address?.zipCode || '');
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  const saveProfile = async () => {
    setLoading(true);
    setMessage(null);

    const response = await updateProfile({
      name,
      phone,
      address: {
        street,
        city,
        state: stateName,
        zipCode,
        country: user?.address?.country || 'Sri Lanka'
      }
    });

    setLoading(false);

    if (response.success) {
      setMessage('Profile saved.');
      return;
    }

    setMessage(response.message || 'Profile update failed');
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Screen scroll={false} backgroundColor="#f5f7fb">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Profile" subtitle="Update the name, phone, and address used by checkout." />

        <View style={styles.profileCard}>
          <View style={styles.userBlock}>
            <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
            <Text style={styles.userMeta}>{user?.email || 'No email available'}</Text>
            <Text style={styles.userMeta}>Role: {user?.role || 'customer'}</Text>
          </View>

          <TextInput placeholder="Name" placeholderTextColor="#94a3b8" style={styles.input} value={name} onChangeText={setName} />
          <TextInput placeholder="Phone" placeholderTextColor="#94a3b8" style={styles.input} value={phone} onChangeText={setPhone} />
          <TextInput placeholder="Street" placeholderTextColor="#94a3b8" style={styles.input} value={street} onChangeText={setStreet} />
          <TextInput placeholder="City" placeholderTextColor="#94a3b8" style={styles.input} value={city} onChangeText={setCity} />
          <TextInput placeholder="State" placeholderTextColor="#94a3b8" style={styles.input} value={stateName} onChangeText={setStateName} />
          <TextInput placeholder="Zip code" placeholderTextColor="#94a3b8" style={styles.input} value={zipCode} onChangeText={setZipCode} />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={saveProfile} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Save profile</Text>}
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleLogout}>
            <Text style={styles.secondaryButtonText}>Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    gap: 12
  },
  userBlock: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5eaf3'
  },
  userName: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 20
  },
  userMeta: {
    color: '#64748b',
    marginTop: 4
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
  message: {
    backgroundColor: '#ecfeff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#a5f3fc',
    color: '#155e75'
  },
  primaryButton: {
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
    fontWeight: '800'
  },
  secondaryButton: {
    backgroundColor: '#fff1f2',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#be123c',
    fontWeight: '800'
  }
});
