export const POWER_SPIKE_OPTIONS = ["Earlygame", "Midgame", "Lategame"] as const;

export function normalizePowerSpikes(value: unknown): string[] {
  const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  return POWER_SPIKE_OPTIONS.filter(option => values.includes(option));
}

export function togglePowerSpike(value: unknown, option: string): string[] {
  const selected = normalizePowerSpikes(value);
  if (!POWER_SPIKE_OPTIONS.some(candidate => candidate === option)) return selected;
  return selected.includes(option)
    ? selected.filter(candidate => candidate !== option)
    : normalizePowerSpikes([...selected, option]);
}