import type { Artist, Genre, Row } from '@/lib/types';

export const fixtureRows: Row[] = [
  {
    set: 'Live from Lost Village - Demi Riquisimo b2b Nyra',
    classification: 'House',
    tier: 'blazing',
    youtube: 'https://youtu.be/lostvillage1',
  },
  {
    set: 'Canal Morning with Octo Octa',
    classification: 'House',
    tier: 'hot',
    youtube: 'https://youtu.be/canalmornin2',
  },
  {
    set: 'Warehouse Pressure with SPFDJ',
    classification: 'Techno',
    tier: 'blazing',
    youtube: 'https://youtu.be/warehouse33',
  },
  {
    set: 'Festival Anthems & Big Room - Archive Cut',
    classification: 'Techno',
    tier: 'hot',
    youtube: 'https://youtu.be/festival444',
  },
  {
    set: 'Sunrise Selector with Batu',
    classification: 'Breaks',
    tier: 'ok',
    youtube: 'https://youtu.be/sunrise5555',
  },
  {
    set: 'Rainy Tramlines with Helena Hauff',
    classification: 'House',
    tier: 'ok',
    youtube: 'https://youtu.be/tramlines66',
  },
];

export const fixtureGenres: Genre[] = [
  { label: 'House', explanation: 'Warm rollers and club-ready 4/4.' },
  { label: 'Techno', explanation: 'Warehouse pressure and late-night drive.' },
  { label: 'Breaks', explanation: 'Broken rhythms and steppy tension.' },
];

export const fixtureArtists: Artist[] = [
  { name: 'Demi Riquisimo', rating: 'blazing' },
  { name: 'SPFDJ', rating: 'blazing' },
  { name: 'Octo Octa', rating: 'hot' },
  { name: 'Helena Hauff', rating: 'hot' },
  { name: 'Batu', rating: 'ok' },
  { name: 'Nyra', rating: 'ok' },
];
