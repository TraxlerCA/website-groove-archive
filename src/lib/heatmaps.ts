import type { ParseResult } from 'papaparse';

export type Rating = 'nahh' | 'ok' | 'hot' | 'blazing' | '';

export type Row = {
  festival: string;  // full title to show
  date: string;      // YYYY-MM-DD
  stage: string;
  stage_order?: string | number;
  artist: string;
  start: string;     // HH:MM
  end: string;       // HH:MM
  rating?: string | null;
};

export type Group = { title: string; date: string; rows: Row[]; key: string };

export const COLORS = {
  unrated: '#E7E5E4',
  nahh:    '#8AA3FF',
  ok:      '#FEF0B8',
  hot:     '#FF9D2E',
  blazing: '#E7180B',
};

// rails and ticks
export const TIME_W = 100;         // width of the left time rail
export const HEADER_H = 60;         // height of the top stage rail
export const TICK_W = 12;          // horizontal tick length inside time rail
export const LABEL_GAP = 10;       // space between tick end and time label

export const CARD_BORDER = 'border border-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] rounded-md';
// tiny sliver between overlapping boxes
export const SLOT_GAP_PX = 6;

export const norm = (v?: string | null) => (v ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
export const normalizeUtf8 = (v: string) => v.normalize('NFC');

export const toMin = (t: string) => {
  const s = norm(t);
  const [h, m] = s.split(':').map(n => parseInt(n, 10));
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
};

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const parseDate = (d: string) => Date.parse(norm(d));

export const bucketFromRating = (s?: string | null): Rating => {
  const v = norm(s).toLowerCase();
  if (v === 'empty') return '';
  if (v === 'nahh' || v === 'nah' || v === 'blue') return 'nahh';
  if (v === 'ok'   || v === 'yellow') return 'ok';
  if (v === 'hot'  || v === 'orange') return 'hot';
  if (v === 'blazing' || v === 'red') return 'blazing';
  return '';
};

export const slugify = (s: string) => s
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120);

export const DEFAULT_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRexqa-1vfj-JdFSSFUjWycho-00d5rLdS76eBgvCbruyvtcVIIom-VM52SvfuhLg-CeHLRp2I6k5B2/pub?gid=116583245&single=true&output=csv';

// Lazy loaders for heavy libraries
let papaPromise: Promise<typeof import('papaparse')> | null = null;
export async function loadPapa() {
  if (!papaPromise) {
    papaPromise = import('papaparse').then(mod => mod.default || mod);
  }
  return papaPromise;
}

let htmlToImagePromise: Promise<typeof import('html-to-image')> | null = null;
export async function loadHtmlToImage() {
  if (!htmlToImagePromise) {
    htmlToImagePromise = import('html-to-image');
  }
  return htmlToImagePromise;
}
