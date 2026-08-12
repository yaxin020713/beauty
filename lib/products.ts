import { notion, PRODUCTS_DB_ID } from "./notion";
import type { Product } from "./types";

// ===== Notion property 取值 helper（避免直接 cast 造成的型別錯誤） =====

function asTitle(p: unknown): string {
  if (!p || typeof p !== "object") return "";
  const record = p as Record<string, unknown>;
  if (record["type"] !== "title") return "";
  const title = record["title"];
  if (!Array.isArray(title)) return "";
  return (title as { plain_text?: string }[])
    .map((t) => t.plain_text ?? "")
    .join("");
}

function asNumber(p: unknown): number {
  if (!p || typeof p !== "object") return 0;
  const record = p as Record<string, unknown>;
  if (record["type"] !== "number") return 0;
  const value = record["number"];
  return typeof value === "number" ? value : 0;
}

function asSelect(p: unknown): string {
  if (!p || typeof p !== "object") return "";
  const record = p as Record<string, unknown>;
  if (record["type"] !== "select") return "";
  const select = record["select"];
  if (!select || typeof select !== "object") return "";
  const name = (select as Record<string, unknown>)["name"];
  return typeof name === "string" ? name : "";
}

function asRichText(p: unknown): string {
  if (!p || typeof p !== "object") return "";
  const record = p as Record<string, unknown>;
  if (record["type"] !== "rich_text") return "";
  const richText = record["rich_text"];
  if (!Array.isArray(richText)) return "";
  return (richText as { plain_text?: string }[])
    .map((t) => t.plain_text ?? "")
    .join("");
}

function asUrl(p: unknown): string {
  if (!p || typeof p !== "object") return "";
  const record = p as Record<string, unknown>;
  if (record["type"] !== "url") return "";
  const value = record["url"];
  return typeof value === "string" ? value : "";
}

/** 讀取所有商品頁面並對映為前端使用的 Product 型別 */
export async function fetchProducts(): Promise<Product[]> {
  const response = await notion.databases.query({
    database_id: PRODUCTS_DB_ID,
    page_size: 100,
  });

  return response.results
    .map((page) => {
      if (!("properties" in page)) return null;
      const props = page.properties as Record<string, unknown>;

      const product: Product = {
        id: page.id,
        name: asTitle(props["Name"]),
        category: asSelect(props["Category"]),
        price: asNumber(props["Price"]),
        weight_g: asNumber(props["Weight_g"]),
        cost50: asNumber(props["Cost_50"]),
        cost100: asNumber(props["Cost_100"]),
        image: asUrl(props["Image"]),
        description: asRichText(props["Description"]),
        totalSold: asNumber(props["Total_Sold"]),
      };

      return product.name ? product : null;
    })
    .filter((p): p is Product => p !== null);
}

