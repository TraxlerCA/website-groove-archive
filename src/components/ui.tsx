// src/components/ui.tsx
'use client';
import type { ReactNode } from "react";

export function CTA({label,onClick,variant="primary",big,ariaLabel}:{label:string;onClick?:()=>void;variant?:'primary'|'ghost';big?:boolean;ariaLabel?:string;}) {
  const base="inline-flex items-center justify-center rounded-full transition px-5";
  const map={primary:"bg-[var(--accent)] text-white hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",ghost:"bg-white border border-neutral-200 text-neutral-800 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"} as const;
  return <button aria-label={ariaLabel} onClick={onClick} className={`${base} ${map[variant]} ${big?"h-11 text-[15px]":"h-9 text-sm"}`}>{label}</button>;
}

export function PageTitle({title}:{title:string}) {
  return <h2 className="text-center text-4xl sm:text-5xl font-semibold tracking-wide" style={{fontFamily:"'Space Grotesk',system-ui,sans-serif"}}>{title}</h2>;
}

export function IconButton({title,onClick,ariaLabel,children}:{title:string;onClick?:()=>void;ariaLabel?:string;children:ReactNode;}) {
  return (
    <button title={title} aria-label={ariaLabel||title} onClick={onClick}
      className="w-8 h-8 grid place-items-center rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
      {children}
    </button>
  );
}

export function Pill({active,children,onClick}:{active:boolean;children:ReactNode;onClick:()=>void}) {
  return <button onClick={onClick} className={`h-6 px-3 rounded-full border text-sm ${active?"bg-neutral-900 text-white border-neutral-900":"bg-white border-neutral-300 hover:bg-neutral-50"}`}>{children}</button>;
}

export function Tag({children}:{children:ReactNode}) {
  return <span className="inline-flex items-center h-6 px-2 rounded-full border border-neutral-300 text-[12px] bg-white">{children}</span>;
}

export function Switch({checked,onChange}:{checked:boolean;onChange:()=>void}) {
  return (
    <button role="switch" aria-checked={checked} onClick={onChange}
      className={`relative inline-flex items-center w-11 h-6 rounded-full border transition ${checked?"bg-[var(--accent)] border-[var(--accent)]":"bg-neutral-200 border-neutral-300"}`}>
      <i className={`absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-white transition-transform ${checked?"translate-x-[22px]":""}`}/>
    </button>
  );
}
