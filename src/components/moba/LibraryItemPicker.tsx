import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { itemLibraryQuery } from "@/lib/item-library";
import type { LibraryItem } from "@/lib/item-references";
import type { ItemKind } from "@/lib/moba";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaImage, Monogram } from "./MediaImage";

export function LibraryItemPicker({ kind, selectedIds, onClose, onSelect }: { kind: ItemKind; selectedIds: string[]; onClose: () => void; onSelect: (item: LibraryItem) => void }) {
  const { data, isLoading, error, refetch } = useQuery(itemLibraryQuery);
  const [search, setSearch] = useState("");
  const list = (data ?? []).filter((item) => !item.archived && item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{kind === "fundamental" ? "Itens fundamentais" : "Itens situacionais"} — biblioteca</DialogTitle></DialogHeader>
    <Input aria-label="Buscar item na biblioteca" placeholder="Buscar item" value={search} onChange={(e) => setSearch(e.target.value)} />
    {isLoading && <p className="text-muted-foreground">Carregando…</p>}
    {error && <div><p className="text-destructive">Não foi possível carregar os itens.</p><Button onClick={() => refetch()}>Tentar novamente</Button></div>}
    {!isLoading && !error && !list.length && <p className="text-muted-foreground">Nenhum item encontrado.</p>}
    <div className="space-y-2">{list.map((item) => <Button key={item.id} variant="outline" className="h-auto w-full justify-start whitespace-normal p-3 text-left" disabled={selectedIds.includes(item.id)} onClick={() => onSelect(item)}>
      <MediaImage path={item.image} alt={item.name} className="size-12 shrink-0 object-cover" fallback={<Monogram name={item.name} className="size-12 shrink-0" />} /><span className="min-w-0 break-words">{item.name}{selectedIds.includes(item.id) && <span className="ml-2 text-muted-foreground">Adicionado</span>}</span>
    </Button>)}</div>
    <Button asChild variant="ghost"><Link to="/admin/items">Gerenciar biblioteca</Link></Button>
  </DialogContent></Dialog>;
}