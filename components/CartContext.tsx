"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/types";

// 購物車項目（productId 對應商品庫存 id）
export type CartItem = {
  productId: string;
  name: string;
  price: number;
  weight_g: number;
  quantity: number;
  image?: string;
};

type CartContextValue = {
  /** 購物車內所有項目 */
  cartItems: CartItem[];
  /** 加入商品（已存在則數量 +1） */
  addToCart: (product: Product) => void;
  /** 移除單一商品 */
  removeFromCart: (productId: string) => void;
  /** 調整數量（delta 為正增加、為負減少；數量 <= 0 時自動移除） */
  updateQuantity: (productId: string, delta: number) => void;
  /** 清空購物車 */
  clearCart: () => void;
  /** 自動計算總金額 */
  totalPrice: number;
  /** 自動計算總重量 (kg) = Σ(weight_g × quantity) / 1000 */
  totalWeightKg: number;
  /** 購物車總件數 */
  totalQuantity: number;
  /** 側欄開關狀態（給 UI 使用） */
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CART_STORAGE_KEY = "makeup-cart";

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // 首次載入時從 localStorage 還原購物車
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCartItems(parsed);
      }
    } catch {
      // 忽略 localStorage 讀取失敗
    }
  }, []);

  // 購物車變更時同步儲存
  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // 忽略 localStorage 寫入失敗
    }
  }, [cartItems]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  // 加入商品：已存在則數量 +1，否則新增一筆
  const addToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          weight_g: product.weight_g,
          image: product.image,
          quantity: 1,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  // 以 delta 調整數量；小於等於 0 時直接移除
  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCartItems((prev) =>
      prev.flatMap((i) => {
        if (i.productId !== productId) return [i];
        const nextQuantity = i.quantity + delta;
        return nextQuantity <= 0 ? [] : [{ ...i, quantity: nextQuantity }];
      })
    );
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  // 自動計算總金額 / 總重量 / 總件數
  const totals = useMemo(() => {
    let price = 0;
    let weight = 0;
    let count = 0;
    for (const item of cartItems) {
      price += item.price * item.quantity;
      weight += (item.weight_g * item.quantity) / 1000;
      count += item.quantity;
    }
    return {
      totalPrice: price,
      totalWeightKg: Number(weight.toFixed(3)),
      totalQuantity: count,
    };
  }, [cartItems]);

  const value = useMemo<CartContextValue>(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      ...totals,
      isOpen,
      openCart,
      closeCart,
    }),
    [
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totals,
      isOpen,
      openCart,
      closeCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// 必須在 <CartProvider> 內使用
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart 必須在 <CartProvider> 內使用");
  }
  return ctx;
}
