'use client';

const DEFAULT_FONT_FAMILY = '"Urbanist", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const DEFAULT_FONT_WEIGHT = 800;

export type HeatmapLabelFitOptions = {
  maxWidth: number;
  maxHeight: number;
  baseFontSize: number;
  minFontSize: number;
  lineHeight: number;
  maxLines: number;
  fontFamily?: string;
  fontWeight?: number;
};

export type HeatmapLabelFitResult = {
  lines: string[];
  fontSize: number;
  lineHeightPx: number;
  truncated: boolean;
};

const textMeasureCache = new Map<string, number>();
let measureContext: CanvasRenderingContext2D | null | undefined;

function getMeasureContext() {
  if (measureContext !== undefined) {
    return measureContext;
  }

  if (typeof document === 'undefined') {
    measureContext = null;
    return measureContext;
  }

  const canvas = document.createElement('canvas');
  measureContext = canvas.getContext('2d');
  return measureContext;
}

function normalizeLabel(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function measureTextWidth(text: string, fontSize: number, fontWeight: number, fontFamily: string) {
  const normalized = normalizeLabel(text);
  const cacheKey = `${fontWeight}|${fontSize}|${fontFamily}|${normalized}`;
  const cached = textMeasureCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const context = getMeasureContext();
  let width = 0;

  if (context) {
    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    width = context.measureText(normalized).width;
  } else {
    width = normalized.length * fontSize * 0.62;
  }

  textMeasureCache.set(cacheKey, width);
  return width;
}

function lineHeightPx(fontSize: number, lineHeight: number) {
  return Math.max(1, fontSize * lineHeight);
}

function fitsHeight(lineCount: number, fontSize: number, lineHeight: number, maxHeight: number) {
  return lineCount * lineHeightPx(fontSize, lineHeight) <= maxHeight;
}

function chooseBetterCandidate(
  current: string[] | null,
  candidate: string[],
  fontSize: number,
  maxWidth: number,
  fontWeight: number,
  fontFamily: string,
) {
  if (!current) {
    return candidate;
  }

  const currentWidths = current.map((line) => measureTextWidth(line, fontSize, fontWeight, fontFamily));
  const candidateWidths = candidate.map((line) => measureTextWidth(line, fontSize, fontWeight, fontFamily));
  const currentSpread = Math.max(...currentWidths) - Math.min(...currentWidths);
  const candidateSpread = Math.max(...candidateWidths) - Math.min(...candidateWidths);

  if (candidateSpread !== currentSpread) {
    return candidateSpread < currentSpread ? candidate : current;
  }

  const currentSlack = maxWidth - Math.max(...currentWidths);
  const candidateSlack = maxWidth - Math.max(...candidateWidths);
  return candidateSlack < currentSlack ? candidate : current;
}

function findExactWrappedLines(
  words: string[],
  fontSize: number,
  maxWidth: number,
  maxLines: number,
  fontWeight: number,
  fontFamily: string,
) {
  if (maxLines <= 1 || words.length <= 1) {
    return null;
  }

  let best: string[] | null = null;

  for (let splitIndex = 1; splitIndex < words.length; splitIndex += 1) {
    const lines = [
      words.slice(0, splitIndex).join(' '),
      words.slice(splitIndex).join(' '),
    ];

    const fits = lines.every(
      (line) => measureTextWidth(line, fontSize, fontWeight, fontFamily) <= maxWidth,
    );

    if (!fits) {
      continue;
    }

    best = chooseBetterCandidate(best, lines, fontSize, maxWidth, fontWeight, fontFamily);
  }

  return best;
}

function ellipsizeToWidth(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontWeight: number,
  fontFamily: string,
) {
  const normalized = normalizeLabel(text);
  if (!normalized) {
    return '';
  }

  if (measureTextWidth(normalized, fontSize, fontWeight, fontFamily) <= maxWidth) {
    return normalized;
  }

  const ellipsis = '…';
  if (measureTextWidth(ellipsis, fontSize, fontWeight, fontFamily) > maxWidth) {
    return '';
  }

  let output = normalized;
  while (output.length > 1) {
    output = output.slice(0, -1).trimEnd();
    const candidate = `${output}${ellipsis}`;
    if (measureTextWidth(candidate, fontSize, fontWeight, fontFamily) <= maxWidth) {
      return candidate;
    }
  }

  return ellipsis;
}

function buildTruncatedLines(
  text: string,
  fontSize: number,
  maxWidth: number,
  maxLines: number,
  fontWeight: number,
  fontFamily: string,
) {
  if (maxLines <= 1) {
    return [ellipsizeToWidth(text, maxWidth, fontSize, fontWeight, fontFamily)];
  }

  const words = normalizeLabel(text).split(' ').filter(Boolean);
  if (words.length === 0) {
    return [''];
  }

  const lines: string[] = [];
  let index = 0;

  while (index < words.length && lines.length < maxLines) {
    if (lines.length === maxLines - 1) {
      lines.push(
        ellipsizeToWidth(words.slice(index).join(' '), maxWidth, fontSize, fontWeight, fontFamily),
      );
      return lines;
    }

    let candidate = '';
    let nextIndex = index;
    while (nextIndex < words.length) {
      const nextCandidate = candidate ? `${candidate} ${words[nextIndex]}` : words[nextIndex];
      if (measureTextWidth(nextCandidate, fontSize, fontWeight, fontFamily) > maxWidth) {
        break;
      }
      candidate = nextCandidate;
      nextIndex += 1;
    }

    if (!candidate) {
      lines.push(ellipsizeToWidth(words[index], maxWidth, fontSize, fontWeight, fontFamily));
      index += 1;
      continue;
    }

    lines.push(candidate);
    index = nextIndex;
  }

  return lines;
}

export function fitHeatmapLabel(text: string, options: HeatmapLabelFitOptions): HeatmapLabelFitResult {
  const normalized = normalizeLabel(text);
  const fontFamily = options.fontFamily ?? DEFAULT_FONT_FAMILY;
  const fontWeight = options.fontWeight ?? DEFAULT_FONT_WEIGHT;
  const maxWidth = Math.max(1, options.maxWidth);
  const maxHeight = Math.max(1, options.maxHeight);
  const maxLines = Math.max(1, options.maxLines);
  const maxFont = Math.max(options.baseFontSize, options.minFontSize);
  const minFont = Math.min(options.baseFontSize, options.minFontSize);

  if (!normalized) {
    return {
      lines: [''],
      fontSize: maxFont,
      lineHeightPx: lineHeightPx(maxFont, options.lineHeight),
      truncated: false,
    };
  }

  const words = normalized.split(' ').filter(Boolean);

  for (let fontSize = maxFont; fontSize >= minFont; fontSize -= 1) {
    if (!fitsHeight(1, fontSize, options.lineHeight, maxHeight)) {
      continue;
    }

    const singleLineWidth = measureTextWidth(normalized, fontSize, fontWeight, fontFamily);
    if (singleLineWidth <= maxWidth) {
      return {
        lines: [normalized],
        fontSize,
        lineHeightPx: lineHeightPx(fontSize, options.lineHeight),
        truncated: false,
      };
    }

    if (!fitsHeight(Math.min(maxLines, 2), fontSize, options.lineHeight, maxHeight)) {
      continue;
    }

    const exactLines = findExactWrappedLines(words, fontSize, maxWidth, maxLines, fontWeight, fontFamily);
    if (exactLines) {
      return {
        lines: exactLines,
        fontSize,
        lineHeightPx: lineHeightPx(fontSize, options.lineHeight),
        truncated: false,
      };
    }
  }

  const truncatedLines = buildTruncatedLines(normalized, minFont, maxWidth, maxLines, fontWeight, fontFamily);
  return {
    lines: truncatedLines,
    fontSize: minFont,
    lineHeightPx: lineHeightPx(minFont, options.lineHeight),
    truncated: true,
  };
}
