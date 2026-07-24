// ────────────────────────────────────────────────
// 陪伴機器人 — 文字轉語音（裝置 token 認證）
//
// POST { text } → 回 audio/wav（提醒播報用：heartbeat 給文字，這裡換語音）
// 控費：一次最多 200 字，計入 ai_usage（TTS 按字元數計價）
// ────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { requireDevice, touchDevice } from "@/lib/device-guard";
import { getVoiceProvider } from "@/lib/ai/voice-provider";
import { trackAiUsage } from "@/lib/ai/usage-tracker";
import { z } from "zod";

export const maxDuration = 30;

const PostSchema = z.object({
  text: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const device = await requireDevice(req);
  if (!device) return NextResponse.json({ error: "裝置未授權" }, { status: 401 });
  void touchDevice(device.deviceId);

  let body;
  try {
    body = PostSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "text 必填（最多 200 字）" }, { status: 400 });
  }

  try {
    const provider = getVoiceProvider();
    const tts = await provider.synthesize(body.text);
    await trackAiUsage({
      userId: device.userId,
      service: "openai_realtime",
      model: tts.model,
      outputTokens: body.text.length,
      endpoint: "/api/device/speak",
      metadata: { source: "device", device_id: device.deviceId, kind: "tts", provider: provider.name },
    });

    return new NextResponse(new Uint8Array(tts.audio), {
      status: 200,
      headers: {
        "Content-Type": tts.mimeType,
        "Content-Length": String(tts.audio.length),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[device/speak] failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
