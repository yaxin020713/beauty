// 銀行轉帳資訊（可透過 .env / Vercel 環境變數覆寫）
// NEXT_PUBLIC_BANK_CODE / NEXT_PUBLIC_BANK_ACCOUNT / NEXT_PUBLIC_BANK_NAME
export const BANK_INFO = {
  code: process.env.NEXT_PUBLIC_BANK_CODE ?? "823",
  bankName: process.env.NEXT_PUBLIC_BANK_NAME_FULL ?? "將來銀行",
  account: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "88672291071364",
  accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "美妝選物店",
} as const;
