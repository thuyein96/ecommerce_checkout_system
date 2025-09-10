"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export interface Product {
  product_id: string;
  product_name: string;
  price: number;
  shop_id: string;
  image: string;
  review: number;
  instock_Quantity: number;
  product_category: string;
}

export type CartItem = { product: Product; quantity: number };

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  clearCart: () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) => item.product.product_id === product.product_id
      );
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity }];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
