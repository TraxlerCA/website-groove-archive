export type MapVisualVariant = 'civic_context' | 'transit_glow' | 'landmark_postcard';

export type MapVisualVariantMeta = {
  id: MapVisualVariant;
  title: string;
  subtitle: string;
};

export const MAP_VISUAL_VARIANTS: MapVisualVariantMeta[] = [
  {
    id: 'civic_context',
    title: 'Option A: Civic Context',
    subtitle: 'Subtle water polygons and A10 trace behind the zones.',
  },
  {
    id: 'transit_glow',
    title: 'Option B: Transit Glow',
    subtitle: 'Night-style canvas with brighter mobility and water cues.',
  },
  {
    id: 'landmark_postcard',
    title: 'Option C: Landmark Postcard',
    subtitle: 'Warmer paper map with named points for fast orientation.',
  },
];
