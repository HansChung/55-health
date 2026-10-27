// 名片「存到手機通訊錄」：下載 .vcf（只有公開的聯絡方式）
import { NextRequest, NextResponse } from "next/server";
import { loadPublicCard } from "@/lib/business-card-server";
import { buildVCard, cardSharePath } from "@/lib/business-card";
import { publicAppOrigin } from "@/lib/study-tours";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await loadPublicCard(slug);
  if (!card) return NextResponse.json({ error: "名片不存在" }, { status: 404 });
  const url = `${publicAppOrigin(process.env.NEXT_PUBLIC_APP_URL, req.nextUrl.origin)}${cardSharePath(slug)}`;
  const name = (card.display_name || card.nickname || "暖暖名片").replace(/[\\/:*?"<>|]/g, "");
  return new NextResponse(buildVCard(card, url), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="card.vcf"; filename*=UTF-8''${encodeURIComponent(name)}.vcf`,
      "Cache-Control": "no-store",
    },
  });
}
