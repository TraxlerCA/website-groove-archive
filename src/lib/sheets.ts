'use client';
export const htmlToCsvUrl = (pubHtmlUrl: string) => { const base=pubHtmlUrl.replace("/pubhtml","/pub"); return /[?&]output=csv/.test(base)?base:base+(base.includes("?")?"&":"?")+"output=csv"; };

export function parseCSV(text: string): string[][] {
  const rows: string[][]=[]; let cur: string[]=[]; let cell=""; let inQuotes=false;
  for (let i=0;i<text.length;i++){const ch=text[i],next=text[i+1];
    if(inQuotes){if(ch==='"'&&next==='"'){cell+='"';i++;}else if(ch==='"'){inQuotes=false;}else{cell+=ch;}}
    else{if(ch==='"'){inQuotes=true;}else if(ch===","){cur.push(cell);cell="";}else if(ch==="\n"){cur.push(cell);rows.push(cur);cur=[];cell="";}else if(ch!=="\r"){cell+=ch;}}}
  if(cell.length||cur.length){cur.push(cell);rows.push(cur);} return rows.filter(r=>r.some(c=>c&&c.trim().length));
}
