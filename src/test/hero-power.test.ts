import { describe, expect, it } from "vitest";
import { normalizePowerSpikes, POWER_SPIKE_OPTIONS, togglePowerSpike } from "@/lib/hero-power";
import { RESOURCE_OPTIONS } from "@/lib/moba";

describe("hero power spikes", () => {
  it("allows Earlygame, Midgame and Lategame together and independent deselection", () => {
    expect(POWER_SPIKE_OPTIONS).toEqual(["Earlygame", "Midgame", "Lategame"]);
    const earlyMid = togglePowerSpike(togglePowerSpike([], "Earlygame"), "Midgame");
    expect(earlyMid).toEqual(["Earlygame", "Midgame"]);
    const all = togglePowerSpike(earlyMid, "Lategame");
    expect(all).toEqual(["Earlygame", "Midgame", "Lategame"]);
    expect(togglePowerSpike(all, "Midgame")).toEqual(["Earlygame", "Lategame"]);
  });

  it("handles missing or legacy values without crashing on selection", () => {
    expect(togglePowerSpike(undefined, "Earlygame")).toEqual(["Earlygame"]);
    expect(togglePowerSpike(null, "Midgame")).toEqual(["Midgame"]);
    expect(togglePowerSpike("Earlygame", "Midgame")).toEqual(["Earlygame", "Midgame"]);
    expect(togglePowerSpike({}, "Lategame")).toEqual(["Lategame"]);
    expect(normalizePowerSpikes(["Earlygame", "Earlygame", "invalid"])).toEqual(["Earlygame"]);
  });
});

describe("hero resources", () => {
  it("offers Recurso próprio without removing existing resources", () => {
    expect(RESOURCE_OPTIONS).toEqual(["Mana", "Energia", "Fúria", "Vida", "Nenhum", "Recurso próprio"]);
  });
});