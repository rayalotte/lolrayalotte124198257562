import { describe, expect, it } from "vitest";
import { resolveLibraryItem } from "@/lib/item-references";

const library = [{ id: "sword", name: "Espada", description: "Dano físico", image: "item-library/sword.webp", archived: false }];
describe("Reusable items", () => {
  it("reuses the same item across characters without duplicating its photo", () => {
    const first = resolveLibraryItem({ library_id: "sword", name: "", kind: "fundamental" }, library);
    const second = resolveLibraryItem({ library_id: "sword", name: "", kind: "situacional", note: "Contra tanques" }, library);
    expect(first.image).toBe("item-library/sword.webp");
    expect(second.image).toBe(first.image);
    expect(second.name).toBe("Espada");
    expect(second.note).toBe("Contra tanques");
    expect(second.kind).toBe("situacional");
  });
  it("refreshes the linked name and description from the library", () => {
    expect(resolveLibraryItem({ library_id: "sword", name: "Antigo" }, library)).toMatchObject({ name: "Espada", description: "Dano físico" });
  });
  it("preserves existing standalone items", () => {
    const legacy = { name: "Poção", image: "characters/hero/potion.webp" };
    expect(resolveLibraryItem(legacy, library)).toEqual(legacy);
  });
  it("keeps archived items on characters that already use them", () => {
    expect(resolveLibraryItem({ library_id: "sword", name: "Espada" }, [{ ...library[0], archived: true }]).name).toBe("Espada");
  });
});