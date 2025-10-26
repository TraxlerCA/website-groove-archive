// app/api/sheets/route.ts
import { NextResponse } from "next/server";
import { getSheets } from "@/lib/sheets.server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const only = (url.searchParams.get("tabs") || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const payload = await getSheets(only.length ? only : undefined);
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
