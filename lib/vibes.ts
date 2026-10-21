export type Vibe = "funny" | "relatable" | "deadpan" | "columbia";

export interface VibeInfo {
  id: Vibe;
  label: string;
  // Categorical slots 1-4 of the dark chart palette, validated against zinc-900.
  color: string;
}

export const VIBES: VibeInfo[] = [
  { id: "funny", label: "Funny", color: "#3987e5" },
  { id: "relatable", label: "Relatable", color: "#d95926" },
  { id: "deadpan", label: "Deadpan", color: "#199e70" },
  { id: "columbia", label: "Columbia", color: "#c98500" },
];

export function isVibe(value: unknown): value is Vibe {
  return VIBES.some((vibe) => vibe.id === value);
}

export function vibeInfo(value: string | null | undefined): VibeInfo | null {
  return VIBES.find((vibe) => vibe.id === value) ?? null;
}

export const DEFAULT_PLACE = "New York";

export function placeName(neighborhood: string | null | undefined): string {
  return neighborhood?.trim() || DEFAULT_PLACE;
}
