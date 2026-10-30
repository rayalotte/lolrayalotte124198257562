import type { Character } from "./moba";

export type HeroOrder = "alphabetical" | "lane" | "role";
export const DEFAULT_HERO_ORDER: HeroOrder = "alphabetical";

export function groupHeroes(heroes: Character[], order: HeroOrder) {
  const sorted = [...heroes].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  if (order === "alphabetical") return [{ label: null, heroes: sorted }];

  const groups = new Map<string, Character[]>();
  const missing = order === "lane" ? "Sem rota" : "Sem função";
  for (const hero of sorted) {
    const values = order === "lane" ? hero.lanes.filter(Boolean) : [hero.role].filter((v): v is string => !!v);
    for (const label of new Set(values.length ? values : [missing])) {
      const group = groups.get(label) ?? [];
      group.push(hero);
      groups.set(label, group);
    }
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a === missing ? 1 : b === missing ? -1 : a.localeCompare(b, "pt-BR"))
    .map(([label, heroes]) => ({ label, heroes }));
}