// app/api/sheets/route.ts
import { NextResponse } from "next/server";

// register tabs: use your two CSV links
const TABS = [
  {
    key: "list",
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRexqa-1vfj-JdFSSFUjWycho-00d5rLdS76eBgvCbruyvtcVIIom-VM52SvfuhLg-CeHLRp2I6k5B2/pub?gid=950522831&single=true&output=csv",
    map: "list" as const,
  },
  {
    key: "genres", // dimension table with labels + explanations
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRexqa-1vfj-JdFSSFUjWycho-00d5rLdS76eBgvCbruyvtcVIIom-VM52SvfuhLg-CeHLRp2I6k5B2/pub?gid=1479050239&single=true&output=csv",
    map: "genres" as const,
  },
];

export const dynamic = "force-dynamic";

// tiny csv parser
function parseCSV(t: string) {
  const out: string[][] = []; let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i], nx = t[i + 1];
    if (q) { if (ch === '"' && nx === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else { if (ch === '"') q = true; else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n") { row.push(cell); out.push(row); row = []; cell = ""; }
      else if (ch !== "\r") cell += ch; }
  }
  if (cell.length || row.length) { row.push(cell); out.push(row); }
  return out.filter(r => r.some(x => (x || "").trim().length));
}

// helpers
const norm = (s: string) => (s || "").trim();
const lower = (s: string) => norm(s).toLowerCase();
const idx = (hdrs: string[], names: string[]) => {
  const H = hdrs.map(h => lower(h));
  for (const n of names) { const i = H.indexOf(n); if (i >= 0) return i; }
  return -1;
};
const pick = (cells: string[], i: number) => (i >= 0 ? norm(cells[i] || "") : "");

// fetch one tab
async function fetchTab(url: string) {
  const res = await fetch(url, { redirect: "follow", cache: "no-store", headers: { accept: "text/csv,*/*" } });
  if (!res.ok) throw new Error(`fetch failed ${res.status}`);
  const text = await res.text();
  const mat = parseCSV(text);
  if (!mat.length) return { headers: [], rows: [] as string[][] };

  // google export often has an empty spacer row between title and headers
  const headers = mat[0];
  const body = mat.slice(1);
  return { headers, rows: body };
}

// map "list" to your current Row shape so UI does not change
function map_list(headers: string[], body: string[][]) {
  const iSet  = idx(headers, ["set","dj set","mix","title","titel","naam"]);
  const iGen  = idx(headers, ["classification","genre","label","stijl","genre label"]);
  const iSc   = idx(headers, ["soundcloud","sc","soundcloud url","soundcloud_link"]);
  const iYt   = idx(headers, ["youtube","yt","youtube url","youtube_link"]);
  const iTier = idx(headers, ["tier","rating","s","score"]);

  return body.map(cells => {
    const set = pick(cells, iSet); if (!set) return null;
    return {
      set, // keep property name "set" for compatibility
      classification: pick(cells, iGen) || null,
      soundcloud: pick(cells, iSc) || null,
      youtube: pick(cells, iYt) || null,
      tier: pick(cells, iTier) || null,
    };
  }).filter(Boolean);
}

// map "genres" dim table to { label, explanation }
function map_genres(headers: string[], body: string[][]) {
  const iLbl = idx(headers, ["label","genre","classification","naam","code"]);
  const iExp = idx(headers, ["explanation","description","beschrijving","omschrijving","uitleg","notes"]);
  return body.map(cells => ({
    label: pick(cells, iLbl),
    explanation: pick(cells, iExp),
  })).filter(r => r.label);
}

// generic object map if you ever add more dims
function map_raw(headers: string[], body: string[][]) {
  const keys = headers.map(norm);
  return body.map(cells => Object.fromEntries(keys.map((k, i) => [k, norm(cells[i] || "")])));
}

// cache
type CacheVal = { ts: number; payload: any };
const TTL = 5 * 60 * 1000;
const g = globalThis as any; g.__sheetCache ||= new Map<string, CacheVal>();
const getCache = (k: string) => { const v = g.__sheetCache.get(k) as CacheVal | undefined; return v && Date.now() - v.ts < TTL ? v.payload : null; };
const setCache = (k: string, payload: any) => g.__sheetCache.set(k, { ts: Date.now(), payload });

// GET /api/sheets?tabs=list,genres
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const only = (url.searchParams.get("tabs") || "").split(",").map(s => s.trim()).filter(Boolean);
    const wanted = only.length ? TABS.filter(t => only.includes(t.key)) : TABS;

    const cacheKey = `tabs:${wanted.map(t => t.key).sort().join(",")}`;
    const cached = getCache(cacheKey);
    if (cached) return NextResponse.json(cached, { headers: { "Cache-Control": "no-store" } });

    const entries = await Promise.all(wanted.map(async t => {
      const { headers, rows } = await fetchTab(t.url);
      let data: any[];
      if (t.map === "list") data = map_list(headers, rows);
      else if (t.map === "genres") data = map_genres(headers, rows);
      else data = map_raw(headers, rows);
      return [t.key, data] as const;
    }));

    const payload = { ok: true, updatedAt: new Date().toISOString(), data: Object.fromEntries(entries) };
    setCache(cacheKey, payload);
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
