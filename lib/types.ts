// 商品資料型別（對應 Notion Products 資料庫）
export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  weight_g: number;
  cost50: number;
  cost100: number;
  image: string;
  description: string;
  totalSold: number;
};

// 商品變體型別（對應 Notion ProductVariants 資料庫）
export type ProductVariant = {
  id: string;
  productId: string;
  optionName: string;
  stock: number;
};
