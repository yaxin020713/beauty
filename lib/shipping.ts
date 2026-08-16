// 運費設定
export const SHIPPING_COSTS = {
  CONVENIENCE_711: 60, // 7-11 超商取貨運費
  FACE_TO_FACE: 0, // 面交無運費
} as const;

// 7-11 超商門市範例資料（可透過環境變數或 API 更新）
export const CONVENIENCE_711_STORES = [
  { id: "7001", name: "台北中山門市", address: "台北市中山區" },
  { id: "7002", name: "台北信義門市", address: "台北市信義區" },
  { id: "7003", name: "台北大安門市", address: "台北市大安區" },
  { id: "7004", name: "台北松山門市", address: "台北市松山區" },
  { id: "7005", name: "台北南港門市", address: "台北市南港區" },
  { id: "7006", name: "新北板橋門市", address: "新北市板橋區" },
  { id: "7007", name: "新北新店門市", address: "新北市新店區" },
  { id: "7008", name: "桃園中壢門市", address: "桃園市中壢區" },
  { id: "7009", name: "台中西屯門市", address: "台中市西屯區" },
  { id: "7010", name: "高雄前金門市", address: "高雄市前金區" },
] as const;

export type ShippingMethod = "convenience_711" | "face_to_face";
