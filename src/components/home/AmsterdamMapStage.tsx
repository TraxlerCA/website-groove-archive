'use client';

import type { CSSProperties } from 'react';
import type { MapZoneConfig, MapZoneId } from '@/components/home/mapZones';

type AmsterdamMapStageProps = {
  zones: MapZoneConfig[];
  activeZoneId: MapZoneId | null;
  onSelect: (zoneId: MapZoneId) => void;
};

function zoneStyle(zone: MapZoneConfig): CSSProperties {
  return {
    left: `${zone.bounds.x}%`,
    top: `${zone.bounds.y}%`,
    width: `${zone.bounds.w}%`,
    height: `${zone.bounds.h}%`,
    transform: `translate(-50%, -50%) rotate(${zone.bounds.rotate}deg)`,
  };
}

export default function AmsterdamMapStage({
  zones,
  activeZoneId,
  onSelect,
}: AmsterdamMapStageProps) {
  return (
    <section className="relative">
      <div className="relative aspect-[16/10] min-h-[360px] overflow-hidden rounded-[2rem] border border-white/20 bg-[#0b1020] shadow-[0_24px_70px_rgba(2,8,23,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(72,187,255,0.24),transparent_40%),radial-gradient(circle_at_84%_12%,rgba(255,147,83,0.2),transparent_42%),radial-gradient(circle_at_52%_76%,rgba(102,84,255,0.26),transparent_46%),linear-gradient(165deg,#070b16_0%,#0b1020_40%,#070b14_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <svg viewBox="0 0 1200 750" className="h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id="canalStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(106,198,255,0.6)" />
                <stop offset="100%" stopColor="rgba(177,151,255,0.24)" />
              </linearGradient>
            </defs>
            <path
              d="M120 430 C250 210, 520 160, 730 300 C910 420, 1060 380, 1130 270"
              stroke="url(#canalStroke)"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
              opacity="0.55"
            />
            <path
              d="M60 520 C260 390, 440 430, 620 550 C760 640, 980 630, 1160 510"
              stroke="url(#canalStroke)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              opacity="0.35"
            />
            <path
              d="M230 110 C430 210, 400 470, 270 610"
              stroke="rgba(97,182,255,0.45)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M840 120 C760 260, 760 460, 890 620"
              stroke="rgba(255,159,96,0.45)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:62px_62px] opacity-30" />
        <div className="pointer-events-none absolute inset-0 motion-safe:animate-[pulse_8s_ease-in-out_infinite] motion-reduce:animate-none bg-[radial-gradient(circle_at_50%_45%,rgba(137,214,255,0.12),transparent_56%)]" />

        {zones.map(zone => {
          const active = zone.id === activeZoneId;
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.displayName}, ${zone.genreLabel}`}
              onClick={() => onSelect(zone.id)}
              style={zoneStyle(zone)}
              className={[
                'absolute flex items-center justify-center rounded-[1.4rem] border px-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] transition focus-visible:outline-none focus-visible:ring-4',
                'focus-visible:ring-cyan-200/70',
                active
                  ? 'border-white/85 text-white shadow-[0_16px_45px_rgba(15,23,42,0.52)]'
                  : 'border-white/30 bg-white/10 text-white/85 hover:border-white/65 hover:bg-white/16',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute inset-0 rounded-[1.4rem] transition duration-300',
                  active
                    ? 'opacity-85 motion-safe:animate-[pulse_3s_ease-in-out_infinite] motion-reduce:animate-none'
                    : 'opacity-65',
                ].join(' ')}
                style={{
                  background:
                    'radial-gradient(circle at 35% 20%, rgba(255,255,255,0.24), rgba(255,255,255,0.05) 45%, rgba(0,0,0,0.06) 100%)',
                  boxShadow: `0 0 0 1px ${zone.accent}99, 0 0 42px ${zone.accent}55`,
                }}
                aria-hidden="true"
              />
              <span className="relative z-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">{zone.displayName}</span>
            </button>
          );
        })}

        <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[0.62rem] uppercase tracking-[0.24em] text-white/85">
          Amsterdam Afterhours Grid
        </div>
      </div>
    </section>
  );
}
