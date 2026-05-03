import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import EmptyState from '@/src/components/EmptyState';
import MedicineCard from '@/src/components/MedicineCard';
import Screen from '@/src/components/Screen';
import Section from '@/src/components/Section';
import { useCart } from '@/src/context/CartContext';
import { request } from '@/src/lib/api';
import type { Medicine } from '@/src/types';

export default function MedicinesScreen() {
  const { addToCart } = useCart();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadMedicines = async () => {
    const [medicinesResponse, categoriesResponse] = await Promise.all([
      request<{ success: boolean; medicines: Medicine[] }>('/medicines'),
      request<{ success: boolean; categories: string[] }>('/medicines/categories')
    ]);

    setMedicines(medicinesResponse.medicines || []);
    setCategories(categoriesResponse.categories || []);
    setLoading(false);
  };

  useEffect(() => {
    loadMedicines().catch(() => setLoading(false));
  }, []);

  const filteredMedicines = useMemo(() => {
    const search = query.trim().toLowerCase();

    return medicines.filter((medicine) => {
      const matchesCategory = category === 'All' || medicine.category === category;
      const matchesSearch = !search || [medicine.name, medicine.description, medicine.manufacturer, medicine.category, medicine.subCategory]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(search));

      return matchesCategory && matchesSearch;
    });
  }, [medicines, query, category]);

  const handleAdd = async (medicineId: string) => {
    await addToCart(medicineId, 1);
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Medicines" subtitle="Search the live backend catalog and jump into details." />

        <TextInput
          placeholder="Search medicines"
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          <Pressable onPress={() => setCategory('All')} style={[styles.categoryChip, category === 'All' && styles.categoryChipActive]}>
            <Text style={[styles.categoryText, category === 'All' && styles.categoryTextActive]}>All</Text>
          </Pressable>
          {categories.map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, category === item && styles.categoryChipActive]}>
              <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.resultMeta}>
          <Text style={styles.resultText}>{filteredMedicines.length} medicines</Text>
          <Text style={styles.resultHint}>Tap a card to view details</Text>
        </View>

        {filteredMedicines.length > 0 ? filteredMedicines.map((medicine) => (
          <MedicineCard
            key={medicine._id}
            medicine={medicine}
            onPress={() => router.push(`/medicine/${medicine._id}`)}
            onAdd={() => handleAdd(medicine._id)}
          />
        )) : (
          <EmptyState title="No matches" subtitle="Try another search term or switch categories." />
        )}
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  search: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a'
  },
  categoryRow: {
    gap: 10,
    paddingVertical: 4
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5eaf3',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  categoryChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e'
  },
  categoryText: {
    color: '#0f172a',
    fontWeight: '700'
  },
  categoryTextActive: {
    color: '#ffffff'
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  resultText: {
    color: '#0f172a',
    fontWeight: '800'
  },
  resultHint: {
    color: '#64748b'
  }
});
