'use client';

import { useMemo, type KeyboardEvent } from 'react';
import roadsGeoJson from '@/data/amsterdam-roads.json';
import zoneGeoJson from '@/data/amsterdam-ggw-zones.json';
import { getContrastTextColor, type MapZoneConfig, type MapZoneId } from '@/components/home/mapZones';
import {
  MAP_VIEWBOX_HEIGHT,
  MAP_VIEWBOX_WIDTH,
  buildMapData,
  type RoadCollection,
  type ZoneCollection,
} from '@/components/home/mapStageData';

type AmsterdamMapStageProps = {
  zones: MapZoneConfig[];
  activeZoneId: MapZoneId | null;
  hoveredZoneId: MapZoneId | null;
  onSelect: (zoneId: MapZoneId) => void;
  onHover: (zoneId: MapZoneId | null) => void;
  onClearSelection: () => void;
};

const MAP_BACKGROUND = '#f8fafc';
const ROAD_STROKE = 'rgba(15,23,42,0.12)';
const IDLE_STROKE = 'rgba(255,255,255,0.76)';
const HOVER_STROKE = 'rgba(255,255,255,0.98)';
const DIMMED_STROKE = 'rgba(255,255,255,0.56)';

function getMapLabelLines(value: string): string[] {
  const cleaned = value.replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return ['Zone'];
  const words = cleaned.split(' ').filter(word => word !== '&' && word.toLowerCase() !== 'and');
  const limited = words.slice(0, 4);
  if (limited.length <= 2) return [limited.join(' ')];
  const midpoint = Math.ceil(limited.length / 2);
  return [limited.slice(0, midpoint).join(' '), limited.slice(midpoint).join(' ')];
}

function getHoverPillWidth(label: string): number {
  return Math.max(74, Math.min(260, label.length * 6.4 + 24));
}

