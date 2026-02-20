#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT_DIR, 'src', 'components', 'home', 'mapContext.ts');

const BBOX = '52.277977,4.754837,52.430679,5.107693';
const [BBOX_MIN_LAT, BBOX_MIN_LON, BBOX_MAX_LAT, BBOX_MAX_LON] = BBOX.split(',').map(Number);
const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const CANAL_NAMES = new Set(['Singel', 'Herengracht', 'Keizersgracht', 'Prinsengracht']);
const MAIN_WATER_NAMES = new Set(['IJ', 'Amstel']);

async function sleep(ms) {
  await new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function postOverpass(query) {
  const body = new URLSearchParams({ data: query });
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text.slice(0, 240)}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await sleep(600 * attempt);
        }
      }
    }
  }

  throw lastError || new Error('Overpass query failed');
}

function roundCoord(value) {
  return Number(value.toFixed(6));
}

function normalizePoint(point) {
  return [roundCoord(point.lon), roundCoord(point.lat)];
}

function keyForPoint(point) {
  return `${roundCoord(point[0])},${roundCoord(point[1])}`;
}

function distance2(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function reverseIfNeeded(points, shouldReverse) {
  return shouldReverse ? [...points].reverse() : points;
}

function isPointInBounds(point) {
  const lon = point[0];
  const lat = point[1];
  return lon >= BBOX_MIN_LON && lon <= BBOX_MAX_LON && lat >= BBOX_MIN_LAT && lat <= BBOX_MAX_LAT;
}

function splitByBounds(points) {
  const segments = [];
  let current = [];

  for (const point of points) {
    if (isPointInBounds(point)) {
      current.push(point);
      continue;
    }

    if (current.length >= 2) {
      segments.push(current);
    }
    current = [];
  }

  if (current.length >= 2) {
    segments.push(current);
  }

  return segments;
}

function cleanLine(points) {
  const deduped = [];
  for (const point of points) {
    const last = deduped[deduped.length - 1];
    if (!last || keyForPoint(last) !== keyForPoint(point)) {
      deduped.push(point);
    }
  }

  const cleaned = [];
  for (const point of deduped) {
    if (cleaned.length >= 2 && keyForPoint(cleaned[cleaned.length - 2]) === keyForPoint(point)) {
      cleaned.pop();
      continue;
    }
    cleaned.push(point);
  }

  return cleaned;
}

function mergeSegments(segments) {
  const remaining = segments
    .map(segment => segment.filter((_, index, arr) => index === 0 || keyForPoint(arr[index - 1]) !== keyForPoint(segment[index])))
    .filter(segment => segment.length >= 2)
    .map(segment => [...segment]);

  const chains = [];
  const tolerance = 0.00000025;

  while (remaining.length > 0) {
    let chain = remaining.pop();
    let changed = true;

    while (changed) {
      changed = false;

      for (let i = 0; i < remaining.length; i += 1) {
        const segment = remaining[i];
        const chainStart = chain[0];
        const chainEnd = chain[chain.length - 1];
        const segmentStart = segment[0];
        const segmentEnd = segment[segment.length - 1];

        if (distance2(chainEnd, segmentStart) <= tolerance) {
          chain = [...chain, ...segment.slice(1)];
        } else if (distance2(chainEnd, segmentEnd) <= tolerance) {
          const reversed = reverseIfNeeded(segment, true);
          chain = [...chain, ...reversed.slice(1)];
        } else if (distance2(chainStart, segmentEnd) <= tolerance) {
          chain = [...segment.slice(0, -1), ...chain];
        } else if (distance2(chainStart, segmentStart) <= tolerance) {
          const reversed = reverseIfNeeded(segment, true);
          chain = [...reversed.slice(0, -1), ...chain];
        } else {
          continue;
        }

        remaining.splice(i, 1);
        changed = true;
        break;
      }
    }

    chains.push(chain);
  }

  return chains;
}

function perpendicularDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return Math.sqrt(distance2(point, start));
  const t = ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy);
  const px = start[0] + t * dx;
  const py = start[1] + t * dy;
  const ddx = point[0] - px;
  const ddy = point[1] - py;
  return Math.sqrt(ddx * ddx + ddy * ddy);
}

