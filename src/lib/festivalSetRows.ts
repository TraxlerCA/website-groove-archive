export type FestivalSetRow = {
  festival?: string | null;
  date?: string | null;
  stage?: string | null;
  stage_order?: number | string | null;
  artist?: string | null;
  start?: string | null;
  end?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  rating?: string | null;
};

export function mapFestivalSetRow(row: FestivalSetRow) {
  return {
    festival: row.festival ?? '',
    date: row.date ?? '',
    stage: row.stage ?? '',
    stage_order: row.stage_order ?? 9999,
    artist: row.artist ?? '',
    start: row.start ?? row.start_time ?? '',
    end: row.end ?? row.end_time ?? '',
    rating: row.rating ?? '',
  };
}

