// ────────────────────────────────────────────────
// 排程用的併發控制與時間預算
// Vercel Cron 有執行時間上限；逐一序列處理在使用者變多後會被中途砍斷，
// 且不會有任何錯誤訊息（靜默漏掉後面的長輩）。
// 這裡提供：受限併發 + 時間預算，讓「來不及跑完」變成明確可見的回報。
// ────────────────────────────────────────────────

/**
 * 以固定併發數處理陣列（worker pool）。
 * 保證回傳順序與輸入順序一致。
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const size = Math.max(1, Math.min(limit, items.length));
  const results = new Array<R>(items.length);
  let cursor = 0;

  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  };

  await Promise.all(Array.from({ length: size }, worker));
  return results;
}

/** 時間預算：讓排程在被平台砍斷前主動收尾並如實回報 */
export function createDeadline(budgetMs: number) {
  const start = Date.now();
  return {
    /** 是否已超出預算 */
    get expired() {
      return Date.now() - start >= budgetMs;
    },
    get elapsedMs() {
      return Date.now() - start;
    },
  };
}
