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

/** Trim, lowercase, and strip BOM if present. */
const norm = (s: string) => (s || "").replace(/^\uFEFF/, "").trim();
const lower = (s: string) => norm(s).toLowerCase();
/** Aggressive header normalization: lowercase, remove BOM, collapse non-alphanumerics */
const normHeader = (s: string) => lower(s).replace(/[^a-z0-9]+/g, " ").trim();

/** Find a header index by any of the provided normalized names. */
const idx = (hdrs: string[], names: string[]) => {
  const H = hdrs.map(normHeader);
  const targets = names.map(normHeader);
  for (const n of targets) {
    const i = H.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
};
const pick = (cells: string[], i: number) => (i >= 0 ? norm(cells[i] || "") : "");

/** Detect delimiter by scanning the first non-empty logical line, ignoring quoted text. */
function sniffDelimiter(t: string): "," | ";" | "\t" {
  let i = 0;
  while (i < t.length && (t[i] === "\n" || t[i] === "\r")) i++;
  // Look at the first 2 non-empty lines to be safer
  const lines: string[] = [];
  let line = "";
  let q = false;
  for (; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"' && t[i + 1] === '"') { i++; line += '"'; }
      else if (ch === '"') q = false;
      else line += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === "\n" || ch === "\r") {
        if (line.trim()) lines.push(line);
        line = "";
        if (lines.length >= 2) break;
      } else {
        line += ch;
      }
    }
  }
  if (line.trim() && lines.length < 2) lines.push(line);

  const targets: Array<"," | ";" | "\t"> = [",", ";", "\t"];
  const score = (s: string, d: string) => {
    // count delimiters not inside quotes (we already removed quoted context)
    return (s.match(new RegExp(`\\${d}`, "g")) || []).length;
  };

  // Pick the delimiter with the highest consistent count across sampled lines
  let best: "," | ";" | "\t" = ",";
  let bestSum = -1;
  for (const d of targets) {
    const total = lines.reduce((acc, ln) => acc + score(ln, d), 0);
    if (total > bestSum) {
      bestSum = total;
      best = d;
    }
  }
  return best;
}

/** CSV/TSV parser with auto delimiter, double-quote escaping, CRLF handling, and BOM removal. */
function parseCSV(t: string) {
  if (!t) return [] as string[][];
  // strip BOM if present
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);

  const delim = sniffDelimiter(t);
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;

  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    const nx = t[i + 1];

    if (q) {
      if (ch === '"' && nx === '"') { cell += '"'; i++; }
      else if (ch === '"') { q = false; }
      else { cell += ch; }
      continue;
    }

    if (ch === '"') { q = true; continue; }
    if (ch === delim) { row.push(cell); cell = ""; continue; }
    if (ch === "\n") { row.push(cell); out.push(row); row = []; cell = ""; continue; }
    if (ch === "\r") { continue; }

    cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); out.push(row); }

  // drop fully empty rows
  return out.filter(r => r.some(x => norm(x).length));
}

// fetch one tab
async function fetchTab(url: string) {
  const res = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    headers: { accept: "text/csv,*/*" },
  });
  if (!res.ok) throw new Error(`fetch failed ${res.status}`);
  let text = await res.text();
  // defensive BOM strip (again)
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const mat = parseCSV(text);
  if (!mat.length) return { headers: [] as string[], rows: [] as string[][] };

  // first non-empty row is the header
  const headers = mat[0].map(s => norm(s));
  const body = mat.slice(1);
  return { headers, rows: body };
}

// map "list" to your current Row shape so UI does not change
function map_list(headers: string[], body: string[][]): ListRow[] {
  const iSet  = idx(headers, ["set", "dj set", "mix", "title", "titel", "naam"]);
  const iGen  = idx(headers, ["classification", "genre", "label", "stijl", "genre label"]);
  const iSc   = idx(headers, ["soundcloud", "sc", "soundcloud url", "soundcloud link", "soundcloud_link"]);
  const iYt   = idx(headers, ["youtube", "yt", "youtube url", "youtube link", "youtube_link"]);
  const iTier = idx(headers, ["tier", "rating", "rank", "grade", "s", "score"]);

  return body.map(cells => {
    const set = pick(cells, iSet);
    if (!set) return null;
    const classification = pick(cells, iGen) || null;
    const soundcloud = pick(cells, iSc) || null;
    const youtube = pick(cells, iYt) || null;
    const tier = pick(cells, iTier) || null;

    return { set, classification, soundcloud, youtube, tier };
  }).filter((r): r is ListRow => Boolean(r));
}

// map "genres" dim table to { label, explanation }
function map_genres(headers: string[], body: string[][]): GenreRow[] {
  const iLbl = idx(headers, ["label", "genre", "classification", "naam", "code"]);
  const iExp = idx(headers, ["explanation", "description", "beschrijving", "omschrijving", "uitleg", "notes", "note"]);
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

// row interfaces used by the typed cache and mappers
type ListRow = {
  set: string;
  classification: string | null;
  soundcloud: string | null;
  youtube: string | null;
  tier: string | null;
};

type GenreRow = {
  label: string;
  explanation: string;
};

// typed cache
type SheetsData = { list?: ListRow[]; genres?: GenreRow[] } & Record<string, unknown>;
type SheetsPayload = { ok: true; updatedAt: string; data: SheetsData };
type CacheVal = { ts: number; payload: SheetsPayload };

const TTL = 5 * 60 * 1000;

declare global {
  var __sheetCache: Map<string, CacheVal> | undefined;
}
globalThis.__sheetCache = globalThis.__sheetCache ?? new Map<string, CacheVal>();

const getCache = (k: string) => {
  const v = globalThis.__sheetCache!.get(k);
  return v && Date.now() - v.ts < TTL ? v.payload : null;
};
const setCache = (k: string, payload: SheetsPayload) =>
  globalThis.__sheetCache!.set(k, { ts: Date.now(), payload });


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
      let data: ListRow[] | GenreRow[] | Record<string, string>[];
      if (t.map === "list") data = map_list(headers, rows);
      else if (t.map === "genres") data = map_genres(headers, rows);
      else data = map_raw(headers, rows);
      return [t.key, data] as const;
    }));

    const payload: SheetsPayload = {
      ok: true,
      updatedAt: new Date().toISOString(),
      data: Object.fromEntries(entries) as SheetsData,
    };

    setCache(cacheKey, payload);
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
