import type { Row } from '@/lib/heatmaps';

// Event metadata and offline browser-test fixture. Live artist rows come from the database.
// Source: https://www.over-bruggen.com/events/overbruggen-kyle-starkey-invites-ade-2026
export const overbruggen = {
  festival: 'Overbruggen Kyle Starkey Invites',
  date: '2026-10-24',
  venue: 'Pllek, Amsterdam',
  source: 'https://www.over-bruggen.com/events/overbruggen-kyle-starkey-invites-ade-2026',
};

export const lineupRows: Row[] = [
  'Club Angel', 'CVNTS', 'Entasia', 'Ned Bennett', 'Inafekt', 'Sensu',
  'Kyle Starkey', 'NewTone', 'Olive Anguz', 'STÜM', 'WOLTERS',
].map(artist => ({ festival: overbruggen.festival, date: overbruggen.date, artist,
  stage: '', start: '', end: '', rating: ['Kyle Starkey', 'Olive Anguz'].includes(artist) ? 'blazing' : '' }));
