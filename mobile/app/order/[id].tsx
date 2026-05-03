import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import EmptyState from '@/src/components/EmptyState';
import Screen from '@/src/components/Screen';
import { useAuth } from '@/src/context/AuthContext';
import { formatCurrency, request } from '@/src/lib/api';
import type { Order } from '@/src/types';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !token) {
      setLoading(false);
      return;
    }

    request<{ success: boolean; order: Order }>(`/orders/${id}`, { token })
      .then((response) => setOrder(response.order))
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Unable to load order'))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) {
    return (
      <Screen scroll={false} backgroundColor="#f5f7fb">
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen scroll={false} backgroundColor="#f5f7fb">
        <View style={styles.emptyWrap}>
          <EmptyState title="Order not found" subtitle={message || 'The selected order could not be loaded.'} />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} backgroundColor="#f5f7fb">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.orderNumber}>{order.orderNumber || order._id}</Text>
          <Text style={styles.status}>{order.orderStatus || order.paymentStatus || 'pending'}</Text>
          <Text style={styles.total}>{formatCurrency(order.finalAmount || order.totalAmount)}</Text>
          <Text style={styles.meta}>Payment: {order.paymentMethod || 'card'}</Text>
          <Text style={styles.meta}>Tracking: {order.trackingNumber || 'Pending'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          <Text style={styles.address}>{order.deliveryAddress?.street}</Text>
          <Text style={styles.address}>{[order.deliveryAddress?.city, order.deliveryAddress?.state, order.deliveryAddress?.zipCode].filter(Boolean).join(', ')}</Text>
          <Text style={styles.address}>{order.deliveryAddress?.country}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items?.map((item) => (
            <View key={item.medicine?._id || item.price} style={styles.itemRow}>
              <View style={styles.itemCopy}>
                <Text style={styles.itemName}>{item.medicine?.name}</Text>
                <Text style={styles.itemMeta}>{item.quantity} x {formatCurrency(item.price)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</Text>
            </View>
          ))}
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    gap: 8
  },
  orderNumber: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900'
  },
  status: {
    color: '#0f766e',
    backgroundColor: '#ecfeff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '800',
    alignSelf: 'flex-start',
    textTransform: 'capitalize'
  },
  total: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6
  },
  meta: {
    color: '#64748b'
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6
  },
  address: {
    color: '#334155',
    lineHeight: 20
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eef2f7'
  },
  itemCopy: {
    flex: 1
  },
  itemName: {
    color: '#0f172a',
    fontWeight: '800'
  },
  itemMeta: {
    color: '#64748b',
    marginTop: 4
  },
  itemTotal: {
    color: '#0f172a',
    fontWeight: '900'
  },
  message: {
    backgroundColor: '#ecfeff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#a5f3fc',
    color: '#155e75'
  }
});
