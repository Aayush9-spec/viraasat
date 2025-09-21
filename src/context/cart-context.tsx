'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;
  cartItems: Product[];
  addItem: (item: Product) => void;
  removeItem: (itemId: string) => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isCartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const { toast } = useToast();

  const addItem = (item: Product) => {
    setCartItems((prevItems) => {
      // Check if item is already in cart
      const isItemInCart = prevItems.find((cartItem) => cartItem.id === item.id);

      if (isItemInCart) {
        toast({
          variant: 'destructive',
          title: 'Item already in cart',
          description: `${item.name} is already in your cart.`,
        });
        return prevItems;
      }
      
      setCartOpen(true);
      return [...prevItems, item];
    });
  };

  const removeItem = (itemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };
  
  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  }, [cartItems]);

  return (
    <CartContext.Provider value={{ isCartOpen, setCartOpen, cartItems, addItem, removeItem, getCartTotal }}>
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
