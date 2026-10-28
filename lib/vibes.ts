export type Vibe = "funny" | "relatable" | "deadpan" | "columbia";

export interface VibeInfo {
  id: Vibe;
  label: string;
  // Same pastel tag colors as the CaptionNYC app's .voice-* classes.
  tag: string;
}

export const VIBES: VibeInfo[] = [
  { id: "funny", label: "Funny", tag: "bg-[#ffe9a8] text-[#5c4300]" },
  { id: "relatable", label: "Relatable", tag: "bg-[#dce9ff] text-[#1d3f7a]" },
  { id: "deadpan", label: "Deadpan", tag: "bg-[#e7e2d8] text-[#423c33]" },
  { id: "columbia", label: "Columbia", tag: "bg-[#cbe4f4] text-[#0f4766]" },
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
