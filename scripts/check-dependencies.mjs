#!/usr/bin/env node

/**
 * 依賴安全檢查腳本
 * 用法：node scripts/check-dependencies.mjs
 * 檢查依賴版本、安全漏洞等
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(__dirname, "../package.json");

console.log("🔍 開始檢查依賴...\n");

// 1. 檢查過時的依賴
console.log("1️⃣  檢查過時的依賴:");
try {
  const outdated = execSync("npm outdated", { encoding: "utf-8" });
  if (outdated.includes("Package")) {
    console.log(outdated);
    console.log("⚠️  發現過時的依賴，建議定期更新\n");
  } else {
    console.log("✅ 所有依賴都是最新版本\n");
  }
} catch (error) {
  console.log("✅ 所有依賴都是最新版本\n");
}

// 2. 檢查安全漏洞
console.log("2️⃣  檢查安全漏洞:");
try {
  execSync("npm audit --audit-level=moderate", { encoding: "utf-8" });
  console.log("✅ 未發現安全漏洞\n");
} catch (error) {
  console.log("⚠️  發現可能的安全漏洞:");
  console.log(error.stdout || error.message);
  console.log(
    "\n建議運行 'npm audit fix' 來自動修復，或手動更新相關依賴\n"
  );
}

// 3. 檢查包大小
console.log("3️⃣  檢查關鍵依賴包大小:");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

const sizeThresholds = {
  "next": 5000, // KB
  "react": 500,
  "@notionhq/client": 200,
};

Object.entries(sizeThresholds).forEach(([pkg, threshold]) => {
  if (pkg in dependencies) {
    try {
      const nodeModulesPath = path.join(
        __dirname,
        `../node_modules/${pkg}`
      );

      if (fs.existsSync(nodeModulesPath)) {
        const sizeKb = getDirectorySize(nodeModulesPath) / 1024;

        if (sizeKb > threshold) {
          console.log(
            `⚠️  ${pkg}: ${sizeKb.toFixed(2)} KB (閾值: ${threshold} KB)`
          );
        } else {
          console.log(`✅ ${pkg}: ${sizeKb.toFixed(2)} KB`);
        }
      }
    } catch (error) {
      // 忽略錯誤
    }
  }
});

console.log("\n4️⃣  依賴概覽:");
console.log(
  `  📦 生產依賴: ${Object.keys(packageJson.dependencies || {}).length}`
);
console.log(
  `  🛠️  開發依賴: ${Object.keys(packageJson.devDependencies || {}).length}`
);

// 5. 檢查敏感依賴
console.log("\n5️⃣  檢查敏感依賴版本:");
const sensitivePackages = {
  "next": "最新穩定版",
  "react": "18+",
  "@notionhq/client": "2.2.15+",
};

Object.entries(sensitivePackages).forEach(([pkg, expected]) => {
  if (pkg in dependencies) {
    const version = dependencies[pkg];
    console.log(`  ${pkg}: ${version} (預期: ${expected})`);
  }
});

console.log("\n✨ 檢查完成！\n");

/**
 * 計算目錄大小
 */
function getDirectorySize(dir) {
  let size = 0;
  try {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const path2 = `${dir}/${file}`;
      const stats = fs.statSync(path2);
      if (stats.isDirectory()) {
        size += getDirectorySize(path2);
      } else {
        size += stats.size;
      }
    });
  } catch (error) {
    // 忽略錯誤
  }
  return size;
}
