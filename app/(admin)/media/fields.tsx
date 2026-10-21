import { inputClass, labelClass } from "@/components/ui";
import { VIBES } from "@/lib/vibes";

export function VibeSelect({ defaultValue, name = "vibe" }: { defaultValue?: string | null; name?: string }) {
  return (
    <select name={name} defaultValue={defaultValue ?? "funny"} required className={inputClass}>
      {VIBES.map((vibe) => (
        <option key={vibe.id} value={vibe.id}>
          {vibe.label}
        </option>
      ))}
    </select>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}
