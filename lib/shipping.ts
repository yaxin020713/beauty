// 運費設定
export const SHIPPING_COSTS = {
  CONVENIENCE_711: 100, // 7-11 超商取貨運費
  FACE_TO_FACE: 0, // 面交無運費
} as const;

// 免運門檻（商品小計，不含運費）：滿此金額全館免運
export const FREE_SHIPPING_THRESHOLD = 3000;

// 現折門檻與金額：滿此金額（商品小計）現折 DISCOUNT_AMOUNT（此門檻高於免運門檻，故同時享免運）
export const DISCOUNT_THRESHOLD = 6000;
export const DISCOUNT_AMOUNT = 150;

export type ShippingMethod = "convenience_711" | "face_to_face";

// 依商品小計與收貨方式計算運費，滿免運門檻則一律免運
export function calculateShippingFee(
  subtotal: number,
  shippingMethod: ShippingMethod
): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return shippingMethod === "convenience_711"
    ? SHIPPING_COSTS.CONVENIENCE_711
    : SHIPPING_COSTS.FACE_TO_FACE;
}

// 依商品小計計算滿額現折金額
export function calculateDiscount(subtotal: number): number {
  return subtotal >= DISCOUNT_THRESHOLD ? DISCOUNT_AMOUNT : 0;
}

// 7-11 超商門市資料型別
export type Store = {
  id: string;
  name: string;
  address: string;
};

// 預設 7-11 超商門市資料（可透過 API /api/stores 動態更新）
export const DEFAULT_CONVENIENCE_711_STORES: Store[] = [
  { id: "7001", name: "台北中山門市", address: "台北市中山區南京東路二段111號" },
  { id: "7002", name: "台北信義門市", address: "台北市信義區松壽路9號" },
  { id: "7003", name: "台北大安門市", address: "台北市大安區敦化南路一段761號" },
  { id: "7004", name: "台北松山門市", address: "台北市松山區南京東路五段99號" },
  { id: "7005", name: "台北南港門市", address: "台北市南港區經貿二路190號" },
  { id: "7006", name: "新北板橋門市", address: "新北市板橋區新站路39號" },
  { id: "7007", name: "新北新店門市", address: "新北市新店區北新路三段101號" },
  { id: "7008", name: "桃園中壢門市", address: "桃園市中壢區新生路42號" },
  { id: "7009", name: "台中西屯門市", address: "台中市西屯區台灣大道三段727號" },
  { id: "7010", name: "高雄前金門市", address: "高雄市前金區中山一路468號" },
];

// 動態獲取 7-11 門市列表（優先使用 API，否則使用預設）
export async function getConvenience711Stores(): Promise<Store[]> {
  try {
    const response = await fetch("/api/stores", { cache: "force-cache" });
    if (response.ok) {
      const data = await response.json();
      return data.stores || DEFAULT_CONVENIENCE_711_STORES;
    }
  } catch (error) {
    console.warn("[shipping] 無法從 API 獲取門市資料:", error);
  }
  return DEFAULT_CONVENIENCE_711_STORES;
}
