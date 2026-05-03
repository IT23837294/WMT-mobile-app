import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import EmptyState from '@/src/components/EmptyState';
import Screen from '@/src/components/Screen';
import { useCart } from '@/src/context/CartContext';
import { formatCurrency, getImageUrl, request } from '@/src/lib/api';
import type { Medicine } from '@/src/types';

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart } = useCart();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    request<{ success: boolean; medicine: Medicine }>(`/medicines/${id}`)
      .then((response) => setMedicine(response.medicine))
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Unable to load medicine'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async () => {
    if (!medicine) {
      return;
    }

    const response = await addToCart(medicine._id, 1);
    if (response.success) {
      setMessage('Added to cart');
      return;
    }

    setMessage(response.message || 'Unable to add to cart');
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

  if (!medicine) {
    return (
      <Screen scroll={false} backgroundColor="#f5f7fb">
        <View style={styles.emptyWrap}>
          <EmptyState title="Medicine not found" subtitle={message || 'The selected medicine could not be loaded.'} />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const imageUrl = getImageUrl(medicine.image);

  return (
    <Screen scroll={false} backgroundColor="#f5f7fb">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : <View style={[styles.image, styles.placeholder]} />}
        <View style={styles.card}>
          <Text style={styles.category}>{medicine.category || 'Medicine'}</Text>
          <Text style={styles.name}>{medicine.name}</Text>
          <Text style={styles.price}>{formatCurrency(medicine.sellingPrice || medicine.price)}</Text>

          <View style={styles.infoRow}>
            <InfoChip label="Stock" value={`${Number(medicine.totalStock ?? medicine.stockQuantity ?? 0)} units`} />
            <InfoChip label="Prescription" value={medicine.requiresPrescription ? 'Required' : 'Not required'} />
          </View>

          <Text style={styles.description}>{medicine.description || 'No description available for this medicine.'}</Text>

          <View style={styles.metaBlock}>
            <MetaRow label="Manufacturer" value={medicine.manufacturer || 'Unknown'} />
            <MetaRow label="Strength" value={medicine.strength || 'Not listed'} />
            <MetaRow label="Dosage" value={medicine.dosage || 'Not listed'} />
          </View>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={handleAdd}>
            <Ionicons name="cart" size={18} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Add to cart</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const InfoChip = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.chip}>
    <Text style={styles.chipLabel}>{label}</Text>
    <Text style={styles.chipValue}>{value}</Text>
  </View>
);

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.metaRow}>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 16
  },
  backButton: {
    backgroundColor: '#0f766e',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center'
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '800'
  },
  image: {
    width: '100%',
    height: 260,
    borderRadius: 28,
    backgroundColor: '#dbeafe'
  },
  placeholder: {
    backgroundColor: '#e2e8f0'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    gap: 14
  },
  category: {
    color: '#0f766e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: '800'
  },
  name: {
    color: '#0f172a',
    fontSize: 26,
    fontWeight: '900'
  },
  price: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '900'
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10
  },
  chip: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    gap: 4
  },
  chipLabel: {
    color: '#64748b',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800'
  },
  chipValue: {
    color: '#0f172a',
    fontWeight: '800'
  },
  description: {
    color: '#334155',
    lineHeight: 22
  },
  metaBlock: {
    gap: 10,
    paddingTop: 4
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  metaLabel: {
    color: '#64748b',
    flex: 1
  },
  metaValue: {
    color: '#0f172a',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right'
  },
  message: {
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#a5f3fc',
    color: '#155e75',
    borderRadius: 14,
    padding: 12
  },
  primaryButton: {
    backgroundColor: '#0f766e',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800'
  }
});
