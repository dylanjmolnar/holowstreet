import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  variantId?: number;
  color?: string;
  size?: string;
  imageUrl?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  removeFromCart: (id: number, variantId?: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  updateQuantity: (id: number, variantId: number | undefined, quantity: number) => void;
  removeItem: (id: number, variantId?: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => 
        cartItem.id === item.id && cartItem.variantId === item.variantId
      );
      if (existingItem) {
        return prevItems.map((cartItem) =>
          (cartItem.id === item.id && cartItem.variantId === item.variantId)
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        return [...prevItems, { ...item, quantity }];
      }
    });
  };

  const removeFromCart = (id: number, variantId?: number) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => 
        cartItem.id === id && cartItem.variantId === variantId
      );
      if (existingItem && existingItem.quantity > 1) {
        return prevItems.map((cartItem) =>
          (cartItem.id === id && cartItem.variantId === variantId)
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else {
        return prevItems.filter((cartItem) => 
          !(cartItem.id === id && cartItem.variantId === variantId)
        );
      }
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const updateQuantity = (id: number, variantId: number | undefined, quantity: number) => {
    setCartItems(prev => prev.map(item => 
      (item.id === id && item.variantId === variantId) 
        ? { ...item, quantity } 
        : item
    ));
  };

  const removeItem = (id: number, variantId?: number) => {
    setCartItems(prev => prev.filter(item => 
      !(item.id === id && item.variantId === variantId)
    ));
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, getCartTotal, getCartItemCount, updateQuantity, removeItem }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
