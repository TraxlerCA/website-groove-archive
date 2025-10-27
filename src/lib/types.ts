export type Row = {
  set: string;
  tier?: string | null;
  classification?: string | null;
  energie?: string | null;
  soundcloud?: string | null;
  youtube?: string | null;
};

export type Genre = { label: string; explanation: string };
export type Provider = "youtube" | "soundcloud";
