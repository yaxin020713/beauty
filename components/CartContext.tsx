"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Product } from "@/lib/types";

export type CartItem = Product & {
  quantity: number;
  variantId?: string;
  optionName?: string;
};

export enum UserRole {
  Admin = "admin",
  Customer = "customer",
}

export type User = {
  email: string;
  role: UserRole;
  loginTime: number;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => boolean;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isAdmin: boolean;
  isCustomer: boolean;
  showMemberProfileModal: boolean;
  openMemberProfileModal: (email: string) => void;
  closeMemberProfileModal: () => void;
  pendingMemberEmail: string | null;
};

type CartContextType = {
  cartItems: CartItem[];
  isOpen: boolean;
  totalQuantity: number;
  totalPrice: number;
  totalWeightKg: number;
  addToCart: (product: Product, variant?: { variantId: string; optionName: string }) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, delta: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  mobileFilterOpen: boolean;
  openMobileFilter: () => void;
  closeMobileFilter: () => void;
  referralCode: string | null;
  setReferralCode: (code: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CartContext = createContext<CartContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "auth_user";
const CART_STORAGE_KEY = "cart_items";

function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

function getUserRole(email: string, adminEmail: string): UserRole {
  return email.toLowerCase() === adminEmail.toLowerCase()
    ? UserRole.Admin
    : UserRole.Customer;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showMemberProfileModal, setShowMemberProfileModal] = useState(false);
  const [pendingMemberEmail, setPendingMemberEmail] = useState<string | null>(null);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "yaxinzhu2002@gmail.com";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsedUser = JSON.parse(stored) as User;
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to load user from localStorage:", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    (email: string): boolean => {
      if (!validateEmail(email)) {
        return false;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const role = getUserRole(normalizedEmail, adminEmail);
      const newUser: User = {
        email: normalizedEmail,
        role,
        loginTime: Date.now(),
      };

      setUser(newUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      } catch (error) {
        console.error("Failed to save user to localStorage:", error);
      }
      return true;
    },
    [adminEmail]
  );

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove user from localStorage:", error);
    }
  }, []);

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const openMemberProfileModal = useCallback((email: string) => {
    setPendingMemberEmail(email);
    setShowMemberProfileModal(true);
  }, []);

  const closeMemberProfileModal = useCallback(() => {
    setShowMemberProfileModal(false);
    setPendingMemberEmail(null);
  }, []);

  const isAdmin = user?.role === UserRole.Admin;
  const isCustomer = user?.role === UserRole.Customer;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        isAdmin,
        isCustomer,
        showMemberProfileModal,
        openMemberProfileModal,
        closeMemberProfileModal,
        pendingMemberEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsedCart = JSON.parse(stored) as CartItem[];
        setCartItems(parsedCart);
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      if (cartItems.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [cartItems]);

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalWeightKg = Number(
    cartItems
      .reduce((sum, item) => sum + (item.weight_g * item.quantity) / 1000, 0)
      .toFixed(3)
  );

  const addToCart = useCallback((product: Product, variant?: { variantId: string; optionName: string }) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.id === product.id &&
          (!variant ? !item.variantId : item.variantId === variant.variantId)
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id &&
          (!variant ? !item.variantId : item.variantId === variant.variantId)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          variantId: variant?.variantId,
          optionName: variant?.optionName,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          !(item.id === productId && (!variantId ? !item.variantId : item.variantId === variantId))
      )
    );
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string | undefined, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === productId &&
          (!variantId ? !item.variantId : item.variantId === variantId)
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const openCart = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openMobileFilter = useCallback(() => {
    setMobileFilterOpen(true);
  }, []);

  const closeMobileFilter = useCallback(() => {
    setMobileFilterOpen(false);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isOpen,
        totalQuantity,
        totalPrice,
        totalWeightKg,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        mobileFilterOpen,
        openMobileFilter,
        closeMobileFilter,
        referralCode,
        setReferralCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
