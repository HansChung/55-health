/**
 * 邁笙 AI 影音創作平台（api.lk888.ai）共用設定 — 影片生成與拍照辨識都走同一把 key
 * 文件：https://maxim.lk888.ai/apidoc
 * 只能在伺服器端使用
 */

const DEFAULT_BASE_URL = "https://api.lk888.ai";

type Env = Record<string, string | undefined>;

export function lk888ApiKey(env: Env = process.env): string | null {
  return env.LK888_API_KEY || null;
}

export function lk888BaseUrl(env: Env = process.env): string {
  return (env.LK888_API_BASE || DEFAULT_BASE_URL).replace(/\/+$/, "");
}
