export const ATTACK_TYPES = ["Melee", "Ranged"] as const;
export const DAMAGE_TYPES = ["AP", "AD", "Verdadeiro"] as const;

export function toggleClassification(values: string[], value: string) {
  return values.includes(value) ? values.filter(v => v !== value) : [...values, value];
}

export function matchesClassification(
  hero: { attack_types?: string[]; damage_types?: string[] },
  attacks: string[],
  damages: string[],
) {
  return attacks.every(value => hero.attack_types?.includes(value)) &&
    damages.every(value => hero.damage_types?.includes(value));
}
