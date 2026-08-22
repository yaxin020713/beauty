"use client";

import { useEffect } from "react";
import { useAuth } from "./CartContext";
import LoginModal from "./LoginModal";

export default function StorefrontWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, openLoginModal } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      openLoginModal();
    }
  }, [isLoading, user, openLoginModal]);

  return (
    <>
      {children}
      <LoginModal />
    </>
  );
}
