'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  image: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Veritabanından (Server-side session) sepeti getir
  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart || []);
        
        // Chatbot'un (Supsis Widget) görebilmesi için global değişkene yaz
        if (data.sessionId && typeof window !== 'undefined') {
          (window as any).novaCartSessionId = data.sessionId;
        }
      }
    } catch (e) {
      console.error('Cart fetch hatası', e);
    }
  };

  useEffect(() => {
    fetchCart();
    
    // Supsis backend'i doğrudan sepeti güncellerse tarayıcının bunu otomatik fark etmesi için Polling (3 saniyede bir)
    const interval = setInterval(() => {
      fetchCart();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Supsis Chatbot Event Listener
  useEffect(() => {
    const handleSupsisCartEvent = async (event: any) => {
      const { productCode, quantity } = event.detail || {};
      
      if (productCode) {
        try {
          // Doğrudan API ile sepete ekle (Bu aynı zamanda session cookie de oluşturur)
          const res = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productCode, quantity: quantity || 1 })
          });
          
          if (res.ok) {
            console.log(`🤖 Supsis Bot: ${productCode} sepete eklendi!`);
            fetchCart(); // Sepeti sunucudan güncelle
            setIsCartOpen(true);
          }
        } catch (error) {
          console.error('Supsis Cart Integration Error:', error);
        }
      }
    };

    window.addEventListener('supsis:add-to-cart', handleSupsisCartEvent);
    return () => window.removeEventListener('supsis:add-to-cart', handleSupsisCartEvent);
  }, []);

  const addToCart = async (product: Product, quantity = 1) => {
    // Önce UI'ı iyimser (optimistic) güncelle
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);

    // Sonra sunucuya kaydet
    await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productCode: product.code, quantity })
    });
    fetchCart(); // Kesin doğrulama için
  };

  const removeFromCart = async (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    await fetch('/api/cart/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', productId })
    });
    fetchCart();
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
    await fetch('/api/cart/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', productId, quantity })
    });
    fetchCart();
  };

  const clearCart = async () => {
    setCart([]);
    await fetch('/api/cart/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' })
    });
  };

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        totalPrice,
      }}
    >
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

