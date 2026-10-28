import { supabase } from "@/integrations/supabase/client";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const SLOTS = ["P", "Q", "W", "E", "R"] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_LABEL: Record<Slot, string> = { P: "Passiva", Q: "Q", W: "W", E: "E", R: "R" };

export const STAT_KEYS = [
  ["hp", "Vida"],
  ["mana", "Mana / Recurso"],
  ["damage", "Dano"],
  ["speed", "Velocidade"],
  ["defense", "Defesa"],
  ["range", "Alcance"],
] as const;

export type Ability = {
  id?: string;
  character_id?: string;
  slot: Slot;
  name: string | null;
  icon_url: string | null;
  description: string | null;
  damage: string | null;
  range: string | null;
  duration: string | null;
  cooldown: string | null;
  cost: string | null;
  effects: string | null;
  notes: string | null;
};
export const ABILITY_FIELDS = [
  ["damage", "Dano"],
  ["range", "Alcance"],
  ["duration", "Duração"],
  ["cooldown", "Recarga"],
  ["cost", "Custo"],
] as const;

export type Item = { name: string; note?: string };
export type CustomStat = { label: string; value: string };

export const DIFFICULTY_OPTIONS = [
  { value: 1, label: "Fácil" },
  { value: 2, label: "Média" },
  { value: 3, label: "Difícil" },
  { value: 4, label: "Muito difícil" },
] as const;
export const DIFFICULTY_LABEL: Record<number, string> = { 1: "Fácil", 2: "Média", 3: "Difícil", 4: "Muito difícil" };

export type Character = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  short_description: string | null;
  biography: string | null;
  role: string | null;
  lanes: string[];
  tags: string[];
  notes: string | null;
  portrait_url: string | null;
  art_url: string | null;
  gallery: string[];
  stats: Record<string, string>;
  custom_stats: CustomStat[];
  items: Item[];
  changelog: string | null;
  difficulty: number | null;
  created_at: string;
};
export type Counter = { id?: string; character_id: string; target_id: string; kind: "strong" | "weak"; note: string | null };

export const charactersQuery = queryOptions({
  queryKey: ["characters"],
  queryFn: async () => {
    const { data, error } = await supabase.from("characters").select("*").order("name");
    if (error) throw error;
    return data as unknown as Character[];
  },
});

export const characterDetailQuery = (id: string) =>
  queryOptions({
    queryKey: ["character-detail", id],
    queryFn: async () => {
      const [ab, co] = await Promise.all([
        supabase.from("abilities").select("*").eq("character_id", id),
        supabase.from("counters").select("*").eq("character_id", id),
      ]);
      if (ab.error) throw ab.error;
      if (co.error) throw co.error;
      return { abilities: ab.data as unknown as Ability[], counters: co.data as unknown as Counter[] };
    },
  });

export function slugify(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "heroi"
  );
}

/* ---------- media (private bucket, signed URLs) ---------- */
const BUCKET = "media";
export const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
export const MAX_BYTES = 8 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return "Formato inválido. Use PNG, JPG ou WebP.";
  if (file.size > MAX_BYTES) return "Arquivo muito grande (máximo 8 MB).";
  return null;
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error("Falha ao enviar imagem: " + error.message);
  return path;
}

export async function removeImages(paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (list.length) await supabase.storage.from(BUCKET).remove(list);
}

export function useMediaUrl(path: string | null | undefined) {
  const q = useQuery({
    queryKey: ["media", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 60 * 20,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path!, 60 * 60 * 24);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  return q.data ?? null;
}
