"use client";

import React, { createContext, useContext, useState } from "react";

import { Product, CartItem } from "@/types/types";

interface CartContextType {
  items: CartItem[] ;
  updateQty: (item: Product, qty: number) => void;
  addQty: (item: Product, qty: number) => void;
  resetCart: () => void ;
}

// 1. Create the context with a default value
const CartContext = createContext<CartContextType>({
  items: [],
  updateQty:() => {},
  addQty:() => {},
  resetCart: () => {},
});

// 2. Create the provider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setCartItems] = useState<CartItem[]>([]);
  
  const updateQty = async (product: Product, qty: number) => {
    if(items.length > 0 && items.filter(item => item.product.id === product.id ).length > 0 ){ // product is already in the cart
        const index = items.findIndex(el => el.product.id === product.id);
        const updatedCart = [ ... items ];
        updatedCart[index] = {
            ...updatedCart[index],
            qty: qty,
        }
        setCartItems(updatedCart);
    } else {
        items.push({
            product: product,
            qty: qty,
        })
    }
  };

  const addQty = async (product: Product, qty: number) => {
    if(items.length > 0 && items.filter(item => item.product.id === product.id ).length > 0 ){ // product is already in the cart
        const index = items.findIndex(el => el.product.id === product.id);
        const updatedCart = [ ... items ];
        updatedCart[index] = {
            ...updatedCart[index],
            qty: (qty + updatedCart[index].qty) < 0 ? 0 : qty + updatedCart[index].qty,
        }
        setCartItems(updatedCart);
    } else if (qty > 0){
        setCartItems([...items, {
            product: product,
            qty: qty,
        }]);
    }
  };

  const resetCart = async () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        updateQty,
        addQty,
        resetCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// 3. Create a custom hook to access the context
export const useCart = () => {
  return useContext(CartContext);
};