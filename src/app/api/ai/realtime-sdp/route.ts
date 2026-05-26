import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Proxy OpenAI Realtime WebRTC SDP exchange
 * 因為 OpenAI 不開放瀏覽器 CORS，由伺服器代轉
 *
 * Body: 原始 SDP offer 字串（Content-Type: application/sdp）
 * Header: x-ephemeral-key（client_secret.value）
 * Header: x-model（model 名稱）
 * Returns: SDP answer（application/sdp）
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("未登入", { status: 401 });
  }

  const ephemeralKey = req.headers.get("x-ephemeral-key");
  const model = req.headers.get("x-model") || "gpt-realtime";
  if (!ephemeralKey) {
    return new NextResponse("缺少 x-ephemeral-key header", { status: 400 });
  }

  const offerSdp = await req.text();
  if (!offerSdp) {
    return new NextResponse("缺少 SDP body", { status: 400 });
  }

  // 試兩個端點
  const endpoints = [
    `https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(model)}`,
    `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
  ];

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        body: offerSdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });
      if (resp.ok) {
        const sdpAnswer = await resp.text();
        return new NextResponse(sdpAnswer, {
          status: 200,
          headers: { "Content-Type": "application/sdp" },
        });
      }
      const errBody = await resp.text();
      console.warn(`[realtime-sdp] ${url} → ${resp.status}: ${errBody.substring(0, 200)}`);
    } catch (e) {
      console.warn(`[realtime-sdp] ${url} threw:`, e);
    }
  }

  return new NextResponse("所有 OpenAI Realtime endpoints 都失敗", { status: 502 });
}
