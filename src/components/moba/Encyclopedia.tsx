import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { Search, X, Shield } from "lucide-react";
import { charactersQuery, POWER_SPIKE_OPTIONS, type Character } from "@/lib/moba";
import { MediaImage, Monogram } from "./MediaImage";
import { CharacterView } from "./CharacterView";
import { cn } from "@/lib/utils";
import { DEFAULT_HERO_ORDER, groupHeroes, type HeroOrder } from "@/lib/hero-order";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { matchesClassification } from "@/lib/hero-classification";
import { Button } from "@/components/ui/button";

function uniq(list: string[]) {
  return Array.from(new Set(list.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function useStoredSize(key: string, initial: number) {
  const [size, setSize] = useState(initial);
  useEffect(() => {
    const v = Number(localStorage.getItem(key));
    if (v > 0) setSize(v);
  }, [key]);
  useEffect(() => { localStorage.setItem(key, String(size)); }, [key, size]);
  return [size, setSize] as const;
}

function DragHandle({ axis, onDrag, label }: { axis: "x" | "y"; onDrag: (delta: number) => void; label: string }) {
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    let last = axis === "x" ? e.clientX : e.clientY;
    const move = (ev: PointerEvent) => {
      const cur = axis === "x" ? ev.clientX : ev.clientY;
      onDrag(cur - last);
      last = cur;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      onPointerDown={start}
      className={cn(
        "group hidden shrink-0 items-center justify-center bg-border transition-colors hover:bg-primary lg:flex",
        axis === "x" ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize",
      )}
    >
      <span className={cn("bg-muted-foreground/60 group-hover:bg-primary-foreground", axis === "x" ? "h-8 w-px" : "h-px w-8")} />
    </div>
  );
}

export function Encyclopedia({ slug }: { slug?: string }) {
  const [sidebarW, setSidebarW] = useStoredSize("codex-sidebar-w2", 360);
  const [filtersH, setFiltersH] = useStoredSize("codex-filters-h2", 0);
  const filtersRef = useRef<HTMLDivElement>(null);
  const { data: chars, isLoading, error } = useQuery(charactersQuery);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string[]>([]);
  const [lane, setLane] = useState<string[]>([]);
  const [tag, setTag] = useState<string[]>([]);
  const [order, setOrder] = useState<HeroOrder>(DEFAULT_HERO_ORDER);
  const [attackTypes, setAttackTypes] = useState<string[]>([]);
  const [damageTypes, setDamageTypes] = useState<string[]>([]);
  const [powerSpike, setPowerSpike] = useState<string[]>([]);

  const all = chars ?? [];
  const roles = useMemo(() => uniq(all.map((c) => c.role ?? "")), [all]);
  const lanes = useMemo(() => uniq(all.flatMap((c) => c.lanes)), [all]);
  const tags = useMemo(() => uniq(all.flatMap((c) => c.tags)), [all]);
  const attackOptions = useMemo(() => uniq(all.flatMap((c) => c.attack_types ?? [])), [all]);
  const damageOptions = useMemo(() => uniq(all.flatMap((c) => c.damage_types ?? [])), [all]);

  const filtered = all.filter(
    (c) =>
      (!q || c.name.toLowerCase().includes(q.toLowerCase())) &&
      (!role.length || role.includes(c.role ?? "")) &&
      (!lane.length || lane.every((l) => c.lanes.includes(l))) &&
      (!tag.length || tag.every((t) => c.tags.includes(t))) &&
      (!powerSpike.length || powerSpike.every((p) => (c.power_spikes ?? []).includes(p))) &&
      matchesClassification(c, attackTypes, damageTypes),
  );
  const selected: Character | undefined = slug ? all.find((c) => c.slug === slug) : all[0];
  const anyFilter = Boolean(q || role.length || lane.length || tag.length || attackTypes.length || damageTypes.length || powerSpike.length);
  const groups = groupHeroes(filtered, order);

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <aside
        className="flex w-full shrink-0 flex-col border-b bg-panel lg:w-[var(--sw)] lg:border-b-0"
        style={{ "--sw": `${sidebarW}px` } as React.CSSProperties}
      >
        <div ref={filtersRef} className={cn("shrink-0", filtersH > 0 && "lg:h-[var(--fh)] lg:overflow-y-auto")} style={{ "--fh": `${filtersH}px` } as React.CSSProperties}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <Link to="/" className="font-display text-lg font-bold tracking-[0.25em] text-foreground">
            CODEX<span className="text-primary">·</span>ARENA
          </Link>
          <Link to="/admin" className="text-muted-foreground transition-colors hover:text-primary" aria-label="Administração">
            <Shield className="size-4" />
          </Link>
        </div>
        <div className="space-y-3 px-5 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar herói"
              className="h-10 w-full border bg-background/60 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <FilterRow label="Função" options={roles} values={role} onChange={setRole} single />
          <FilterRow label="Rota" options={lanes} values={lane} onChange={setLane} single />
          <FilterRow label="Tags" options={tags} values={tag} onChange={setTag} single />
          <FilterRow label="Tipo de ataque" options={attackOptions} values={attackTypes} onChange={setAttackTypes} />
          <FilterRow label="Tipo de dano" options={damageOptions} values={damageTypes} onChange={setDamageTypes} />
          <FilterRow label="Pico de poder" options={[...POWER_SPIKE_OPTIONS]} values={powerSpike} onChange={setPowerSpike} />
          {anyFilter && (
            <Button variant="ghost" size="sm"
              onClick={() => { setQ(""); setRole([]); setLane([]); setTag([]); setAttackTypes([]); setDamageTypes([]); setPowerSpike([]); }}
              className="label-caps h-auto justify-start px-0 hover:text-primary"
            >
              <X className="size-3" /> Limpar filtros
            </Button>
          )}
        </div>
        </div>
        <DragHandle axis="y" label="Redimensionar filtros" onDrag={(d) => setFiltersH((h) => Math.min(Math.max((h || filtersRef.current?.offsetHeight || 300) + d, 120), window.innerHeight - 160))} />
        <div className="flex items-center justify-between border-t px-5 py-2 lg:border-t-0">
          <span className="label-caps">Heróis</span>
          <span className="label-caps">{filtered.length}/{all.length}</span>
        </div>
        <div className="px-5 pb-3">
          <label htmlFor="hero-order" className="label-caps mb-1.5 block">Organizar por</label>
          <Select value={order} onValueChange={(value) => {
            if (value === "alphabetical" || value === "lane" || value === "role") setOrder(value);
          }}>
            <SelectTrigger id="hero-order" aria-label="Organizar heróis por"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alphabetical">Ordem alfabética</SelectItem>
              <SelectItem value="lane">Rota</SelectItem>
              <SelectItem value="role">Função</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="max-h-[42vh] overflow-y-auto px-5 pb-5 pt-1 lg:max-h-none lg:flex-1">
          {isLoading && (
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-[repeat(auto-fill,69px)]">
              {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-square animate-pulse bg-muted" />)}
            </div>
          )}
          {error && <p className="text-sm text-destructive">Não foi possível carregar os heróis.</p>}
          {!isLoading && all.length > 0 && filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum herói corresponde aos filtros.</p>
          )}
          {groups.map((group) => (
          <section key={group.label ?? "all"} className="mb-4 last:mb-0">
            {group.label && <h2 className="label-caps mb-2 text-foreground">{group.label}</h2>}
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-[repeat(auto-fill,69px)]">
            {group.heroes.map((c) => {
              const active = selected?.id === c.id;
              return (
                <Link
                  key={c.id}
                  to="/heroes/$slug"
                  params={{ slug: c.slug }}
                  title={c.name}
                  className={cn(
                    "group relative aspect-square overflow-hidden border bg-panel-raised transition-all",
                    active ? "shadow-glow border-primary" : "hover:border-primary/60",
                  )}
                >
                  <MediaImage
                    path={c.portrait_url}
                    alt={c.name}
                    className={cn("size-full object-cover transition-all duration-300", active ? "" : "grayscale-[45%] group-hover:grayscale-0 group-hover:scale-105")}
                    fallback={<Monogram name={c.name} className="size-full text-sm" />}
                  />
                  <span className={cn(
                    "absolute inset-x-0 bottom-0 truncate bg-background/85 px-1 py-0.5 text-center font-display text-[10px] uppercase tracking-wider transition-opacity",
                    active ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100",
                  )}>
                    {c.name}
                  </span>
                </Link>
              );
            })}
          </div>
          </section>
          ))}
        </div>
      </aside>
      <DragHandle axis="x" label="Redimensionar painel lateral" onDrag={(d) => setSidebarW((w) => Math.min(Math.max(w + d, 240), Math.min(760, window.innerWidth - 400)))} />

      <main className="relative flex-1 lg:overflow-y-auto">
        {isLoading ? (
          <div className="bg-stage min-h-[60vh] lg:h-full" />
        ) : all.length === 0 ? (
          <EmptyState />
        ) : !selected ? (
          <div className="bg-stage flex min-h-[60vh] items-center justify-center lg:h-full">
            <p className="text-muted-foreground">Herói não encontrado.</p>
          </div>
        ) : (
          <CharacterView key={selected.id} character={selected} all={all} />
        )}
      </main>
    </div>
  );
}

function FilterRow({ label, options, values, onChange, single }: { label: string; options: string[]; values: string[]; onChange: (v: string[]) => void; single?: boolean }) {
  if (!options.length) return null;
  const toggle = (o: string) => {
    if (single) onChange(values.includes(o) ? [] : [o]);
    else onChange(values.includes(o) ? values.filter((v) => v !== o) : [...values, o]);
  };
  return (
    <div>
      <div className="label-caps mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => toggle(o)}
            className={cn(
              "border px-2 py-0.5 text-xs transition-colors",
              values.includes(o) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary/60 hover:text-foreground",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-stage scanlines flex min-h-[60vh] flex-col items-center justify-center px-6 text-center lg:h-full">
      <div className="label-caps mb-3 text-primary">Codex vazio</div>
      <h1 className="font-display text-3xl font-bold md:text-5xl">Nenhum herói registrado</h1>
      <p className="mt-3 max-w-md text-muted-foreground">Os arquivos da arena ainda estão em branco. Os heróis aparecerão aqui assim que forem cadastrados.</p>
      <Link to="/admin" className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
        Área do administrador
      </Link>
    </div>
  );
}
