'use client';

import React, { forwardRef, useMemo } from 'react';
import {
  ComputedHeatmapLayout,
  computeHeatmapLayout,
  EXPORT_HEADER_HEIGHT,
  EXPORT_LEGEND_HEIGHT,
  EXPORT_OUTER_PADDING,
  EXPORT_STAGE_GUTTER,
  EXPORT_STAGE_WIDTH,
  EXPORT_TIME_RAIL_WIDTH,
  formatHeatmapHour,
  getHeatmapExportSize,
} from '@/lib/heatmapLayout';
import { COLORS, Row } from '@/lib/heatmaps';

type HeatmapExportRendererProps = {
  title: string;
  date: string;
  rows: Row[];
  pxPerMin: number;
};

function ExportGrid({ layout, pxPerMin }: { layout: ComputedHeatmapLayout; pxPerMin: number }) {
  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white overflow-hidden">
      <div
        className="grid border-b border-neutral-200"
        style={{
          gridTemplateColumns: `${EXPORT_TIME_RAIL_WIDTH}px repeat(${layout.stages.length}, ${EXPORT_STAGE_WIDTH}px)`,
          columnGap: EXPORT_STAGE_GUTTER,
          height: EXPORT_HEADER_HEIGHT,
          paddingRight: EXPORT_OUTER_PADDING / 2,
        }}
      >
        <div />
        {layout.stages.map((stage) => (
          <div
            key={stage}
            className="flex items-center justify-center text-center text-lg font-black uppercase tracking-tight text-neutral-900"
          >
            {stage}
          </div>
        ))}
      </div>

      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `${EXPORT_TIME_RAIL_WIDTH}px repeat(${layout.stages.length}, ${EXPORT_STAGE_WIDTH}px)`,
          columnGap: EXPORT_STAGE_GUTTER,
          padding: `12px ${EXPORT_OUTER_PADDING / 2}px 20px 0`,
        }}
      >
        <div className="relative" style={{ height: layout.heightPx }}>
          {layout.hours.map((hour) => (
            <React.Fragment key={`export-hour-${hour}`}>
              <div
                className="absolute right-0 h-px bg-neutral-300"
                style={{ top: (hour - layout.minStart) * pxPerMin, width: 16 }}
              />
              <div
                className="absolute -translate-y-3 text-[22px] font-black tabular-nums text-neutral-900"
                style={{ top: (hour - layout.minStart) * pxPerMin, left: 10 }}
              >
                {formatHeatmapHour(hour)}
              </div>
            </React.Fragment>
          ))}
        </div>

        {layout.stageLayouts.map((stageLayout) => (
          <div key={stageLayout.stage} className="relative" style={{ height: layout.heightPx }}>
            {layout.hours.map((hour) => (
              <div
                key={`${stageLayout.stage}-line-${hour}`}
                className="absolute inset-x-0 border-t border-dashed border-neutral-400/80"
                style={{ top: (hour - layout.minStart) * pxPerMin }}
              />
            ))}

            {stageLayout.placements.map((placement) => (
              <div
                key={`${stageLayout.stage}-${placement.row.artist}-${placement.row.start}-${placement.row.end}`}
                className="absolute"
                style={{
                  top: placement.top,
                  left: placement.leftPx,
                  width: placement.widthPx,
                  height: placement.innerHeight,
                }}
              >
                <div
                  className="flex h-full items-center justify-center overflow-hidden rounded-[12px] border border-white px-2 text-center shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                  style={{
                    backgroundColor: placement.backgroundColor,
                    color: placement.textColor,
                  }}
                >
                  <div className="w-full truncate text-[20px] font-black leading-[1.1] tracking-tight">
                    {placement.row.artist}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export const HeatmapExportRenderer = forwardRef<HTMLDivElement, HeatmapExportRendererProps>(
  function HeatmapExportRenderer({ title, date, rows, pxPerMin }, ref) {
    const layout = useMemo(
      () => computeHeatmapLayout(rows, pxPerMin),
      [rows, pxPerMin],
    );
    const size = useMemo(() => getHeatmapExportSize(layout), [layout]);

    return (
      <div
        ref={ref}
        data-testid="heatmap-export-surface"
        className="bg-white text-neutral-900"
        style={{
          width: size.width,
          minHeight: size.height,
          padding: EXPORT_OUTER_PADDING,
        }}
      >
        <div className="mb-8">
          <h1 className="text-[56px] font-black tracking-tight leading-[0.92] text-neutral-900">
            {title}
          </h1>
          <p className="mt-3 text-[20px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            {date}
          </p>
        </div>

        <div
          className="mb-6 flex flex-wrap items-center gap-3"
          style={{ minHeight: EXPORT_LEGEND_HEIGHT }}
        >
          {(['nahh', 'ok', 'hot', 'blazing'] as const).map((level) => (
            <div
              key={level}
              className="inline-flex items-center rounded-full px-6 py-2 text-[16px] font-black uppercase tracking-[0.2em] text-white"
              style={{ backgroundColor: COLORS[level] }}
            >
              {level}
            </div>
          ))}
        </div>

        <ExportGrid layout={layout} pxPerMin={pxPerMin} />
      </div>
    );
  },
);
