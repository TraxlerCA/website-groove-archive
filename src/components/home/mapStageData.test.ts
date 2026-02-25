import { describe, expect, it } from 'vitest';
import { buildMapData, type RoadFeature, type ZoneFeature } from '@/components/home/mapStageData';

const samplePolygon: ZoneFeature['geometry'] = {
  type: 'Polygon',
  coordinates: [
    [
      [4.88, 52.36],
      [4.89, 52.36],
      [4.89, 52.37],
      [4.88, 52.37],
      [4.88, 52.36],
    ],
  ],
};

const roads: RoadFeature[] = [
  {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [4.87, 52.35],
        [4.9, 52.38],
      ],
    },
  },
];

describe('buildMapData', () => {
  it('normalizes legacy zone ids and keeps projected data', () => {
    const zones: ZoneFeature[] = [
      {
        type: 'Feature',
        properties: {
          code: 'GA01',
          name: 'Centrum-West',
          zoneId: 'canal_glow',
          active: true,
        },
        geometry: samplePolygon,
      },
    ];

    const result = buildMapData(zones, roads);
    expect(result.zoneFeatures).toHaveLength(1);
    expect(result.zoneFeatures[0].zoneId).toBe('melodic_house_techno');
    expect(result.zoneFootprintPaths).toHaveLength(1);
    expect(result.roadPaths).toHaveLength(1);
    expect(result.zoneLabelPoints.melodic_house_techno).toBeDefined();
  });

  it('drops unknown zone ids from active footprint', () => {
    const zones: ZoneFeature[] = [
      {
        type: 'Feature',
        properties: {
          code: 'GA02',
          name: 'Centrum-Oost',
          zoneId: 'unknown_zone',
          active: true,
        },
        geometry: samplePolygon,
      },
    ];

    const result = buildMapData(zones, roads);
    expect(result.zoneFeatures[0].zoneId).toBeNull();
    expect(result.zoneFootprintPaths).toHaveLength(0);
  });

  it('falls back to bounds center when polygon centroid cannot be computed', () => {
    const degeneratePolygon: ZoneFeature['geometry'] = {
      type: 'Polygon',
      coordinates: [
        [
          [4.88, 52.36],
          [4.89, 52.36],
          [4.9, 52.36],
          [4.88, 52.36],
        ],
      ],
    };

    const zones: ZoneFeature[] = [
      {
        type: 'Feature',
        properties: {
          code: 'GA03',
          name: 'Fallback Zone',
          zoneId: 'melodic_house_techno',
          active: true,
        },
        geometry: degeneratePolygon,
      },
    ];

    const result = buildMapData(zones, []);
    expect(result.zoneLabelPoints.melodic_house_techno).toBeDefined();
    expect(result.zoneFootprintPaths).toHaveLength(1);
  });

  it('supports multipolygon zones and multiline road geometry', () => {
    const zones: ZoneFeature[] = [
      {
        type: 'Feature',
        properties: {
          code: 'GA04',
          name: 'Multipolygon Zone',
          zoneId: 'classic_house_garage',
          active: true,
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [4.87, 52.35],
                [4.875, 52.35],
                [4.875, 52.355],
                [4.87, 52.355],
                [4.87, 52.35],
              ],
            ],
            [
              [
                [4.89, 52.37],
                [4.895, 52.37],
                [4.895, 52.375],
                [4.89, 52.375],
                [4.89, 52.37],
              ],
            ],
          ],
        },
      },
    ];

    const multiRoads: RoadFeature[] = [
      {
        type: 'Feature',
        geometry: {
          type: 'MultiLineString',
          coordinates: [
            [
              [4.86, 52.34],
              [4.87, 52.35],
            ],
            [
              [4.9, 52.38],
              [4.91, 52.39],
            ],
          ],
        },
      },
    ];

    const result = buildMapData(zones, multiRoads);
    expect(result.zoneFeatures).toHaveLength(1);
    expect(result.zoneFeatures[0].path).toContain('M ');
    expect(result.roadPaths).toHaveLength(1);
    expect(result.roadPaths[0]).toContain('L ');
    expect(result.zoneLabelPoints.classic_house_garage).toBeDefined();
  });
});
