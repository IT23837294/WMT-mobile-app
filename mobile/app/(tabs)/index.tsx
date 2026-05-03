import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import EmptyState from '@/src/components/EmptyState';
import MedicineCard from '@/src/components/MedicineCard';
import Screen from '@/src/components/Screen';
import Section from '@/src/components/Section';
import { useAuth } from '@/src/context/AuthContext';
import { useCart } from '@/src/context/CartContext';
import { request } from '@/src/lib/api';
import type { Medicine } from '@/src/types';

export default function HomeScreen() {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHome = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    const [medicinesResponse, categoriesResponse] = await Promise.all([
      request<{ success: boolean; medicines: Medicine[] }>('/medicines'),
      request<{ success: boolean; categories: string[] }>('/medicines/categories', { token })
    ]);

    setMedicines(medicinesResponse.medicines || []);
    setCategories(categoriesResponse.categories || []);
    setLoading(false);
  };

  useEffect(() => {
    loadHome().catch(() => setLoading(false));
  }, [token]);

  const featuredMedicines = useMemo(() => medicines.slice(0, 4), [medicines]);

  const handleAdd = async (medicineId: string) => {
    await addToCart(medicineId, 1);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHome().catch(() => setLoading(false));
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Screen scroll={false} backgroundColor="#f5f7fb">
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} backgroundColor="#f5f7fb">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f766e" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.eyebrow}>Welcome back</Text>
              <Text style={styles.heroTitle}>{user?.name || 'Customer'}</Text>
            </View>
            <View style={styles.avatar}>
              <Ionicons name="medical" size={24} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.heroText}>Browse medicines, refill fast, and keep track of orders from one app.</Text>
          <View style={styles.heroActions}>
            <Pressable style={styles.actionButton} onPress={() => router.push('/(tabs)/medicines')}>
              <Ionicons name="search" size={16} color="#0f172a" />
              <Text style={styles.actionLabel}>Browse</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => router.push('/(tabs)/cart')}>
              <Ionicons name="cart" size={16} color="#0f172a" />
              <Text style={styles.actionLabel}>Cart</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => router.push('/(tabs)/orders')}>
              <Ionicons name="receipt" size={16} color="#0f172a" />
              <Text style={styles.actionLabel}>Orders</Text>
            </Pressable>
          </View>
        </View>

        <Section title="Categories" subtitle="The current backend catalog is already grouped for mobile browsing." />
        <View style={styles.categoryGrid}>
          {categories.length > 0 ? categories.map((category) => (
            <View key={category} style={styles.categoryChip}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          )) : <EmptyState title="No categories yet" subtitle="Create or seed medicines in the backend to populate this view." />}
        </View>

        <Section title="Featured medicines" subtitle="Tap a card to open details or add straight to cart." action={<Text style={styles.sectionAction} onPress={() => router.push('/(tabs)/medicines')}>See all</Text>} />
        {featuredMedicines.length > 0 ? featuredMedicines.map((medicine) => (
          <MedicineCard
            key={medicine._id}
            medicine={medicine}
            onPress={() => router.push(`/medicine/${medicine._id}`)}
            onAdd={() => handleAdd(medicine._id)}
          />
        )) : <EmptyState title="No medicines found" subtitle="The backend returned an empty catalog. Seed data or add inventory to continue." />}
      </ScrollView>
      
      {/* Floating Support Button */}
      <View style={styles.floatingSupport}>
        <Pressable style={styles.supportButton} onPress={() => router.push('/(tabs)/support')}>
          <Ionicons name="headset" size={20} color="#ffffff" />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 18
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  hero: {
    backgroundColor: '#0f172a',
    borderRadius: 30,
    padding: 20,
    gap: 14
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  eyebrow: {
    color: '#86efac',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
    fontWeight: '800'
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4
  },
  heroText: {
    color: '#cbd5e1',
    lineHeight: 22
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  actionLabel: {
    color: '#0f172a',
    fontWeight: '700'
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5eaf3'
  },
  categoryText: {
    color: '#0f172a',
    fontWeight: '700'
  },
  sectionAction: {
    color: '#0f766e',
    fontWeight: '800'
  },
  floatingSupport: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 1000
  },
  supportButton: {
    backgroundColor: '#0f766e',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  }
});
