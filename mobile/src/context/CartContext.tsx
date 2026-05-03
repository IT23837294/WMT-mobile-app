import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { ApiError, request } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import type { Cart, Order } from '@/src/types';

type CheckoutPayload = {
  paymentMethod: 'card' | 'bank_deposit';
  contactNumber: string;
  notes?: string;
  receiptEmail?: string;
  paymentReference?: string;
  cardHolderName?: string;
  cardNumber?: string;
  cardExpiryMonth?: string;
  cardExpiryYear?: string;
  cardCvv?: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
};

type CartContextValue = {
  cart: Cart | null;
  loading: boolean;
  message: string | null;
  refreshCart: () => Promise<void>;
  addToCart: (medicineId: string, quantity?: number) => Promise<{ success: boolean; message?: string }>;
  updateItem: (itemId: string, quantity: number) => Promise<{ success: boolean; message?: string }>;
  removeItem: (itemId: string) => Promise<{ success: boolean; message?: string }>;
  clearCart: () => Promise<{ success: boolean; message?: string }>;
  validateCart: () => Promise<{ success: boolean; message?: string; totalAmount?: number }>;
  checkout: (payload: CheckoutPayload) => Promise<{ success: boolean; message?: string; order?: Order }>;
};

const CartContext = createContext<CartContextValue | null>(null);

const getMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshCart = async () => {
    if (!isAuthenticated || !token) {
      setCart(null);
      return;
    }

    setLoading(true);
    try {
      const response = await request<{ success: boolean; cart: Cart }>('/cart', {
        method: 'GET',
        token
      });

      setCart(response.cart);
      setMessage(null);
    } catch (error) {
      setMessage(getMessage(error, 'Unable to load cart'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated, token]);

  const withCartRefresh = async <T,>(executor: () => Promise<T>) => {
    setLoading(true);
    try {
      const result = await executor();
      await refreshCart();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (medicineId: string, quantity = 1) => {
    if (!token) {
      return { success: false, message: 'Please sign in first' };
    }

    try {
      await withCartRefresh(() =>
        request('/cart/add', {
          method: 'POST',
          token,
          body: { medicineId, quantity }
        })
      );
      return { success: true };
    } catch (error) {
      const message = getMessage(error, 'Unable to add to cart');
      setMessage(message);
      return { success: false, message };
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    if (!token) {
      return { success: false, message: 'Please sign in first' };
    }

    try {
      await withCartRefresh(() =>
        request(`/cart/item/${itemId}`, {
          method: 'PUT',
          token,
          body: { quantity }
        })
      );
      return { success: true };
    } catch (error) {
      const message = getMessage(error, 'Unable to update cart');
      setMessage(message);
      return { success: false, message };
    }
  };

  const removeItem = async (itemId: string) => {
    if (!token) {
      return { success: false, message: 'Please sign in first' };
    }

    try {
      await withCartRefresh(() =>
        request(`/cart/item/${itemId}`, {
          method: 'DELETE',
          token
        })
      );
      return { success: true };
    } catch (error) {
      const message = getMessage(error, 'Unable to remove cart item');
      setMessage(message);
      return { success: false, message };
    }
  };

  const clearCart = async () => {
    if (!token) {
      return { success: false, message: 'Please sign in first' };
    }

    try {
      await withCartRefresh(() =>
        request('/cart/clear', {
          method: 'DELETE',
          token
        })
      );
      return { success: true };
    } catch (error) {
      const message = getMessage(error, 'Unable to clear cart');
      setMessage(message);
      return { success: false, message };
    }
  };

  const validateCart = async () => {
    if (!token) {
      return { success: false, message: 'Please sign in first' };
    }

    try {
      return await request<{ success: boolean; message: string; totalAmount: number }>('/cart/validate', {
        method: 'GET',
        token
      });
    } catch (error) {
      const message = getMessage(error, 'Cart validation failed');
      return { success: false, message };
    }
  };

  const checkout = async (payload: CheckoutPayload) => {
    if (!token) {
      return { success: false, message: 'Please sign in first' };
    }

    const formData = new FormData();
    formData.append('paymentMethod', payload.paymentMethod);
    formData.append('contactNumber', payload.contactNumber);
    formData.append('notes', payload.notes || '');
    formData.append('receiptEmail', payload.receiptEmail || '');
    formData.append('paymentReference', payload.paymentReference || '');
    formData.append('cardHolderName', payload.cardHolderName || '');
    formData.append('cardNumber', payload.cardNumber || '');
    formData.append('cardExpiryMonth', payload.cardExpiryMonth || '');
    formData.append('cardExpiryYear', payload.cardExpiryYear || '');
    formData.append('cardCvv', payload.cardCvv || '');
    formData.append('deliveryAddress[street]', payload.deliveryAddress.street);
    formData.append('deliveryAddress[city]', payload.deliveryAddress.city);
    formData.append('deliveryAddress[state]', payload.deliveryAddress.state);
    formData.append('deliveryAddress[zipCode]', payload.deliveryAddress.zipCode);
    formData.append('deliveryAddress[country]', payload.deliveryAddress.country || 'Sri Lanka');

    try {
      const response = await request<{ success: boolean; message: string; order: Order }>('/orders', {
        method: 'POST',
        token,
        formData
      });

      await refreshCart();
      return response;
    } catch (error) {
      const message = getMessage(error, 'Checkout failed');
      setMessage(message);
      return { success: false, message };
    }
  };

  const value = useMemo(
    () => ({
      cart,
      loading,
      message,
      refreshCart,
      addToCart,
      updateItem,
      removeItem,
      clearCart,
      validateCart,
      checkout
    }),
    [cart, loading, message]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
};
