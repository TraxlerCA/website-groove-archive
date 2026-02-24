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
});
