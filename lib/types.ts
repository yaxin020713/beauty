// 商品資料型別（對應 Notion Products 資料庫）
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  weight_g: number;
  cost50: number;
  cost100: number;
  image: string;
  description: string;
  totalSold: number;
};
