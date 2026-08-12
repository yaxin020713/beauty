// 銀行轉帳資訊（可透過 .env / Vercel 環境變數覆寫）
// NEXT_PUBLIC_BANK_CODE / NEXT_PUBLIC_BANK_ACCOUNT / NEXT_PUBLIC_BANK_NAME
export const BANK_INFO = {
  code: process.env.NEXT_PUBLIC_BANK_CODE ?? "822",
  bankName: "中國信託",
  account: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "1234-5678-9012",
  accountName: process.env.NEXT_PUBLIC_BANK_NAME ?? "團購小幫手",
} as const;
