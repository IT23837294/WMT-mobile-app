import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency, getImageUrl } from '@/src/lib/api';
import type { Medicine } from '@/src/types';

const MedicineCard = ({
  medicine,
  onPress,
  onAdd
}: {
  medicine: Medicine;
  onPress?: () => void;
  onAdd?: () => void;
}) => {
  const imageUrl = getImageUrl(medicine.image);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : <View style={[styles.image, styles.placeholder]} />}
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.category}>{medicine.category || 'Medicine'}</Text>
          {medicine.requiresPrescription ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Rx</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {medicine.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {medicine.manufacturer || medicine.subCategory || medicine.supplier?.name || 'Pharmacy stock'}
        </Text>
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{formatCurrency(medicine.sellingPrice || medicine.price)}</Text>
            <Text style={styles.stock}>{Number(medicine.totalStock ?? medicine.stockQuantity ?? 0)} in stock</Text>
          </View>
          {onAdd ? (
            <Pressable onPress={onAdd} style={styles.addButton}>
              <Ionicons name="add" size={18} color="#ffffff" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5eaf3',
    marginBottom: 14
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96
  },
  image: {
    width: '100%',
    height: 170,
    backgroundColor: '#e8eef8'
  },
  placeholder: {
    backgroundColor: '#dbeafe'
  },
  content: {
    padding: 16,
    gap: 10
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  category: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
    color: '#0f766e',
    fontWeight: '700'
  },
  badge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999
  },
  badgeText: {
    color: '#b91c1c',
    fontWeight: '800',
    fontSize: 11
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  meta: {
    color: '#64748b'
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  stock: {
    color: '#64748b',
    marginTop: 2
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default MedicineCard;
