export type MapVisualVariant = 'civic_context' | 'transit_glow' | 'landmark_postcard';

export type MapVisualVariantMeta = {
  id: MapVisualVariant;
  title: string;
  subtitle: string;
};

export const MAP_VISUAL_VARIANTS: MapVisualVariantMeta[] = [
  {
    id: 'civic_context',
    title: 'Option A: Minimal Context',
    subtitle: 'A10 + main river structure (IJ/Amstel).',
  },
  {
    id: 'transit_glow',
    title: 'Option B: Medium Context',
    subtitle: 'Adds canal-belt lines for stronger orientation.',
  },
  {
    id: 'landmark_postcard',
    title: 'Option C: Full Context',
    subtitle: 'Adds key landmark points on top of roads and waterways.',
  },
];
