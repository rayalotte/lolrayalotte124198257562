import { describe, expect, it } from "vitest";

import { DIFFICULTY_LABEL, DIFFICULTY_OPTIONS } from "@/lib/moba";

// The difficulty scale the admin picks from when registering a hero.
describe("Difficulty levels", () => {
  it("offers Fácil, Média, Difícil and Muito difícil", () => {
    expect(DIFFICULTY_OPTIONS.map((d) => d.value)).toEqual([1, 2, 3, 4]);
    expect(DIFFICULTY_OPTIONS.map((d) => d.label)).toEqual(["Fácil", "Média", "Difícil", "Muito difícil"]);
  });

  it("names level 4 Muito difícil", () => {
    expect(DIFFICULTY_LABEL[4]).toBe("Muito difícil");
  });
});
