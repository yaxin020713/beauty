import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 合併 Tailwind class（支援條件式 class 並覆蓋衝突）
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
