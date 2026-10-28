import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Eye, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { charactersQuery, removeImages, type Character } from "@/lib/moba";
import { MediaImage, Monogram } from "@/components/moba/MediaImage";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

function missing(c: Character) {
  const m: string[] = [];
  if (!c.portrait_url) m.push("retrato");
  if (!c.art_url) m.push("arte");
  if (!c.role) m.push("função");
  if (!c.short_description) m.push("descrição");
  return m;
}

function AdminHome() {
  const { data, isLoading } = useQuery(charactersQuery);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [del, setDel] = useState<{ c: Character; abilities: number; counters: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const list = (data ?? []).filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  const askDelete = async (c: Character) => {
    const [a, k1, k2] = await Promise.all([
      supabase.from("abilities").select("id", { count: "exact", head: true }).eq("character_id", c.id),
      supabase.from("counters").select("id", { count: "exact", head: true }).eq("character_id", c.id),
      supabase.from("counters").select("id", { count: "exact", head: true }).eq("target_id", c.id),
    ]);
    setDel({ c, abilities: a.count ?? 0, counters: (k1.count ?? 0) + (k2.count ?? 0) });
  };

  const doDelete = async () => {
    if (!del) return;
    setBusy(true);
    const { data: abs } = await supabase.from("abilities").select("icon_url").eq("character_id", del.c.id);
    const { error } = await supabase.from("characters").delete().eq("id", del.c.id);
    if (error) { toast.error("Não foi possível excluir: " + error.message); setBusy(false); return; }
    await removeImages([del.c.portrait_url, del.c.art_url, ...del.c.gallery, ...(abs ?? []).map((x) => x.icon_url)]);
    await qc.invalidateQueries({ queryKey: ["characters"] });
    toast.success(`${del.c.name} foi excluído.`);
    setDel(null); setBusy(false);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label-caps">Personagens cadastrados</div>
          <div className="font-display text-4xl font-bold text-primary">{data?.length ?? "—"}</div>
        </div>
        <Button asChild><Link to="/admin/new"><Plus className="size-4" /> Novo personagem</Link></Button>
      </div>
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar personagem" className="h-10 w-full border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
      </div>
      <div className="mt-4 divide-y border">
        {isLoading && <div className="p-6 text-muted-foreground">Carregando…</div>}
        {!isLoading && !list.length && <div className="p-10 text-center text-muted-foreground">{data?.length ? "Nenhum resultado." : "Nenhum personagem ainda. Clique em “Novo personagem”."}</div>}
        {list.map((c) => {
          const m = missing(c);
          return (
            <div key={c.id} className="flex items-center gap-4 p-3">
              <MediaImage path={c.portrait_url} alt={c.name} className="size-12 object-cover" fallback={<Monogram name={c.name} className="size-12 text-xs" />} />
              <div className="min-w-0 flex-1">
                <div className="font-display font-semibold">{c.name}</div>
                <div className="truncate text-xs text-muted-foreground">{[c.role, c.title].filter(Boolean).join(" · ") || "—"}</div>
                {m.length > 0 && <div className="mt-0.5 text-xs text-primary">Incompleto: falta {m.join(", ")}</div>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" asChild title="Visualizar"><Link to="/heroes/$slug" params={{ slug: c.slug }}><Eye className="size-4" /></Link></Button>
                <Button variant="ghost" size="icon" asChild title="Editar"><Link to="/admin/$id" params={{ id: c.id }}><Pencil className="size-4" /></Link></Button>
                <Button variant="ghost" size="icon" title="Excluir" onClick={() => askDelete(c)}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && !busy && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {del?.c.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Também serão removidos: {del?.abilities ?? 0} habilidade(s), {del?.counters ?? 0} relação(ões) de counter
              (incluindo as de outros heróis que apontam para ele) e as imagens deste personagem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); doDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {busy ? "Excluindo…" : "Excluir definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