export default function AmsterdamMapStage({
  zones,
  activeZoneId,
  hoveredZoneId,
  onSelect,
  onHover,
  onClearSelection,
}: AmsterdamMapStageProps) {
  const zoneCollection = zoneGeoJson as ZoneCollection;
  const roadCollection = roadsGeoJson as RoadCollection;

  const zonesById = useMemo(
    () =>
      zones.reduce<Record<MapZoneId, MapZoneConfig>>((acc, zone) => {
        acc[zone.id] = zone;
        return acc;
      }, {} as Record<MapZoneId, MapZoneConfig>),
    [zones],
  );

  const mapData = useMemo(
    () => buildMapData(zoneCollection.features, roadCollection.features),
    [roadCollection.features, zoneCollection.features],
  );

  const activeZone = activeZoneId ? zonesById[activeZoneId] : null;
  const hasActiveSelection = Boolean(activeZoneId);
  const visibleLabelZoneId = hoveredZoneId;

  const handleZoneKeyDown = (event: KeyboardEvent<SVGPathElement>, zoneId: MapZoneId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(zoneId);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onHover(null);
      onClearSelection();
    }
  };

  return (
    <section className="relative h-full">
      <div className="relative h-full overflow-hidden rounded-[1.5rem] border border-neutral-200/90 bg-[#f8fafc] shadow-[0_16px_40px_rgba(15,23,42,0.14)] sm:rounded-[2rem]">
        <svg
          viewBox={`0 0 ${MAP_VIEWBOX_WIDTH} ${MAP_VIEWBOX_HEIGHT}`}
          className="absolute inset-0 h-full w-full"
          aria-label="Amsterdam map with interactive music zones"
          role="img"
          onClick={event => {
            const target = event.target as HTMLElement;
            if (target.dataset.zoneFill === 'true') return;
            onHover(null);
            onClearSelection();
          }}
          onMouseLeave={() => onHover(null)}
          onMouseMove={event => {
            const target = event.target as Element;
            if (target.tagName.toLowerCase() === 'svg') onHover(null);
          }}
        >
          <defs>
            <clipPath id="zone-footprint-clip" clipPathUnits="userSpaceOnUse">
              {mapData.zoneFootprintPaths.map((path, index) => (
                <path key={`zone-footprint-${index}`} d={path} />
              ))}
            </clipPath>
          </defs>

          <rect width={MAP_VIEWBOX_WIDTH} height={MAP_VIEWBOX_HEIGHT} fill={MAP_BACKGROUND} />

          <g aria-hidden="true" clipPath="url(#zone-footprint-clip)">
            {mapData.roadPaths.map((path, index) => (
              <path
                key={`road-${index}`}
                d={path}
                fill="none"
                stroke={ROAD_STROKE}
                strokeWidth={0.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>

          <g>
            {mapData.zoneFeatures.map(feature => {
              const zoneId = feature.zoneId;
              if (!feature.active || !zoneId) return null;
              const zone = zonesById[zoneId];
              if (!zone) return null;
              const fill = zone.accent;

              return (
                <g key={`${feature.code}-interactive`}>
                  <path
                    d={feature.path}
                    aria-hidden="true"
                    onClick={() => onSelect(zoneId)}
                    onMouseEnter={() => onHover(zoneId)}
                    className="cursor-pointer"
                    fill="none"
                    stroke="rgba(0,0,0,0.001)"
                    strokeWidth={10}
                    vectorEffect="non-scaling-stroke"
                    style={{ pointerEvents: 'stroke' }}
                  />
                  <path
                    key={`${feature.code}-fill`}
                    data-zone-fill="true"
                    d={feature.path}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${zone.displayName} zone`}
                    onClick={() => onSelect(zoneId)}
                    onMouseEnter={() => onHover(zoneId)}
                    onFocus={() => onHover(zoneId)}
                    onBlur={() => onHover(null)}
                    onKeyDown={event => handleZoneKeyDown(event, zoneId)}
                    className="cursor-pointer transition focus-visible:outline-none"
                    fill={fill}
                  />
                </g>
              );
            })}
          </g>

          <g aria-hidden="true" className="pointer-events-none">
            {mapData.zoneFeatures.map(feature => {
              if (!feature.active || !feature.zoneId) return null;
              const zone = zonesById[feature.zoneId];
              if (!zone) return null;

              const isActive = feature.zoneId === activeZoneId;
              const isHovered = feature.zoneId === hoveredZoneId;
              const stroke = isActive
                ? HOVER_STROKE
                : hasActiveSelection
                  ? DIMMED_STROKE
                  : isHovered
                    ? HOVER_STROKE
                    : IDLE_STROKE;

              return (
                <path
                  key={`${feature.code}-boundary`}
                  d={feature.path}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isActive ? 1.55 : isHovered && !hasActiveSelection ? 1.25 : 1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>

          <g aria-hidden="true" className="pointer-events-none">
            {zones.map(zone => {
              if (visibleLabelZoneId && zone.id !== visibleLabelZoneId) return null;
              const point = mapData.zoneLabelPoints[zone.id];
              if (!point) return null;
              const labelLines = getMapLabelLines(zone.genreLabel);
              const lineHeight = 16.5;
              const firstLineY = point.y - (lineHeight * (labelLines.length - 1)) / 2;
              return (
                <text
                  key={`${zone.id}-label`}
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  className="map-zone-label"
                >
                  {labelLines.map((line, index) => (
                    <tspan
                      key={`${zone.id}-label-line-${index}`}
                      x={point.x}
                      y={firstLineY + index * lineHeight}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              );
            })}
          </g>

          {hoveredZoneId ? (
            (() => {
              const point = mapData.zoneLabelPoints[hoveredZoneId];
              const zone = zonesById[hoveredZoneId];
              if (!point || !zone) return null;
              const pillWidth = getHoverPillWidth(zone.genreLabel);
              const pillHeight = 22;
              const pillRadius = 11;
              return (
                <g data-hover-pill="true" aria-hidden="true" className="pointer-events-none sm:hidden">
                  <rect
                    x={point.x - pillWidth / 2}
                    y={point.y - pillHeight / 2}
                    width={pillWidth}
                    height={pillHeight}
                    rx={pillRadius}
                    ry={pillRadius}
                    fill={zone.accent}
                    stroke="rgba(255,255,255,0.58)"
                    strokeWidth={0.8}
                  />
                  <text
                    x={point.x}
                    y={point.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={8}
                    letterSpacing="0.02em"
                    fill={getContrastTextColor(zone.accent)}
                    fontWeight={600}
                  >
                    {zone.genreLabel}
                  </text>
                </g>
              );
            })()
          ) : null}

          {activeZoneId && activeZone ? (
            <g aria-hidden="true" className="pointer-events-none">
              {mapData.zoneFeatures
                .filter(feature => feature.active && feature.zoneId === activeZoneId)
                .map(feature => (
                  <path
                    key={`${feature.code}-pulse`}
                    d={feature.path}
                    className="map-zone-pulse"
                    fill="none"
                    stroke={activeZone.accent}
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
            </g>
          ) : null}
        </svg>
      </div>

      <style jsx>{`
        .map-zone-pulse {
          animation: map-zone-pulse 2.2s ease-out infinite;
        }
        .map-zone-label {
          font-family: var(--font-urbanist), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            'Segoe UI', sans-serif;
          font-size: 15.8px;
          letter-spacing: 0.012em;
          fill: rgba(255, 255, 255, 0.97);
          font-weight: 650;
          text-rendering: geometricPrecision;
          filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45));
        }
        @media (max-width: 420px) {
          .map-zone-label {
            font-size: 16.8px;
          }
        }
        svg [data-zone-fill='true']:focus,
        svg [data-zone-fill='true']:focus-visible {
          outline: none !important;
        }
        @keyframes map-zone-pulse {
          0% {
            opacity: 0.8;
            stroke-width: 1.5;
          }
          100% {
            opacity: 0;
            stroke-width: 5;
          }
        }
      `}</style>
    </section>
  );
}
