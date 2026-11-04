import type { Item } from "./moba";

export type LibraryItem = { id: string; name: string; description: string; image: string | null; archived: boolean };

export function resolveLibraryItem(item: Item, library: LibraryItem[]): Item {
  if (!item.library_id) return item;
  const entry = library.find((entry) => entry.id === item.library_id);
  if (!entry) throw new Error(`O item “${item.name}” não está disponível. Remova-o ou escolha outro.`);
  return { ...item, name: entry.name, image: entry.image, description: entry.description };
}