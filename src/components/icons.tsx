'use client';
// Small inline icon set with outline style where appropriate
export const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const PlayOutlineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M8 5v14l11-7z" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

export const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 5l7 7h-4v7H9v-7H5z" />
  </svg>
);

export const YouTubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M23.5 6.2s-.2-1.6-.8-2.3c-.7-.8-1.5-.8-1.9-.9C17.8 2.6 12 2.6 12 2.6s-5.8 0-8.7.4c-.4 0-1.2.1-1.9.9C.7 4.6.5 6.2.5 6.2S0 8.1 0 10v1.9c0 1.9.5 3.8.5 3.8s.2 1.6.8 2.3c.7.8 1.7.7 2.2.8 1.6.2 6.5.4 8.5.4s6.9-.1 8.5-.4c.5-.1 1.5 0 2.2-.8.6-.7.8-2.3.8-2.3S24 13.8 24 11.9V10c0-1.9-.5-3.8-.5-3.8zM9.6 14.6V7.9l6.3 3.4-6.3 3.3z" />
  </svg>
);

export const SCIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.7 10.1c-.4 0-.8.1-1.2.2-.6-2.4-2.7-4.2-5.3-4.2-1 0-1.9.3-2.7.7-.3.1-.4.4-.4.7v8c0 .4.3.7.7.7h8.9c2 0 3.7-1.6 3.7-3.7 0-2-1.7-3.4-3.7-3.4zM3.5 8.2c-.4 0-.7.3-.7.7v7c0 .4.3.7.7.7s.7-.3.7-.7v-7c0-.4-.3-.7-.7-.7zm2 1.4c-.4 0-.7.3-.7.7v5.6c0 .4.3.7.7.7s.7-.3.7-.7V10.3c0-.4-.3-.7-.7-.7zm2 1.2c-.4 0-.7.3-.7.7v4.4c0 .4.3.7.7.7s.7-.3.7-.7v-4.4c0-.4-.3-.7-.7-.7z" />
  </svg>
);

export const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const HomeOutlineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 10.5l9-7 9 7V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const ListOutlineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M8 6h13M3 6h1M8 12h13M3 12h1M8 18h13M3 18h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const HeatmapOutlineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const ArtistsOutlineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
    <path
      d="M5 20c0-3.5 3.6-5.5 7-5.5s7 2 7 5.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const PaperPlaneOutlineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M21 3L3 10l8 3 3 8 7-18z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
  </svg>
);

export const CopyIcon = ({ className }: { className?: string }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={className}
  >
    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
