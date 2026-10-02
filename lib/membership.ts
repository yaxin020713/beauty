export type MembershipLevel = "銅級" | "銀級" | "金級" | "白金級";

export function calculateMembershipLevel(totalSpending: number): MembershipLevel {
  if (totalSpending >= 20000) return "白金級";
  if (totalSpending >= 15000) return "金級";
  if (totalSpending >= 8000) return "銀級";
  return "銅級";
}

export function isCurrentYear(dateString: string): boolean {
  const date = new Date(dateString);
  const currentYear = new Date().getFullYear();
  return date.getFullYear() === currentYear;
}

export function getCurrentYearRange(): { start: string; end: string } {
  const currentYear = new Date().getFullYear();
  return {
    start: `${currentYear}-01-01`,
    end: `${currentYear}-12-31`,
  };
}

export const MEMBERSHIP_THRESHOLDS = {
  銅級: 0,
  銀級: 8000,
  金級: 15000,
  白金級: 20000,
} as const;

export const MEMBERSHIP_BENEFITS = {
  銅級: "新會員等級",
  銀級: "一年內消費滿 NT$8,000",
  金級: "一年內消費滿 NT$15,000",
  白金級: "一年內消費滿 NT$20,000",
} as const;