function simplifyRdp(points, epsilon) {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i += 1) {
    const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (dist > maxDistance) {
      maxDistance = dist;
      index = i;
    }
  }

  if (maxDistance <= epsilon) {
    return [points[0], points[points.length - 1]];
  }

  const left = simplifyRdp(points.slice(0, index + 1), epsilon);
  const right = simplifyRdp(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

function lineLength(points) {
  let sum = 0;
  for (let i = 1; i < points.length; i += 1) {
    sum += Math.sqrt(distance2(points[i - 1], points[i]));
  }
  return sum;
}

function sanitizeId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function pickLandmarkCandidates(elements) {
  const targets = [
    { id: 'centraal', name: 'Amsterdam Centraal', matcher: tags => tags.name === 'Amsterdam Centraal' },
    { id: 'dam', name: 'Dam', matcher: tags => tags.name === 'Dam' && tags.place === 'square' },
    { id: 'rijksmuseum', name: 'Rijksmuseum', matcher: tags => tags.name === 'Rijksmuseum' },
    { id: 'vondelpark', name: 'Vondelpark', matcher: tags => tags.name === 'Vondelpark' },
    { id: 'ndsm', name: 'NDSM', matcher: tags => /^NDSM(-werf|-plein)?$/i.test(tags.name || '') },
    {
      id: 'arena',
      name: 'Johan Cruijff ArenA',
      matcher: tags => /Johan Cruijff ArenA|Johan Cruijff Arena/i.test(tags.name || ''),
    },
  ];

  const priority = { relation: 3, way: 2, node: 1 };
  const selected = [];

  for (const target of targets) {
    const candidates = elements
      .filter(element => target.matcher(element.tags || {}))
      .map(element => {
        if (typeof element.lat === 'number' && typeof element.lon === 'number') {
          return {
            score: priority[element.type] || 0,
            point: [roundCoord(element.lon), roundCoord(element.lat)],
          };
        }
        if (element.center && typeof element.center.lat === 'number' && typeof element.center.lon === 'number') {
          return {
            score: priority[element.type] || 0,
            point: [roundCoord(element.center.lon), roundCoord(element.center.lat)],
          };
        }
        if (Array.isArray(element.geometry) && element.geometry.length > 0) {
          const mid = element.geometry[Math.floor(element.geometry.length / 2)];
          if (typeof mid.lat === 'number' && typeof mid.lon === 'number') {
            return {
              score: priority[element.type] || 0,
              point: [roundCoord(mid.lon), roundCoord(mid.lat)],
            };
          }
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
      selected.push({
        id: target.id,
        name: target.name,
        point: candidates[0].point,
      });
    }
  }

  return selected;
}

function toTsArray(value, indent = 2) {
  const spacer = ' '.repeat(indent);
  if (!Array.isArray(value)) return '[]';
  const rows = value.map(item => `${spacer}${JSON.stringify(item)}`);
  return `[\n${rows.join(',\n')}\n]`;
}

function toPointRows(points, indent) {
  const spacer = ' '.repeat(indent);
  return points.map(([x, y]) => `${spacer}[${x}, ${y}]`).join(',\n');
}

function buildTs({ waterLines, roadLines, landmarks }) {
  const header = [
    '/*',
    ' * Generated by scripts/generate-map-context.cjs',
    ' * Data source: OpenStreetMap via Overpass API',
    ' */',
    '',
    'export type ContextPoint = [number, number];',
    '',
    'export type ContextLine = {',
    '  id: string;',
    '  label?: string;',
    '  points: ContextPoint[];',
    '};',
    '',
    'export type ContextPolygon = {',
    '  id: string;',
    '  points: ContextPoint[];',
    '};',
    '',
    'export type ContextLandmark = {',
    '  id: string;',
    '  name: string;',
    '  point: ContextPoint;',
    '};',
    '',
    'export const CONTEXT_WATER_AREAS: ContextPolygon[] = [];',
    '',
    'export const CONTEXT_WATER_LINES: ContextLine[] = [',
  ].join('\n');

  const waterEntries = waterLines
    .map(line => {
      const rows = toPointRows(line.points, 6);
      return [
        '  {',
        `    id: '${line.id}',`,
        line.label ? `    label: '${line.label}',` : '',
        '    points: [',
        rows,
        '    ],',
        '  },',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const mid = [
    '];',
    '',
    'export const CONTEXT_ROAD_LINES: ContextLine[] = [',
  ].join('\n');

  const roadEntries = roadLines
    .map(line => {
      const rows = toPointRows(line.points, 6);
      return [
        '  {',
        `    id: '${line.id}',`,
        line.label ? `    label: '${line.label}',` : '',
        '    points: [',
        rows,
        '    ],',
        '  },',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const footer = [
    '];',
    '',
    'export const CONTEXT_LANDMARKS: ContextLandmark[] = [',
    landmarks
      .map(
        landmark =>
          `  { id: '${landmark.id}', name: '${landmark.name}', point: [${landmark.point[0]}, ${landmark.point[1]}] },`,
      )
      .join('\n'),
    '];',
    '',
  ].join('\n');

  return `${header}\n${waterEntries}\n${mid}\n${roadEntries}\n${footer}`;
}

async function main() {
const lineQuery = `[out:json][timeout:80];
(
  way["highway"="motorway"]["ref"~"(^|;)A10($|;)"](${BBOX});
  way["waterway"="river"]["name"="Amstel"](${BBOX});
  way["waterway"="river"]["name"="IJ"](${BBOX});
  way["natural"="water"]["name"~"^(IJ|IJmeer|Nieuwe Meer)$"](${BBOX});
  way["waterway"="canal"]["name"~"^(Singel|Herengracht|Keizersgracht|Prinsengracht)$"](${BBOX});
);
out tags geom;`;

  const landmarkQuery = `[out:json][timeout:50];
(
  nwr["name"="Amsterdam Centraal"](${BBOX});
  nwr["name"="Dam"]["place"="square"](${BBOX});
  nwr["name"="Rijksmuseum"](${BBOX});
  nwr["name"="Vondelpark"](${BBOX});
  nwr["name"~"^(NDSM-werf|NDSM-plein|NDSM)$"](${BBOX});
  nwr["name"~"^(Johan Cruijff ArenA|Johan Cruijff Arena)$"](${BBOX});
);
out center tags;`;

  const lineData = await postOverpass(lineQuery);
  const landmarkData = await postOverpass(landmarkQuery);

  const grouped = new Map();

  for (const element of lineData.elements || []) {
    if (!Array.isArray(element.geometry) || element.geometry.length < 2) continue;

    const tags = element.tags || {};
    let groupKey = null;
    let label = null;

    if (tags.highway === 'motorway' && /(^|;)A10($|;)/.test(tags.ref || '')) {
      groupKey = 'A10';
      label = 'A10';
    } else if (tags.waterway === 'river' && MAIN_WATER_NAMES.has(tags.name)) {
      groupKey = tags.name;
      label = tags.name;
    } else if (tags.natural === 'water' && MAIN_WATER_NAMES.has(tags.name)) {
      groupKey = tags.name;
      label = tags.name;
    } else if (tags.waterway === 'canal' && CANAL_NAMES.has(tags.name)) {
      groupKey = tags.name;
      label = tags.name;
    }

    if (!groupKey) continue;

    const points = element.geometry.map(normalizePoint);
    const clippedSegments = splitByBounds(points);
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, { label, segments: [] });
    }
    clippedSegments.forEach(segment => {
      grouped.get(groupKey).segments.push(segment);
    });
  }

  const waterLines = [];
  const roadLines = [];

  grouped.forEach((value, key) => {
    const merged = key === 'A10' ? value.segments : mergeSegments(value.segments);
    const epsilon = key === 'A10' ? 0.00014 : 0.00006;

    const simplified = merged
      .map(cleanLine)
      .filter(points => points.length >= 2)
      .map(points => simplifyRdp(points, epsilon))
      .filter(points => points.length >= 2)
      .sort((a, b) => lineLength(b) - lineLength(a));

    const minLength = key === 'A10' ? 0.0007 : CANAL_NAMES.has(key) ? 0.001 : 0.0015;
    const maxSegments = key === 'A10' ? 20 : CANAL_NAMES.has(key) ? 3 : 2;
    const kept = simplified
      .filter(points => lineLength(points) >= minLength)
      .slice(0, maxSegments);

    for (let i = 0; i < kept.length; i += 1) {
      const points = kept[i];
      const line = {
        id: `${sanitizeId(key)}_${String(i + 1).padStart(2, '0')}`,
        label: i === 0 ? value.label : undefined,
        points,
      };
      if (key === 'A10') {
        roadLines.push(line);
      } else {
        waterLines.push(line);
      }
    }
  });

  const landmarks = pickLandmarkCandidates(landmarkData.elements || []);

  const tsContent = buildTs({ waterLines, roadLines, landmarks });
  fs.writeFileSync(OUTPUT_PATH, tsContent, 'utf8');

  console.log(
    `Generated ${path.relative(ROOT_DIR, OUTPUT_PATH)} (${waterLines.length} water lines, ${roadLines.length} road lines, ${landmarks.length} landmarks)`,
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
