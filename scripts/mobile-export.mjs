// Mobile（Capacitor）靜態匯出建置
//
// output: "export" 不支援動態 server route handler。Mobile App 是純靜態殼，
// 所有 /api/* 與 OAuth callback 都打到線上後端（NEXT_PUBLIC_API_URL），不該被打包進 App。
// 因此建置前先把這些 server 路由暫時移出 app 樹，build 完（無論成敗）再還原。
//
// 用法：node scripts/mobile-export.mjs

import { execSync } from "node:child_process";
import { existsSync, renameSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";

const STASH = ".mobile-stash";
// 只在 mobile 靜態匯出時排除的 server-only 路由
const SERVER_ROUTES = ["src/app/api", "src/app/auth"];

function restoreAll() {
  for (const p of SERVER_ROUTES) {
    const stashed = `${STASH}/${p}`;
    if (existsSync(stashed) && !existsSync(p)) {
      mkdirSync(dirname(p), { recursive: true });
      renameSync(stashed, p);
    }
  }
  // 全部還原後清掉殘留的空殼（只在 stash 內已無任何 server route 時）
  const leftover = SERVER_ROUTES.some((p) => existsSync(`${STASH}/${p}`));
  if (existsSync(STASH) && !leftover) rmSync(STASH, { recursive: true, force: true });
}

// 先還原任何上次中斷殘留，確保起點乾淨
restoreAll();

try {
  for (const p of SERVER_ROUTES) {
    if (existsSync(p)) {
      const dest = `${STASH}/${p}`;
      mkdirSync(dirname(dest), { recursive: true });
      renameSync(p, dest);
    }
  }
  execSync("npx --no-install next build", {
    stdio: "inherit",
    env: { ...process.env, BUILD_TARGET: "mobile" },
  });
} finally {
  // 無論 build 成功或失敗都把 server 路由放回去
  restoreAll();
}
