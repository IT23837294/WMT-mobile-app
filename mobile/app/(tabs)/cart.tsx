import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import EmptyState from '@/src/components/EmptyState';
import Screen from '@/src/components/Screen';
import Section from '@/src/components/Section';
import { useAuth } from '@/src/context/AuthContext';
import { useCart } from '@/src/context/CartContext';
import { formatCurrency } from '@/src/lib/api';

export default function CartScreen() {
  const { user } = useAuth();
  const { cart, loading, refreshCart, updateItem, removeItem, clearCart, checkout, validateCart, message } = useCart();
  const [contactNumber, setContactNumber] = useState(user?.phone || '');
  const [street, setStreet] = useState(user?.address?.street || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [stateName, setStateName] = useState(user?.address?.state || '');
  const [zipCode, setZipCode] = useState(user?.address?.zipCode || '');
  const [cardHolderName, setCardHolderName] = useState(user?.name || '');
  const [cardNumber, setCardNumber] = useState('4111111111111111');
  const [cardExpiryMonth, setCardExpiryMonth] = useState('12');
  const [cardExpiryYear, setCardExpiryYear] = useState('2028');
  const [cardCvv, setCardCvv] = useState('123');
  const [receiptEmail, setReceiptEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    refreshCart().catch(() => undefined);
  }, []);

  useEffect(() => {
    setContactNumber(user?.phone || '');
    setStreet(user?.address?.street || '');
    setCity(user?.address?.city || '');
    setStateName(user?.address?.state || '');
    setZipCode(user?.address?.zipCode || '');
    setCardHolderName(user?.name || '');
    setReceiptEmail(user?.email || '');
  }, [user]);

  const cartItems = cart?.items || [];
  const subtotal = useMemo(() => cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0), [cartItems]);

  const changeQuantity = async (itemId: string, currentQuantity: number, delta: number) => {
    const nextQuantity = currentQuantity + delta;

    if (nextQuantity <= 0) {
      await removeItem(itemId);
      return;
    }

    await updateItem(itemId, nextQuantity);
  };

  const placeOrder = async () => {
    if (!street || !city || !stateName || !zipCode || !contactNumber) {
      setFeedback('Please complete the delivery address and contact number.');
      return;
    }

    setCheckoutLoading(true);
    setFeedback(null);

    const validation = await validateCart();
    if (!validation.success) {
      setCheckoutLoading(false);
      setFeedback(validation.message || 'Cart validation failed');
      return;
    }

    const response = await checkout({
      paymentMethod: 'card',
      contactNumber,
      receiptEmail,
      notes,
      cardHolderName,
      cardNumber,
      cardExpiryMonth,
      cardExpiryYear,
      cardCvv,
      deliveryAddress: {
        street,
        city,
        state: stateName,
        zipCode,
        country: user?.address?.country || 'Sri Lanka'
      }
    });

    setCheckoutLoading(false);

    if (response.success && response.order) {
      setFeedback('Order placed successfully.');
      router.push(`/order/${response.order._id}`);
      return;
    }

    setFeedback(response.message || 'Checkout failed');
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
        <Section title="Cart" subtitle="Review quantities and complete checkout with the backend order API." />

        {message ? <Text style={styles.banner}>{message}</Text> : null}

        {feedback ? <Text style={styles.banner}>{feedback}</Text> : null}

        {cartItems.length > 0 ? cartItems.map((item) => (
          <View key={item._id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{item.medicine.name}</Text>
                <Text style={styles.itemMeta}>{formatCurrency(item.price)} each</Text>
              </View>
              <Pressable onPress={() => removeItem(item._id)}>
                <Text style={styles.removeAction}>Remove</Text>
              </Pressable>
            </View>

            <View style={styles.qtyRow}>
              <Pressable style={styles.qtyButton} onPress={() => changeQuantity(item._id, item.quantity, -1)}>
                <Text style={styles.qtyButtonText}>-</Text>
              </Pressable>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <Pressable style={styles.qtyButton} onPress={() => changeQuantity(item._id, item.quantity, 1)}>
                <Text style={styles.qtyButtonText}>+</Text>
              </Pressable>
              <Text style={styles.lineTotal}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          </View>
        )) : <EmptyState title="Your cart is empty" subtitle="Add medicines from the catalog to start building an order." />}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order summary</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery</Text><Text style={styles.summaryValue}>{formatCurrency(50)}</Text></View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}><Text style={styles.summaryLabelTotal}>Total</Text><Text style={styles.summaryValueTotal}>{formatCurrency(subtotal + 50)}</Text></View>
        </View>

        <Section title="Checkout" subtitle="Card checkout is wired to the backend order route. Use a test card if your backend validates locally." />

        <View style={styles.formCard}>
          <TextInput placeholder="Contact number" placeholderTextColor="#94a3b8" style={styles.input} value={contactNumber} onChangeText={setContactNumber} />
          <TextInput placeholder="Street" placeholderTextColor="#94a3b8" style={styles.input} value={street} onChangeText={setStreet} />
          <TextInput placeholder="City" placeholderTextColor="#94a3b8" style={styles.input} value={city} onChangeText={setCity} />
          <TextInput placeholder="State" placeholderTextColor="#94a3b8" style={styles.input} value={stateName} onChangeText={setStateName} />
          <TextInput placeholder="Zip code" placeholderTextColor="#94a3b8" style={styles.input} value={zipCode} onChangeText={setZipCode} />
          <TextInput placeholder="Receipt email" placeholderTextColor="#94a3b8" style={styles.input} value={receiptEmail} onChangeText={setReceiptEmail} />
          <TextInput placeholder="Card holder name" placeholderTextColor="#94a3b8" style={styles.input} value={cardHolderName} onChangeText={setCardHolderName} />
          <TextInput placeholder="Card number" placeholderTextColor="#94a3b8" style={styles.input} value={cardNumber} onChangeText={setCardNumber} keyboardType="number-pad" />
          <View style={styles.inlineRow}>
            <TextInput placeholder="MM" placeholderTextColor="#94a3b8" style={[styles.input, styles.inlineInput]} value={cardExpiryMonth} onChangeText={setCardExpiryMonth} keyboardType="number-pad" />
            <TextInput placeholder="YYYY" placeholderTextColor="#94a3b8" style={[styles.input, styles.inlineInput]} value={cardExpiryYear} onChangeText={setCardExpiryYear} keyboardType="number-pad" />
            <TextInput placeholder="CVV" placeholderTextColor="#94a3b8" style={[styles.input, styles.inlineInput]} value={cardCvv} onChangeText={setCardCvv} keyboardType="number-pad" />
          </View>
          <TextInput placeholder="Notes" placeholderTextColor="#94a3b8" style={[styles.input, styles.notes]} value={notes} onChangeText={setNotes} multiline />
          <Pressable style={({ pressed }) => [styles.checkoutButton, pressed && styles.pressed]} onPress={placeOrder} disabled={checkoutLoading || cartItems.length === 0}>
            {checkoutLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.checkoutButtonText}>Place order</Text>}
          </Pressable>
        </View>

        <Pressable style={styles.secondaryButton} onPress={clearCart} disabled={cartItems.length === 0}>
          <Text style={styles.secondaryButtonText}>Clear cart</Text>
        </Pressable>
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
  banner: {
    backgroundColor: '#ecfeff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#a5f3fc',
    color: '#155e75',
    fontWeight: '600'
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    gap: 12
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  itemCopy: {
    flex: 1,
    paddingRight: 10
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  itemMeta: {
    color: '#64748b',
    marginTop: 4
  },
  removeAction: {
    color: '#dc2626',
    fontWeight: '700'
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  qtyButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qtyButtonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900'
  },
  qtyValue: {
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '800',
    color: '#0f172a'
  },
  lineTotal: {
    marginLeft: 'auto',
    color: '#0f172a',
    fontWeight: '800'
  },
  summaryCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 18,
    gap: 12
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryLabel: {
    color: '#cbd5e1'
  },
  summaryValue: {
    color: '#ffffff',
    fontWeight: '700'
  },
  summaryTotalRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)'
  },
  summaryLabelTotal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  summaryValueTotal: {
    color: '#86efac',
    fontSize: 18,
    fontWeight: '900'
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5eaf3',
    gap: 12
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
  inlineRow: {
    flexDirection: 'row',
    gap: 10
  },
  inlineInput: {
    flex: 1
  },
  notes: {
    minHeight: 96,
    textAlignVertical: 'top'
  },
  checkoutButton: {
    backgroundColor: '#0f766e',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center'
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5eaf3'
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '700'
  }
});
