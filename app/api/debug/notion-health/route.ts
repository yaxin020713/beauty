import { NextRequest, NextResponse } from "next/server";
import { notion, MEMBERS_DB_ID, ORDERS_DB_ID, PRODUCTS_DB_ID } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    databases: {},
  };

  // 測試 Members DB
  try {
    console.log("[notion-health] 測試 MEMBERS_DB_ID:", MEMBERS_DB_ID);
    const membersTest = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      page_size: 1,
    });
    results.databases.members = {
      status: "ok",
      recordCount: membersTest.results.length,
      dbId: MEMBERS_DB_ID,
    };
  } catch (error: any) {
    results.databases.members = {
      status: "error",
      error: error.message,
      dbId: MEMBERS_DB_ID,
    };
  }

  // 測試 Orders DB
  try {
    console.log("[notion-health] 測試 ORDERS_DB_ID:", ORDERS_DB_ID);
    const ordersTest = await notion.databases.query({
      database_id: ORDERS_DB_ID,
      page_size: 1,
    });
    results.databases.orders = {
      status: "ok",
      recordCount: ordersTest.results.length,
      dbId: ORDERS_DB_ID,
    };
  } catch (error: any) {
    results.databases.orders = {
      status: "error",
      error: error.message,
      dbId: ORDERS_DB_ID,
    };
  }

  // 測試 Products DB
  try {
    console.log("[notion-health] 測試 PRODUCTS_DB_ID:", PRODUCTS_DB_ID);
    const productsTest = await notion.databases.query({
      database_id: PRODUCTS_DB_ID,
      page_size: 1,
    });
    results.databases.products = {
      status: "ok",
      recordCount: productsTest.results.length,
      dbId: PRODUCTS_DB_ID,
    };
  } catch (error: any) {
    results.databases.products = {
      status: "error",
      error: error.message,
      dbId: PRODUCTS_DB_ID,
    };
  }

  const allHealthy = Object.values(results.databases).every(
    (db: any) => db.status === "ok"
  );

  return NextResponse.json(
    {
      healthy: allHealthy,
      ...results,
    },
    { status: allHealthy ? 200 : 500 }
  );
}
