import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import EmptyState from '@/src/components/EmptyState';
import Screen from '@/src/components/Screen';
import Section from '@/src/components/Section';
import { useAuth } from '@/src/context/AuthContext';
import { formatCurrency, request } from '@/src/lib/api';
import type { Order } from '@/src/types';

export default function OrdersScreen() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const response = await request<{ success: boolean; orders: Order[] }>('/orders/my-orders', {
      method: 'GET',
      token
    });

    setOrders(response.orders || []);
    setLoading(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
    loadOrders().catch(() => setLoading(false));
  }, [loadOrders])
  );

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
        <Section title="Orders" subtitle="Track your recent orders and open details for status and delivery info." />

        {orders.length > 0 ? orders.map((order) => (
          <Pressable key={order._id} style={styles.orderCard} onPress={() => router.push(`/order/${order._id}`)}>
            <View style={styles.rowTop}>
              <Text style={styles.orderNumber}>{order.orderNumber || order._id}</Text>
              <Text style={styles.status}>{order.orderStatus || order.paymentStatus || 'pending'}</Text>
            </View>
            <Text style={styles.orderMeta}>{order.items?.length || 0} items</Text>
            <View style={styles.rowBottom}>
              <Text style={styles.price}>{formatCurrency(order.finalAmount || order.totalAmount)}</Text>
              <Text style={styles.arrow}>View details</Text>
            </View>
          </Pressable>
        )) : <EmptyState title="No orders yet" subtitle="Once you place your first order it will show up here." />}
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
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    padding: 16,
    gap: 10
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderNumber: {
    color: '#0f172a',
    fontWeight: '900'
  },
  status: {
    color: '#0f766e',
    backgroundColor: '#ecfeff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '800',
    textTransform: 'capitalize'
  },
  orderMeta: {
    color: '#64748b'
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  price: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 16
  },
  arrow: {
    color: '#0f766e',
    fontWeight: '700'
  }
});
