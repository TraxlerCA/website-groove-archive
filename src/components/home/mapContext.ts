export type ContextPoint = [number, number];

export type ContextLine = {
  id: string;
  label?: string;
  points: ContextPoint[];
};

export type ContextPolygon = {
  id: string;
  points: ContextPoint[];
};

export type ContextLandmark = {
  id: string;
  name: string;
  point: ContextPoint;
};

export const CONTEXT_WATER_AREAS: ContextPolygon[] = [
  {
    id: 'ij',
    points: [
      [4.81, 52.3885],
      [4.998, 52.3885],
      [4.998, 52.4045],
      [4.81, 52.4045],
      [4.81, 52.3885],
    ],
  },
  {
    id: 'nieuwe_meer',
    points: [
      [4.803, 52.3255],
      [4.84, 52.3225],
      [4.852, 52.3345],
      [4.823, 52.34],
      [4.803, 52.332],
      [4.803, 52.3255],
    ],
  },
  {
    id: 'ijmeer',
    points: [
      [4.99, 52.367],
      [5.085, 52.36],
      [5.097, 52.383],
      [5.01, 52.392],
      [4.99, 52.367],
    ],
  },
];

export const CONTEXT_WATER_LINES: ContextLine[] = [
  {
    id: 'amstel',
    label: 'Amstel',
    points: [
      [4.903, 52.396],
      [4.901, 52.388],
      [4.9, 52.379],
      [4.9, 52.3695],
      [4.901, 52.36],
      [4.905, 52.3485],
      [4.911, 52.3375],
      [4.917, 52.3255],
      [4.923, 52.3145],
      [4.929, 52.302],
      [4.934, 52.2915],
    ],
  },
  {
    id: 'singel',
    label: 'Singel',
    points: [
      [4.881, 52.378],
      [4.886, 52.382],
      [4.895, 52.383],
      [4.903, 52.38],
      [4.906, 52.374],
      [4.904, 52.368],
      [4.897, 52.3645],
      [4.889, 52.364],
      [4.883, 52.368],
      [4.881, 52.3735],
      [4.881, 52.378],
    ],
  },
  {
    id: 'herengracht',
    label: 'Herengracht',
    points: [
      [4.8775, 52.3775],
      [4.882, 52.381],
      [4.89, 52.3825],
      [4.898, 52.38],
      [4.901, 52.374],
      [4.8995, 52.3685],
      [4.894, 52.365],
      [4.8865, 52.3645],
      [4.881, 52.3675],
      [4.878, 52.3725],
      [4.8775, 52.3775],
    ],
  },
  {
    id: 'keizersgracht',
    label: 'Keizersgracht',
    points: [
      [4.875, 52.377],
      [4.879, 52.3805],
      [4.8865, 52.3815],
      [4.894, 52.379],
      [4.897, 52.374],
      [4.8955, 52.3695],
      [4.8905, 52.366],
      [4.8835, 52.365],
      [4.8785, 52.368],
      [4.8755, 52.372],
      [4.875, 52.377],
    ],
  },
  {
    id: 'prinsengracht',
    label: 'Prinsengracht',
    points: [
      [4.8725, 52.376],
      [4.8765, 52.38],
      [4.884, 52.3815],
      [4.891, 52.3795],
      [4.895, 52.374],
      [4.894, 52.369],
      [4.8895, 52.3655],
      [4.8825, 52.3645],
      [4.8765, 52.367],
      [4.873, 52.3715],
      [4.8725, 52.376],
    ],
  },
];

export const CONTEXT_ROAD_LINES: ContextLine[] = [
  {
    id: 'a10',
    label: 'A10',
    points: [
      [4.783, 52.371],
      [4.795, 52.393],
      [4.828, 52.409],
      [4.872, 52.417],
      [4.918, 52.416],
      [4.956, 52.406],
      [4.982, 52.387],
      [4.989, 52.361],
      [4.981, 52.335],
      [4.956, 52.313],
      [4.915, 52.301],
      [4.87, 52.304],
      [4.83, 52.318],
      [4.798, 52.341],
      [4.783, 52.371],
    ],
  },
];

export const CONTEXT_LANDMARKS: ContextLandmark[] = [
  { id: 'centraal', name: 'Centraal', point: [4.8996, 52.3795] },
  { id: 'dam', name: 'Dam', point: [4.8936, 52.3735] },
  { id: 'rijksmuseum', name: 'Rijksmuseum', point: [4.8871, 52.361] },
  { id: 'vondelpark', name: 'Vondelpark', point: [4.8686, 52.3572] },
  { id: 'ndsm', name: 'NDSM', point: [4.8912, 52.4011] },
  { id: 'arena', name: 'ArenA', point: [4.9479, 52.3119] },
];
