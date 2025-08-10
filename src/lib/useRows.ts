// src/lib/useRows.ts
'use client';

import { useEffect, useState } from 'react';
import type { Row } from '@/lib/types';
import { htmlToCsvUrl, parseCSV } from '@/lib/sheets';
import { GOOGLE_SHEET_PUB_HTML } from '@/config';

export function useRows() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const cache = localStorage.getItem('rowsCache_v1');
      if (cache) {
        const parsed = JSON.parse(cache) as Row[];
        if (parsed?.length) {
          setRows(parsed);
          setLoading(false);
        }
      }
    } catch {}

    const url = htmlToCsvUrl(GOOGLE_SHEET_PUB_HTML);
    setLoading(true);
    fetch(url)
      .then(r => r.text())
      .then(text => {
        const table = parseCSV(text);
        if (!table.length) return;
        const headers = table[0].map(h => h.toLowerCase().trim());
        const find = (name: string) => headers.findIndex(h => h.includes(name));

        const iSet  = [find('set'), find('titel'), find('name')].find(i => (i ?? -1) >= 0) ?? -1;
        const iTier = [find('rating'), find('tier'), find('level')].find(i => (i ?? -1) >= 0) ?? -1;
        const iClass = [find('classific'), find('genre')].find(i => (i ?? -1) >= 0) ?? -1;
        const iEnergy = find('energie');
        const iSc = find('soundcloud');
        const iYt = find('youtube');

        const parsed: Row[] = [];
        for (let r = 1; r < table.length; r++) {
          const row = table[r];
          const set = iSet >= 0 ? (row[iSet] || '').trim() : '';
          if (!set) continue;
          parsed.push({
            set,
            tier: iTier >= 0 ? row[iTier]?.trim() || null : null,
            classification: iClass >= 0 ? row[iClass]?.trim() || null : null,
            energie: iEnergy >= 0 ? row[iEnergy]?.trim() || null : null,
            soundcloud: iSc >= 0 ? row[iSc]?.trim() || null : null,
            youtube: iYt >= 0 ? row[iYt]?.trim() || null : null,
          });
        }
        if (parsed.length) {
          setRows(parsed);
          try { localStorage.setItem('rowsCache_v1', JSON.stringify(parsed)); } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { rows, loading };
}
