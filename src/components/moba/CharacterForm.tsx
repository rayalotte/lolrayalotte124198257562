import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ImagePlus, Trash2, Plus, RefreshCw, Crop } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  ABILITY_FIELDS, DIFFICULTY_OPTIONS, SLOTS, SLOT_LABEL, STAT_KEYS, charactersQuery, removeImages, slugify, uploadImage, validateImage,
  type Ability, type Character, type Counter, type CustomStat, type Item, type Slot,
} from "@/lib/moba";
import { MediaImage } from "./MediaImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/* ---------- image picker ---------- */
type Img = { path: string | null; file: File | null; preview: string | null };
const img = (path: string | null): Img => ({ path, file: null, preview: null });

function ImageField({ label, value, onChange, aspect, hint }: { label: string; value: Img; onChange: (v: Img) => void; aspect: string; hint?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const has = value.preview || value.path;
  const pick = (f?: File) => {
    if (!f) return;
    const e = validateImage(f);
    if (e) { setErr(e); return; }
    setErr(null);
    onChange({ ...value, file: f, preview: URL.createObjectURL(f) });
  };
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <div className={cn("relative overflow-hidden border border-dashed bg-panel-raised", aspect)}>
        {value.preview ? <img src={value.preview} alt="" className="size-full object-contain" />
          : value.path ? <MediaImage path={value.path} alt="" className="size-full object-contain" />
          : <button type="button" onClick={() => ref.current?.click()} className="flex size-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary"><ImagePlus className="size-6" />Selecionar imagem</button>}
        {value.file && <span className="absolute left-1 top-1 bg-primary px-1.5 text-[10px] text-primary-foreground">não salva</span>}
      </div>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      {has && (
        <div className="mt-1.5 flex gap-1">
          <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.click()}><RefreshCw className="size-3" />Trocar</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ path: null, file: null, preview: null })}><Trash2 className="size-3" />Remover</Button>
        </div>
      )}
      {hint && !err && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
    </div>
  );
}

/* ---------- small inputs ---------- */
function Field({ label, children, error }: { label: string; children: ReactNode; error?: string | undefined }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>;
}
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

type AbForm = Omit<Ability, "icon_url" | "slot"> & { slot: Slot; icon: Img };
const emptyAb = (slot: Slot): AbForm => ({ slot, name: "", description: "", target: "", damage: "", range: "", duration: "", cooldown: "", cost: "", effects: "", notes: "", icon: img(null) });

