import type { Character } from "./moba";

export type HeroOrder = "alphabetical" | "lane" | "role";
export const DEFAULT_HERO_ORDER: HeroOrder = "alphabetical";
const LANE_ORDER = ["Topo", "Selva", "Meio", "Inferior", "Suporte"];

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
    .sort(([a], [b]) => {
      if (a === b) return 0;
      if (a === missing) return 1;
      if (b === missing) return -1;
      if (order === "lane") {
        const rankA = LANE_ORDER.indexOf(a);
        const rankB = LANE_ORDER.indexOf(b);
        const difference = (rankA < 0 ? LANE_ORDER.length : rankA) - (rankB < 0 ? LANE_ORDER.length : rankB);
        if (difference) return difference;
      }
      return a.localeCompare(b, "pt-BR");
    })
    .map(([label, heroes]) => ({ label, heroes }));
}