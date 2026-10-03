import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const MEMBERS_DB_ID = process.env.NOTION_MEMBERS_DB_ID;

async function debugUnrealizedCommission() {
  console.log("🔍 診斷待實現分潤寫入邏輯\n");

  try {
    // 1. 查詢一個會員記錄，查看所有字段
    const members = await notion.databases.query({
      database_id: MEMBERS_DB_ID,
      page_size: 1,
    });

    if (members.results.length === 0) {
      console.log("❌ Members表中沒有會員記錄");
      return;
    }

    const memberPage = members.results[0];
    console.log("✅ 找到會員記錄");
    console.log(`   Email: ${memberPage.properties.Email?.title?.[0]?.plain_text || "N/A"}`);

    // 2. 列出所有字段及其值
    console.log("\n📋 會員記錄中的所有字段:");
    const props = memberPage.properties;

    const fieldsToCheck = [
      "待實現分潤",
      "待提現分潤",
      "歷史累積分潤",
      "撥款處理中",
      "推薦碼",
      "Email",
    ];

    for (const fieldName of fieldsToCheck) {
      const prop = props[fieldName];
      if (prop) {
        if (prop.type === "number") {
          console.log(`   ✅ ${fieldName}: ${prop.number}`);
        } else if (prop.type === "title") {
          console.log(`   ✅ ${fieldName}: ${prop.title?.[0]?.plain_text || "N/A"}`);
        } else if (prop.type === "rich_text") {
          console.log(`   ✅ ${fieldName}: ${prop.rich_text?.[0]?.plain_text || "N/A"}`);
        } else {
          console.log(`   ✅ ${fieldName}: (type: ${prop.type})`);
        }
      } else {
        console.log(`   ❌ ${fieldName}: 不存在`);
      }
    }

    // 3. 查詢可用的字段
    console.log("\n🔎 Notion表中的所有字段名:");
    const db = await notion.databases.retrieve(MEMBERS_DB_ID);
    const allFields = Object.keys(db.properties).sort();
    allFields.forEach((field) => {
      console.log(`   - ${field}`);
    });

    // 4. 特別檢查"分潤"相關的字段
    console.log("\n🎯 分潤相關字段:");
    const commissionFields = allFields.filter((f) => f.includes("分潤"));
    if (commissionFields.length === 0) {
      console.log("   ❌ 沒有找到任何分潤相關字段!");
    } else {
      commissionFields.forEach((field) => {
        console.log(`   ✅ ${field}`);
      });
    }
  } catch (error) {
    console.error("❌ 錯誤:", error);
  }
}

debugUnrealizedCommission();
