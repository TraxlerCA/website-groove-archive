'use client';
import { useState } from "react";
import type { Row } from "@/lib/types";
import { ytid } from "@/lib/utils";
import { PlayIcon, SCIcon } from "@/components/icons";

export default function Thumb({ row }: { row: Row }) {
  const id=ytid(row.youtube||undefined); const [loaded,setLoaded]=useState(false);
  if(id){const src=`https://img.youtube.com/vi/${id}/hqdefault.jpg`; return (<div className="relative w-full aspect-video overflow-hidden"><img src={src} alt={row.set} loading="lazy" onLoad={()=>setLoaded(true)} className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${loaded?"blur-0":"blur-md"}`}/><div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-80"/><div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-[var(--sodium)]/20 border border-[var(--sodium)]/60 grid place-items-center backdrop-blur-sm group-hover:shadow-[0_0_22px_rgba(183,255,46,0.3)] transition"><PlayIcon/></div></div></div>);}
  return (<div className="relative w-full aspect-video bg-gradient-to-br from-orange-600/40 to-fuchsia-600/30 grid place-items-center overflow-hidden"><div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{backgroundImage:"radial-gradient(ellipse at center, transparent 50%, black 100%)"}}/><SCIcon className="w-12 h-12 opacity-80"/></div>);
}
