import { describe, expect, it } from "vitest";
import { DEFAULT_HERO_ORDER, groupHeroes } from "@/lib/hero-order";
import type { Character } from "@/lib/moba";

const heroes = [
  { name: "Zoe", role: "Mago", lanes: ["Meio", "Suporte"] },
  { name: "Ahri", role: "Mago", lanes: ["Meio"] },
  { name: "Braum", role: "Tanque", lanes: ["Suporte"] },
] as Character[];

describe("hero organization", () => {
  it("defaults to alphabetical order", () => {
    expect(DEFAULT_HERO_ORDER).toBe("alphabetical");
    expect(groupHeroes(heroes, DEFAULT_HERO_ORDER)[0]?.heroes.map(h => h.name)).toEqual(["Ahri", "Braum", "Zoe"]);
  });
  it("groups heroes by every assigned lane", () => {
    expect(groupHeroes(heroes, "lane").map(g => [g.label, g.heroes.map(h => h.name)])).toEqual([
      ["Meio", ["Ahri", "Zoe"]], ["Suporte", ["Braum", "Zoe"]],
    ]);
  });
  it("groups heroes by role", () => {
    expect(groupHeroes(heroes, "role").map(g => [g.label, g.heroes.map(h => h.name)])).toEqual([
      ["Mago", ["Ahri", "Zoe"]], ["Tanque", ["Braum"]],
    ]);
  });
  it("orders lanes as Topo, Selva, Meio, Inferior, Suporte", () => {
    const allLanes = [{ name: "Ahri", lanes: ["Suporte", "Inferior", "Meio", "Selva", "Topo"] }] as Character[];
    expect(groupHeroes(allLanes, "lane").map(g => g.label)).toEqual([
      "Topo", "Selva", "Meio", "Inferior", "Suporte",
    ]);
  });
  it("keeps unassigned heroes visible", () => {
    const unassigned = [{ name: "Akali", role: null, lanes: [] }] as unknown as Character[];
    expect(groupHeroes(unassigned, "lane")[0]?.label).toBe("Sem rota");
    expect(groupHeroes(unassigned, "role")[0]?.heroes[0]?.name).toBe("Akali");
  });
});