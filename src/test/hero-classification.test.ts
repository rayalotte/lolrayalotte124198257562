import { describe, expect, it } from "vitest";
import { ATTACK_TYPES, DAMAGE_TYPES, matchesClassification, toggleClassification } from "@/lib/hero-classification";

describe("hero combat classification", () => {
  it("allows Melee and Ranged together and independent deselection", () => {
    expect(ATTACK_TYPES).toEqual(["Melee", "Ranged"]);
    const selected = toggleClassification(toggleClassification([], "Melee"), "Ranged");
    expect(selected).toEqual(["Melee", "Ranged"]);
    expect(toggleClassification(selected, "Melee")).toEqual(["Ranged"]);
  });
  it("allows AP and AD together and independent deselection", () => {
    expect(DAMAGE_TYPES).toEqual(["AP", "AD"]);
    const selected = toggleClassification(toggleClassification([], "AP"), "AD");
    expect(selected).toEqual(["AP", "AD"]);
    expect(toggleClassification(selected, "AD")).toEqual(["AP"]);
  });
  it("filters Melee and Ranged including heroes with both", () => {
    const hybrid = { attack_types: ["Melee", "Ranged"] };
    expect(matchesClassification(hybrid, ["Melee"], [])).toBe(true);
    expect(matchesClassification(hybrid, ["Ranged"], [])).toBe(true);
    expect(matchesClassification(hybrid, ["Melee", "Ranged"], [])).toBe(true);
    expect(matchesClassification({ attack_types: ["Melee"] }, ["Ranged"], [])).toBe(false);
    expect(matchesClassification({ attack_types: ["Melee"] }, ["Melee", "Ranged"], [])).toBe(false);
  });
  it("filters AP and AD and combines damage with attack type", () => {
    const hybrid = { attack_types: ["Ranged"], damage_types: ["AP", "AD"] };
    expect(matchesClassification(hybrid, ["Ranged"], ["AP"])).toBe(true);
    expect(matchesClassification(hybrid, [], ["AD"])).toBe(true);
    expect(matchesClassification(hybrid, [], ["AP", "AD"])).toBe(true);
    expect(matchesClassification(hybrid, ["Melee"], ["AP"])).toBe(false);
    expect(matchesClassification({ damage_types: ["AP"] }, [], ["AD"])).toBe(false);
    expect(matchesClassification({ damage_types: ["AP"] }, [], ["AP", "AD"])).toBe(false);
  });
  it("keeps unclassified heroes visible without classification filters", () => {
    expect(matchesClassification({}, [], [])).toBe(true);
    expect(matchesClassification({}, ["Melee"], [])).toBe(false);
    expect(matchesClassification({}, [], ["AP"])).toBe(false);
  });
});