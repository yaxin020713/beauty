#!/usr/bin/env node

/**
 * Notion 數據備份腳本
 * 用法：node scripts/backup-notion-data.mjs
 * 可配置 cron 定期執行，例如每天凌晨 2 點
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupDir = path.join(__dirname, "../.backups");

// 確保備份目錄存在
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`✅ 創建備份目錄: ${backupDir}`);
}

// 讀取環境變數
function loadEnv() {
  const envPath = path.join(__dirname, "../.env.local");
  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};

  content.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });

  return env;
}

const env = loadEnv();
const API_KEY = env.NOTION_API_KEY;
const DB_IDS = {
  members: env.NOTION_MEMBERS_DB_ID,
  orders: env.NOTION_ORDERS_DB_ID,
  products: env.NOTION_PRODUCTS_DB_ID,
  variants: env.NOTION_PRODUCT_VARIANTS_DB_ID,
};

if (!API_KEY) {
  console.error("❌ 未找到 NOTION_API_KEY");
  process.exit(1);
}

/**
 * 查詢 Notion 數據庫
 */
async function queryDatabase(dbId, paginate = true) {
  const results = [];
  let cursor = undefined;

  do {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${dbId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_cursor: cursor,
          page_size: 100,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`查詢數據庫失敗: ${response.statusText}`);
    }

    const data = await response.json();
    results.push(...data.results);

    if (!paginate || !data.has_more) {
      break;
    }

    cursor = data.next_cursor;
  } while (true);

  return results;
}

/**
 * 執行備份
 */
async function backup() {
  console.log(`📦 開始備份 Notion 數據 (${new Date().toISOString()})`);

  const backupData = {
    timestamp: new Date().toISOString(),
    databases: {},
  };

  for (const [dbName, dbId] of Object.entries(DB_IDS)) {
    if (!dbId) {
      console.log(`⏭️  跳過 ${dbName} (未配置)`);
      continue;
    }

    try {
      console.log(`  📥 正在備份 ${dbName}...`);
      const data = await queryDatabase(dbId);
      backupData.databases[dbName] = {
        count: data.length,
        data: data,
      };
      console.log(`  ✅ ${dbName}: ${data.length} 條記錄`);
    } catch (error) {
      console.error(`  ❌ ${dbName} 備份失敗:`, error.message);
    }
  }

  // 保存備份文件
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("+")[0];
  const filename = `notion-backup-${timestamp}.json`;
  const filepath = path.join(backupDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
  console.log(`\n💾 備份文件已保存: ${filepath}`);
  console.log(`📊 備份大小: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);

  // 清理舊備份（保留最近 30 天）
  cleanupOldBackups(30);
}

/**
 * 清理 30 天以前的備份
 */
function cleanupOldBackups(days = 30) {
  const now = Date.now();
  const maxAge = days * 24 * 60 * 60 * 1000;

  const files = fs.readdirSync(backupDir);

  files.forEach((file) => {
    const filepath = path.join(backupDir, file);
    const stats = fs.statSync(filepath);
    const age = now - stats.mtime.getTime();

    if (age > maxAge) {
      fs.unlinkSync(filepath);
      console.log(`🗑️  已删除舊備份: ${file}`);
    }
  });
}

/**
 * 主函數
 */
async function main() {
  try {
    await backup();
    console.log(`\n✨ 備份完成！`);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ 備份失敗:`, error.message);
    process.exit(1);
  }
}

main();
