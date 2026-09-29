import { describe, it, expect, vi } from "vitest";
import {
  buildImageToVideoBody,
  createImageToVideoTask,
  parseCreateResponse,
  parseQueryResponse,
  VideoProviderError,
} from "./lk888-video";

describe("buildImageToVideoBody", () => {
  it("首尾幀模式、照片當首幀、10 秒 768P、比例跟著照片", () => {
    const body = buildImageToVideoBody({
      model: "minimax-h3",
      imageUrl: "https://x.supabase.co/storage/v1/object/public/travel-videos/u/v/photo.jpg",
      prompt: "讓照片動起來",
    });
    expect(body).toEqual({
      model: "minimax-h3",
      prompt: "讓照片動起來",
      params: {
        mode: "shouweizhen",
        images: ["https://x.supabase.co/storage/v1/object/public/travel-videos/u/v/photo.jpg"],
        duration: "10",
        resolution: "768P",
        aspect_ratio: "adaptive",
      },
    });
  });
});

describe("buildImageToVideoBody notify_url", () => {
  it("有回呼網址時放在頂層，沒有就不帶", () => {
    const base = { model: "minimax-h3", imageUrl: "https://a/b.jpg", prompt: "p" };
    expect(buildImageToVideoBody({ ...base, notifyUrl: "https://nuan55.com/api/webhooks/lk888/x" })).toMatchObject({
      notify_url: "https://nuan55.com/api/webhooks/lk888/x",
    });
    expect(buildImageToVideoBody({ ...base, notifyUrl: null })).not.toHaveProperty("notify_url");
    expect(buildImageToVideoBody(base)).not.toHaveProperty("notify_url");
  });
});

describe("parseCreateResponse", () => {
  it("body.code=200 才算成功，task_id 是數字要轉字串", () => {
    expect(parseCreateResponse(200, { code: 200, data: { task_id: 12345 }, msg: "任务创建成功" })).toBe("12345");
  });

  it("HTTP 200 但 body.code 不是 200 也是失敗（例：402 餘額不足）", () => {
    try {
      parseCreateResponse(200, { code: 402, msg: "余额不足", data: null });
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(VideoProviderError);
      expect((e as VideoProviderError).httpStatus).toBe(402);
      expect((e as VideoProviderError).message).toContain("余额不足");
    }
  });

  it("code=500 時帶出 data.失败原因", () => {
    try {
      parseCreateResponse(200, { code: 500, msg: "失败", data: { 失败原因: "API Key 额度不足" } });
      expect.fail("should throw");
    } catch (e) {
      expect((e as VideoProviderError).httpStatus).toBe(500);
      expect((e as VideoProviderError).message).toContain("API Key 额度不足");
    }
  });

  it("HTTP 錯誤（鑑權失敗）帶出錯誤類型", () => {
    try {
      parseCreateResponse(401, {
        error: { code: "missing_api_key", message: "缺少 API key", type: "authentication_error" },
      });
      expect.fail("should throw");
    } catch (e) {
      expect((e as VideoProviderError).httpStatus).toBe(401);
      expect((e as VideoProviderError).code).toBe("authentication_error");
    }
  });

  it("成功但沒有 task_id 也算錯", () => {
    expect(() => parseCreateResponse(200, { code: 200, data: {} })).toThrow(VideoProviderError);
    expect(() => parseCreateResponse(200, null)).toThrow(VideoProviderError);
  });
});

describe("parseQueryResponse", () => {
  it("pending → queued、running → running", () => {
    expect(parseQueryResponse(200, { state: "pending", is_final: false, error: null }).status).toBe("queued");
    expect(parseQueryResponse(200, { state: "running", is_final: false, error: null, progress: "45" }).status).toBe("running");
  });

  it("成功時優先取 result_urls[0]，並帶出平台扣費", () => {
    const r = parseQueryResponse(200, {
      state: "success",
      is_final: true,
      error: null,
      cost: 1.5,
      result_url: "https://cdn.example.com/video/abc.mp4",
      result_urls: ["https://cdn.example.com/video/abc.mp4"],
      result_type: "video",
    });
    expect(r).toEqual({
      status: "succeeded",
      videoUrl: "https://cdn.example.com/video/abc.mp4",
      errorMessage: null,
      platformCost: 1.5,
    });
  });

  it("success 但轉存還沒好（result_url 空）→ 繼續等", () => {
    const r = parseQueryResponse(200, { state: "success", is_final: true, result_url: "", result_urls: [] });
    expect(r.status).toBe("running");
  });

  it("failed 帶出錯誤原因（平台會自動退款）", () => {
    const r = parseQueryResponse(200, { state: "failed", is_final: true, error: "内容安全拦截" });
    expect(r.status).toBe("failed");
    expect(r.errorMessage).toBe("内容安全拦截");
  });

  it("未知狀態但已終態 → 當失敗", () => {
    expect(parseQueryResponse(200, { state: "cancelled", is_final: true, error: null }).status).toBe("failed");
  });

  it("回應格式不對或 HTTP 錯誤就丟錯", () => {
    expect(() => parseQueryResponse(200, {})).toThrow(VideoProviderError);
    expect(() =>
      parseQueryResponse(404, { error: { message: "任务不存在", type: "not_found" } })
    ).toThrow(VideoProviderError);
  });
});

describe("createImageToVideoTask（攔截 fetch）", () => {
  it("POST /v1/media/generate，Bearer 鑑權，回傳字串 task_id", async () => {
    vi.stubEnv("LK888_API_KEY", "sk-test-lk888");
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ code: 200, data: { task_id: 987 }, msg: "任务创建成功" }), { status: 200 });
    });
    try {
      const res = await createImageToVideoTask({
        imageUrl: "https://a/b.jpg",
        prompt: "p",
        notifyUrl: "https://nuan55.com/api/webhooks/lk888/secret",
      });
      expect(res).toEqual({ taskId: "987", model: "minimax-h3" });
      expect(calls[0].url).toBe("https://api.lk888.ai/v1/media/generate");
      expect(new Headers(calls[0].init.headers).get("authorization")).toBe("Bearer sk-test-lk888");
      const body = JSON.parse(String(calls[0].init.body));
      expect(body.notify_url).toBe("https://nuan55.com/api/webhooks/lk888/secret");
      expect(body.params.images).toEqual(["https://a/b.jpg"]);
    } finally {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    }
  });
});

describe("createImageToVideoTask 逾時", () => {
  it("逾時要標成 timeout（平台可能已扣費，呼叫端不能當作沒建成功）", async () => {
    vi.stubEnv("LK888_API_KEY", "sk-test-lk888");
    vi.stubGlobal("fetch", async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    });
    try {
      await expect(createImageToVideoTask({ imageUrl: "https://a/b.jpg", prompt: "p" })).rejects.toMatchObject({
        name: "VideoProviderError",
        code: "timeout",
      });
    } finally {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    }
  });

  it("其他連線錯誤照原樣拋出", async () => {
    vi.stubEnv("LK888_API_KEY", "sk-test-lk888");
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed");
    });
    try {
      await expect(createImageToVideoTask({ imageUrl: "https://a/b.jpg", prompt: "p" })).rejects.toThrow("fetch failed");
    } finally {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    }
  });
});
