// src/components/ui.tsx
'use client';
import type { ReactNode } from "react";
import { motion } from 'framer-motion';

export function PageTitle({title}:{title:string}) {
  return <h2 className="text-center text-4xl sm:text-5xl font-semibold tracking-wide">{title}</h2>;
}

export function IconButton({title,onClick,ariaLabel,children,variant}:{title:string;onClick?:()=>void;ariaLabel?:string;children:ReactNode;variant?:'default'|'inverted';}) {
  const v = variant||'default';
  const base = 'w-12 h-12 sm:w-8 sm:h-8 grid place-items-center rounded-full border focus-visible:outline-none focus-visible:ring-2';
  const cls = v==='inverted'
    ? `${base} border-black bg-black text-white hover:brightness-110 focus-visible:ring-black/40`
    : `${base} border-neutral-300 bg-white hover:bg-neutral-50 focus-visible:ring-black/30`;
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <motion.button title={title} aria-label={ariaLabel||title} onClick={onClick} className={cls}
      {...(prefersReduced ? {} : { whileHover:{ y:-1, scale:1.01 }, whileTap:{ y:0, scale:0.99 } })}
    >
      {children}
    </motion.button>
  );
}

export function Pill({active,children,onClick}:{active:boolean;children:ReactNode;onClick:()=>void}) {
  return <button onClick={onClick} className={`h-7 px-3 rounded-full border text-sm ${active?"bg-neutral-900 text-white border-neutral-900":"bg-white border-neutral-300 hover:bg-neutral-50"}`}>{children}</button>;
}

export function Tag({children}:{children:ReactNode}) {
  return <span className="inline-flex items-center h-6 px-2 rounded-full border border-neutral-300 text-[12px] bg-white">{children}</span>;
}

/* improved spacing and travel */
export function Switch({checked,onChange}:{checked:boolean;onChange:()=>void}) {
  return (
    <button role="switch" aria-checked={checked} onClick={onChange}
      className={`relative inline-flex items-center w-12 h-7 rounded-full border transition
      ${checked?"bg-[var(--accent)] border-[var(--accent)]":"bg-neutral-200 border-neutral-300"} hover:brightness-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30`}>
      <i className={`absolute top-[4px] left-[4px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform
        ${checked?"translate-x-[20px]":""}`}/>
    </button>
  );
}
