import { UserRole } from "@/components/CartContext";

export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "yaxinzhu2002@gmail.com";

export function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

export function isValidEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim();

  if (!trimmed) {
    return { valid: false, error: "Email 不能為空" };
  }

  if (trimmed.length > 255) {
    return { valid: false, error: "Email 過長" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Email 格式不正確" };
  }

  return { valid: true };
}

export function getUserRole(email: string): UserRole {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedAdminEmail = ADMIN_EMAIL.toLowerCase();
  return normalizedEmail === normalizedAdminEmail ? UserRole.Admin : UserRole.Customer;
}

export function isAdmin(email: string): boolean {
  return getUserRole(email) === UserRole.Admin;
}

export function isCustomer(email: string): boolean {
  return getUserRole(email) === UserRole.Customer;
}

export function getUserRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.Admin:
      return "管理員";
    case UserRole.Customer:
      return "顧客";
    default:
      return "未知";
  }
}

export function getLoginTimeString(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-TW");
}