export function CharacterForm({ initial, abilities = [], counters = [] }: { initial?: Character; abilities?: Ability[]; counters?: Counter[] }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: all } = useQuery(charactersQuery);
  const others = (all ?? []).filter((c) => c.id !== initial?.id);

  const [f, setF] = useState({
    name: initial?.name ?? "", title: initial?.title ?? "", short_description: initial?.short_description ?? "",
    biography: initial?.biography ?? "", role: initial?.role ?? "", lanes: (initial?.lanes ?? []).join(", "),
    tags: (initial?.tags ?? []).join(", "), notes: initial?.notes ?? "", changelog: initial?.changelog ?? "",
  });
  const [portrait, setPortrait] = useState(img(initial?.portrait_url ?? null));
  const [art, setArt] = useState(img(initial?.art_url ?? null));
  const [gallery, setGallery] = useState<Img[]>((initial?.gallery ?? []).map(img));
  const [stats, setStats] = useState<Record<string, string>>(initial?.stats ?? {});
  const [custom, setCustom] = useState<CustomStat[]>(initial?.custom_stats ?? []);
  const [items, setItems] = useState<Item[]>(initial?.items ?? []);
  const [difficulty, setDifficulty] = useState<number | null>(initial?.difficulty ?? null);
  const [abs, setAbs] = useState<AbForm[]>(SLOTS.map((s) => {
    const a = abilities.find((x) => x.slot === s);
    if (!a) return emptyAb(s);
    return { ...emptyAb(s), ...Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v ?? ""])), slot: s, icon: img(a.icon_url) } as AbForm;
  }));
  const [ctr, setCtr] = useState<{ target_id: string; kind: "strong" | "weak"; note: string }[]>(counters.map((c) => ({ target_id: c.target_id, kind: c.kind, note: c.note ?? "" })));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("basic");
  const [slot, setSlot] = useState<Slot>("P");

  useEffect(() => () => { [portrait, art, ...gallery, ...abs.map((a) => a.icon)].forEach((i) => i.preview && URL.revokeObjectURL(i.preview)); }, []); // eslint-disable-line

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setAb = (s: Slot, patch: Partial<AbForm>) => setAbs((p) => p.map((a) => (a.slot === s ? { ...a, ...patch } : a)));

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs["name"] = "O nome é obrigatório.";
    setErrors(errs);
    if (Object.keys(errs).length) { setTab("basic"); toast.error("Corrija os campos destacados."); return; }
    setSaving(true);
    const newlyUploaded: string[] = [];
    const resolve = async (i: Img, folder: string) => {
      if (!i.file) return i.path;
      const p = await uploadImage(i.file, folder);
      newlyUploaded.push(p);
      return p;
    };
    try {
      let slug = initial?.slug ?? slugify(f.name);
      if (!initial) {
        const taken = new Set((all ?? []).map((c) => c.slug));
        let n = 2; const base = slug;
        while (taken.has(slug)) slug = `${base}-${n++}`;
      }
      const folder = `characters/${slug}`;
      const portraitPath = await resolve(portrait, folder);
      const artPath = await resolve(art, folder);
      const galleryPaths = (await Promise.all(gallery.map((g) => resolve(g, folder)))).filter((x): x is string => !!x);
      const abilityIcons = await Promise.all(abs.map((a) => resolve(a.icon, `${folder}/abilities`)));

      const row = {
        slug, name: f.name.trim(), title: f.title || null, short_description: f.short_description || null,
        biography: f.biography || null, role: f.role.trim() || null, lanes: csv(f.lanes), tags: csv(f.tags),
        notes: f.notes || null, changelog: f.changelog || null, portrait_url: portraitPath, art_url: artPath,
        gallery: galleryPaths, stats: Object.fromEntries(Object.entries(stats).filter(([, v]) => v?.trim())),
        custom_stats: custom.filter((c) => c.label.trim()), items: items.filter((i) => i.name.trim()),
        difficulty,
        updated_at: new Date().toISOString(),
      };
      const res = initial
        ? await supabase.from("characters").update(row).eq("id", initial.id).select("id").single()
        : await supabase.from("characters").insert(row).select("id").single();
      if (res.error) throw new Error(res.error.message);
      const id = res.data.id;

      // abilities
      const keep = abs.map((a, i) => ({ a, icon: abilityIcons[i] })).filter(({ a, icon }) =>
        icon || a.name || a.description || ABILITY_FIELDS.some(([k]) => a[k]) || a.effects || a.notes);
      const drop = SLOTS.filter((s) => !keep.some((k) => k.a.slot === s));
      if (drop.length) {
        const d = await supabase.from("abilities").delete().eq("character_id", id).in("slot", drop);
        if (d.error) throw new Error(d.error.message);
      }
      if (keep.length) {
        const u = await supabase.from("abilities").upsert(keep.map(({ a, icon }) => ({
          character_id: id, slot: a.slot, name: a.name || null, icon_url: icon ?? null, description: a.description || null,
          target: a.target || null, damage: a.damage || null, range: a.range || null, duration: a.duration || null,
          cooldown: a.cooldown || null, cost: a.cost || null, effects: a.effects || null, notes: a.notes || null,
        })), { onConflict: "character_id,slot" });
        if (u.error) throw new Error(u.error.message);
      }
      // counters
      const d2 = await supabase.from("counters").delete().eq("character_id", id);
      if (d2.error) throw new Error(d2.error.message);
      const valid = ctr.filter((c) => c.target_id);
      const dedup = Array.from(new Map(valid.map((c) => [c.target_id + c.kind, c])).values());
      if (dedup.length) {
        const i2 = await supabase.from("counters").insert(dedup.map((c) => ({ character_id: id, target_id: c.target_id, kind: c.kind, note: c.note || null })));
        if (i2.error) throw new Error(i2.error.message);
      }

      // clean replaced/removed files (each upload has a unique path, never shared)
      const before = [initial?.portrait_url, initial?.art_url, ...(initial?.gallery ?? []), ...abilities.map((a) => a.icon_url)];
      const after = new Set([portraitPath, artPath, ...galleryPaths, ...abilityIcons]);
      await removeImages(before.filter((p) => p && !after.has(p)));

      await Promise.all([qc.invalidateQueries({ queryKey: ["characters"] }), qc.invalidateQueries({ queryKey: ["character-detail", id] })]);
      toast.success(initial ? "Alterações salvas." : "Personagem criado.");
      navigate({ to: "/admin" });
    } catch (e) {
      await removeImages(newlyUploaded);
      toast.error(e instanceof Error ? e.message : "Erro ao salvar. Seus dados continuam no formulário.");
    } finally {
      setSaving(false);
    }
  };

  const ab = abs.find((a) => a.slot === slot)!;

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">{initial ? `Editar ${initial.name}` : "Novo personagem"}</h1>
        <Button variant="ghost" onClick={() => navigate({ to: "/admin" })}>Cancelar</Button>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="images">Imagens</TabsTrigger>
          <TabsTrigger value="stats">Atributos</TabsTrigger>
          <TabsTrigger value="abilities">Habilidades</TabsTrigger>
          <TabsTrigger value="extra">Complementar</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome *" error={errors["name"]}><Input value={f.name} onChange={set("name")} aria-invalid={!!errors["name"]} /></Field>
            <Field label="Título / apelido"><Input value={f.title} onChange={set("title")} /></Field>
            <Field label="Função principal"><Input value={f.role} onChange={set("role")} placeholder="ex.: Assassino" /></Field>
            <Field label="Rotas (separe por vírgula)"><Input value={f.lanes} onChange={set("lanes")} placeholder="ex.: Topo, Selva" /></Field>
          </div>
          <Field label="Dificuldade">
            <div className="flex flex-wrap items-center gap-2">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button key={d.value} type="button" onClick={() => setDifficulty((p) => (p === d.value ? null : d.value))}
                  className={cn("border px-4 py-2 font-display text-sm transition-colors", difficulty === d.value ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/60")}>
                  {d.label}
                </button>
              ))}
              {difficulty != null && <Button type="button" variant="ghost" size="sm" onClick={() => setDifficulty(null)}>Limpar</Button>}
            </div>
          </Field>
          <Field label="Tags (separe por vírgula)"><Input value={f.tags} onChange={set("tags")} /></Field>
          <Field label="Descrição curta"><Textarea rows={3} value={f.short_description} onChange={set("short_description")} /></Field>
          <Field label="Biografia / história"><Textarea rows={7} value={f.biography} onChange={set("biography")} /></Field>
          <Field label="Observações"><Textarea rows={3} value={f.notes} onChange={set("notes")} /></Field>
        </TabsContent>

        <TabsContent value="images" className="mt-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
            <ImageField label="Retrato (seleção)" value={portrait} onChange={setPortrait} aspect="aspect-square" hint="Quadrado, rosto centralizado." />
            <ImageField label="Arte principal" value={art} onChange={setArt} aspect="aspect-video" hint="Exibida inteira, sem cortes. PNG transparente fica ótimo." />
          </div>
          <div>
            <Label className="mb-2 block">Imagens adicionais</Label>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {gallery.map((g, i) => (
                <ImageField key={i} label={`#${i + 1}`} value={g} aspect="aspect-video"
                  onChange={(v) => setGallery((p) => (v.path || v.file ? p.map((x, j) => (j === i ? v : x)) : p.filter((_, j) => j !== i)))} />
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setGallery((p) => [...p, img(null)])}><Plus className="size-3" />Adicionar espaço</Button>
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG ou WebP até 8 MB. As imagens são enviadas ao salvar.</p>
        </TabsContent>

        <TabsContent value="stats" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {STAT_KEYS.map(([k, l]) => <Field key={k} label={l}><Input value={stats[k] ?? ""} onChange={(e) => setStats((p) => ({ ...p, [k]: e.target.value }))} /></Field>)}
          </div>
          <div>
            <Label className="mb-2 block">Atributos personalizados</Label>
            <div className="space-y-2">
              {custom.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Nome" value={c.label} onChange={(e) => setCustom((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <Input placeholder="Valor" value={c.value} onChange={(e) => setCustom((p) => p.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setCustom((p) => p.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setCustom((p) => [...p, { label: "", value: "" }])}><Plus className="size-3" />Adicionar atributo</Button>
          </div>
        </TabsContent>

        <TabsContent value="abilities" className="mt-6">
          <div className="mb-4 flex gap-2">
            {SLOTS.map((s) => {
              const a = abs.find((x) => x.slot === s)!;
              const filled = a.name || a.description || a.icon.path || a.icon.file;
              return (
                <button key={s} type="button" onClick={() => setSlot(s)}
                  className={cn("border px-4 py-2 font-display text-sm transition-colors", slot === s ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/60", filled && slot !== s && "text-primary")}>
                  {SLOT_LABEL[s]}
                </button>
              );
            })}
          </div>
          <div key={slot} className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <ImageField label="Ícone" value={ab.icon} onChange={(v) => setAb(slot, { icon: v })} aspect="aspect-square" />
            <div className="space-y-4">
              <Field label="Nome da habilidade"><Input value={ab.name ?? ""} onChange={(e) => setAb(slot, { name: e.target.value })} /></Field>
              <Field label="Descrição completa"><Textarea rows={4} value={ab.description ?? ""} onChange={(e) => setAb(slot, { description: e.target.value })} /></Field>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-5">
            {ABILITY_FIELDS.map(([k, l]) => <Field key={k} label={l}><Input value={ab[k] ?? ""} onChange={(e) => setAb(slot, { [k]: e.target.value })} /></Field>)}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Efeitos adicionais"><Textarea rows={3} value={ab.effects ?? ""} onChange={(e) => setAb(slot, { effects: e.target.value })} /></Field>
            <Field label="Observações"><Textarea rows={3} value={ab.notes ?? ""} onChange={(e) => setAb(slot, { notes: e.target.value })} /></Field>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Campos vazios não aparecem na página pública. Uma habilidade totalmente vazia não é salva.</p>
        </TabsContent>

        <TabsContent value="extra" className="mt-6 space-y-8">
          <div>
            <Label className="mb-2 block">Itens recomendados</Label>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Item" value={it.name} onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <Input placeholder="Observação" value={it.note ?? ""} onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setItems((p) => p.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setItems((p) => [...p, { name: "", note: "" }])}><Plus className="size-3" />Adicionar item</Button>
          </div>
          <div>
            <Label className="mb-2 block">Counters</Label>
            {!others.length && <p className="text-sm text-muted-foreground">Cadastre outros personagens para definir counters.</p>}
            <div className="space-y-2">
              {ctr.map((c, i) => (
                <div key={i} className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <select value={c.kind} onChange={(e) => setCtr((p) => p.map((x, j) => (j === i ? { ...x, kind: e.target.value as "strong" | "weak" } : x)))} className="h-9 border bg-background px-2 text-sm">
                    <option value="strong">Forte contra</option>
                    <option value="weak">Fraco contra</option>
                  </select>
                  <select value={c.target_id} onChange={(e) => setCtr((p) => p.map((x, j) => (j === i ? { ...x, target_id: e.target.value } : x)))} className="h-9 flex-1 border bg-background px-2 text-sm">
                    <option value="">Escolha um herói</option>
                    {others.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                  <Input placeholder="Motivo (opcional)" value={c.note} onChange={(e) => setCtr((p) => p.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setCtr((p) => p.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </div>
            {others.length > 0 && <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setCtr((p) => [...p, { target_id: "", kind: "strong", note: "" }])}><Plus className="size-3" />Adicionar counter</Button>}
          </div>
          <Field label="Histórico de alterações / informações adicionais"><Textarea rows={5} value={f.changelog} onChange={set("changelog")} /></Field>
        </TabsContent>
      </Tabs>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate({ to: "/admin" })} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar personagem"}</Button>
        </div>
      </div>
    </div>
  );
}
