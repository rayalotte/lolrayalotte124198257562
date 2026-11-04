import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Archive, Pencil, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { itemLibraryQuery } from "@/lib/item-library";
import type { LibraryItem } from "@/lib/item-references";
import { removeImages, uploadImage } from "@/lib/moba";
import { ItemPhoto, img, type Img } from "@/components/moba/ItemPhoto";
import { MediaImage, Monogram } from "@/components/moba/MediaImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/items")({
  head: () => ({ meta: [
    { title: "Biblioteca de itens — Codex Arena" },
    { name: "description", content: "Cadastre e gerencie os itens reutilizáveis dos personagens no Codex Arena." },
    { property: "og:title", content: "Biblioteca de itens — Codex Arena" },
    { property: "og:description", content: "Biblioteca administrativa de itens do Codex Arena." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ItemLibraryPage,
});

function ItemLibraryPage() {
  const { data, isLoading, error, refetch } = useQuery(itemLibraryQuery);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<LibraryItem | "new" | null>(null);
  const [archiving, setArchiving] = useState<LibraryItem | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = async () => { await Promise.all([qc.invalidateQueries({ queryKey: ["item-library"] }), qc.invalidateQueries({ queryKey: ["characters"] })]); };
  const archive = async (item: LibraryItem) => {
    setBusy(true);
    const { error } = await supabase.from("item_library").update({ archived: !item.archived, updated_at: new Date().toISOString() }).eq("id", item.id).select("id").single();
    if (error) toast.error("Não foi possível alterar o item: " + error.message);
    else { await refresh(); setArchiving(null); toast.success(item.archived ? "Item restaurado." : "Item arquivado."); }
    setBusy(false);
  };
  const list = (data ?? []).filter((item) => item.archived === showArchived && item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <div className="mx-auto max-w-5xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="font-display text-2xl font-bold">Biblioteca de itens</h1><Button onClick={() => setEditing("new")}><Plus className="size-4" />Novo item</Button></div>
    <div className="mt-6 flex flex-wrap gap-2"><Input className="min-w-0 flex-1" aria-label="Buscar item" placeholder="Buscar item" value={search} onChange={(e) => setSearch(e.target.value)} /><Button variant={showArchived ? "secondary" : "outline"} onClick={() => setShowArchived(!showArchived)}><Archive className="size-4" />{showArchived ? "Ver ativos" : "Arquivados"}</Button></div>
    <div className="mt-4 divide-y border">
      {isLoading && <p className="p-6 text-muted-foreground">Carregando…</p>}
      {error && <div className="p-6"><p className="text-destructive">Não foi possível carregar a biblioteca.</p><Button onClick={() => refetch()}>Tentar novamente</Button></div>}
      {!isLoading && !error && !list.length && <p className="p-8 text-center text-muted-foreground">{showArchived ? "Nenhum item arquivado." : "Nenhum item encontrado."}</p>}
      {list.map((item) => <div key={item.id} className="flex items-center gap-3 p-3">
        <MediaImage path={item.image} alt={item.name} className="size-14 shrink-0 object-cover" fallback={<Monogram name={item.name} className="size-14 shrink-0" />} />
        <div className="min-w-0 flex-1 break-words"><h2 className="font-display font-semibold">{item.name}</h2><p className="line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">{item.description}</p></div>
        <Button size="icon" variant="ghost" title={`Editar ${item.name}`} aria-label={`Editar ${item.name}`} onClick={() => setEditing(item)}><Pencil className="size-4" /></Button>
        <Button size="icon" variant="ghost" title={item.archived ? `Restaurar ${item.name}` : `Arquivar ${item.name}`} aria-label={item.archived ? `Restaurar ${item.name}` : `Arquivar ${item.name}`} disabled={busy} onClick={() => item.archived ? archive(item) : setArchiving(item)}>{item.archived ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}</Button>
      </div>)}
    </div>
    {editing && <ItemEditor item={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} onSaved={refresh} />}
    <AlertDialog open={!!archiving} onOpenChange={(open) => !open && !busy && setArchiving(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Arquivar {archiving?.name}?</AlertDialogTitle><AlertDialogDescription>O item deixa de aparecer na seleção, mas permanece nos personagens que já o utilizam. Você poderá restaurá-lo depois.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); if (archiving) void archive(archiving); }}>{busy ? "Arquivando…" : "Arquivar"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function ItemEditor({ item, onClose, onSaved }: { item?: LibraryItem; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [photo, setPhoto] = useState<Img>(img(item?.image ?? null));
  const [busy, setBusy] = useState(false);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { toast.error("O nome do item é obrigatório."); return; }
    setBusy(true);
    let uploaded: string | null = null;
    let persisted = false;
    try {
      if (photo.file) uploaded = await uploadImage(photo.file, "item-library");
      const row = { name: name.trim(), description: description.trim(), image: uploaded ?? photo.path, updated_at: new Date().toISOString() };
      const result = item ? await supabase.from("item_library").update(row).eq("id", item.id).select("id").single() : await supabase.from("item_library").insert(row).select("id").single();
      if (result.error) throw result.error;
      persisted = true;
      await onSaved();
      toast.success(item ? "Item atualizado em todos os personagens." : "Item criado.");
      onClose();
    } catch (error) {
      if (uploaded && !persisted) await removeImages([uploaded]);
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o item.");
    } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => !open && !busy && onClose()}><DialogContent><DialogHeader><DialogTitle>{item ? "Editar item" : "Novo item"}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4">
    <ItemPhoto value={photo} onChange={(value) => setPhoto(value ?? img(null))} />
    <div className="space-y-1.5"><Label htmlFor="item-name">Nome do item *</Label><Input id="item-name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
    <div className="space-y-1.5"><Label htmlFor="item-description">Descrição</Label><Textarea id="item-description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
    <div className="flex justify-end gap-2"><Button type="button" variant="ghost" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar item"}</Button></div>
  </form></DialogContent></Dialog>;
}