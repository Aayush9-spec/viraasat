'use client';

import React, { createContext, useState, useContext, type ReactNode, useCallback, useMemo, useEffect } from 'react';
import { STORAGE_KEYS } from '@/config/constants';
import type { Product } from '@/lib/types';

export interface CartItem extends Product {
  quantity: number;
}

export interface CartContextType {
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;
  cartItems: CartItem[];
  addItem: (item: Product) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isCartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Persistence: Load from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
    }
    setHasLoaded(true);
  }, []);

  // Persistence: Save to localStorage
  useEffect(() => {
    if (hasLoaded) {
      try {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cartItems));
      } catch (e) {
        console.error('Failed to persist cart to localStorage', e);
      }
    }
  }, [cartItems, hasLoaded]);

  const addItem = useCallback((item: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      setCartOpen(true);
      return [...prevItems, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) {
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const value = useMemo(
    () => ({
      isCartOpen,
      setCartOpen,
      cartItems,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getCartTotal,
    }),
    [isCartOpen, cartItems, addItem, removeItem, updateQuantity, clearCart, getCartTotal]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
