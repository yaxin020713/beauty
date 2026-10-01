const apiKey = process.env.NOTION_API_KEY;
const productsDbId = process.env.NOTION_PRODUCTS_DB_ID;
const ordersDbId = process.env.NOTION_ORDERS_DB_ID;
const membersDbId = process.env.NOTION_MEMBERS_DB_ID;
const withdrawalsDbId = process.env.NOTION_WITHDRAWALS_DB_ID;
const productVariantsDbId = process.env.NOTION_PRODUCT_VARIANTS_DB_ID;
const batchesDbId = process.env.NOTION_BATCHES_DB_ID;

if (!apiKey || !productsDbId || !ordersDbId) {
  throw new Error(
    "缺少 Notion 環境變數，請確認 .env.local 內有 NOTION_API_KEY / NOTION_PRODUCTS_DB_ID / NOTION_ORDERS_DB_ID"
  );
}

if (!membersDbId) {
  console.warn(
    "未設置 NOTION_MEMBERS_DB_ID，推薦碼功能將不可用。請在 .env.local 中添加 NOTION_MEMBERS_DB_ID"
  );
}

if (!withdrawalsDbId) {
  console.warn(
    "未設置 NOTION_WITHDRAWALS_DB_ID，提現管理功能將不可用。請在 .env.local 中添加 NOTION_WITHDRAWALS_DB_ID"
  );
}

if (!productVariantsDbId) {
  console.warn(
    "未設置 NOTION_PRODUCT_VARIANTS_DB_ID，商品變體功能將不可用。請在 .env.local 中添加 NOTION_PRODUCT_VARIANTS_DB_ID"
  );
}

if (!batchesDbId) {
  console.warn(
    "未設置 NOTION_BATCHES_DB_ID，預訂批次功能將不可用。請在 .env.local 中添加 NOTION_BATCHES_DB_ID"
  );
}

import { retry, isRetryableError } from "./retry";
import { logger } from "./logger";

// Wrapper around Notion API using fetch instead of SDK
class NotionClient {
  private apiKey: string;
  private baseUrl = "https://api.notion.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(method: string, path: string, body?: any) {
    return retry(
      async () => {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (!response.ok) {
          const error = new Error(data.message || "Notion API error");
          (error as any).code = data.code;
          (error as any).status = data.status;
          throw error;
        }

        return data;
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        onRetry: (attempt, error, delayMs) => {
          logger.warn(`Notion API 重試 (${attempt}/${3})`, {
            path,
            error: error.message,
            delayMs,
          });
        },
      }
    );
  }

  databases = {
    query: async (params: any) => {
      return this.request("POST", `/databases/${params.database_id}/query`, {
        page_size: params.page_size,
        filter: params.filter,
        sorts: params.sorts,
      });
    },
    retrieve: async (params: any) => {
      return this.request("GET", `/databases/${params.database_id}`);
    },
  };

  pages = {
    retrieve: async (params: any) => {
      return this.request("GET", `/pages/${params.page_id}`);
    },
    create: async (params: any) => {
      return this.request("POST", "/pages", params);
    },
    update: async (params: any) => {
      return this.request("PATCH", `/pages/${params.page_id}`, {
        properties: params.properties,
      });
    },
  };
}

export const notion = new NotionClient(apiKey!);

export const PRODUCTS_DB_ID = productsDbId;
export const ORDERS_DB_ID = ordersDbId;
export const MEMBERS_DB_ID = membersDbId || "";
export const WITHDRAWALS_DB_ID = withdrawalsDbId || "";
export const PRODUCT_VARIANTS_DB_ID = productVariantsDbId || "";
export const BATCHES_DB_ID = batchesDbId || "";

export async function updateProductReservedQuantity(
  productPageId: string,
  quantityToAdd: number
): Promise<void> {
  try {
    // 先查詢當前的 Reserved_Quantity
    const page = await notion.pages.retrieve({ page_id: productPageId });

    let currentReserved = 0;
    if ("properties" in page && page.properties) {
      const props = page.properties as Record<string, any>;
      if (props.Reserved_Quantity && "number" in props.Reserved_Quantity) {
        currentReserved = props.Reserved_Quantity.number ?? 0;
      }
    }

    // 更新為新值
    await notion.pages.update({
      page_id: productPageId,
      properties: {
        Reserved_Quantity: {
          number: currentReserved + quantityToAdd,
        },
      } as Record<string, any>,
    });
  } catch (error) {
    console.error(
      `[updateProductReservedQuantity] 更新失敗 (productPageId: ${productPageId}):`,
      error
    );
    throw error;
  }
}
