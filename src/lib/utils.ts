'use client';
export const lc = (x?: string|null) => (x || '').toLowerCase();
export const copyToClipboard = async (text: string) => { try { await navigator.clipboard.writeText(text); } catch {} };
export const ytid = (url?: string|null) => { if(!url) return null; const u=url.trim();
  const m = u.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{6,})/) || u.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null; };
