import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, X, Shield } from "lucide-react";
import { charactersQuery, type Character } from "@/lib/moba";
import { MediaImage, Monogram } from "./MediaImage";
import { CharacterView } from "./CharacterView";
import { cn } from "@/lib/utils";
import { DEFAULT_HERO_ORDER, groupHeroes, type HeroOrder } from "@/lib/hero-order";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ATTACK_TYPES, DAMAGE_TYPES, matchesClassification } from "@/lib/hero-classification";
import { ClassificationPicker } from "./ClassificationPicker";
import { Button } from "@/components/ui/button";

function uniq(list: string[]) {
  return Array.from(new Set(list.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function Encyclopedia({ slug }: { slug?: string }) {
  const { data: chars, isLoading, error } = useQuery(charactersQuery);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [lane, setLane] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [order, setOrder] = useState<HeroOrder>(DEFAULT_HERO_ORDER);
  const [attackTypes, setAttackTypes] = useState<string[]>([]);
  const [damageTypes, setDamageTypes] = useState<string[]>([]);

  const all = chars ?? [];
  const roles = useMemo(() => uniq(all.map((c) => c.role ?? "")), [all]);
  const lanes = useMemo(() => uniq(all.flatMap((c) => c.lanes)), [all]);
  const tags = useMemo(() => uniq(all.flatMap((c) => c.tags)), [all]);

  const filtered = all.filter(
    (c) =>
      (!q || c.name.toLowerCase().includes(q.toLowerCase())) &&
      (!role || c.role === role) &&
      (!lane || c.lanes.includes(lane)) &&
      (!tag || c.tags.includes(tag)) &&
      matchesClassification(c, attackTypes, damageTypes),
  );
  const selected: Character | undefined = slug ? all.find((c) => c.slug === slug) : all[0];
  const anyFilter = q || role || lane || tag || attackTypes.length || damageTypes.length;
  const groups = groupHeroes(filtered, order);

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <aside className="flex w-full shrink-0 flex-col border-b bg-panel lg:w-[340px] lg:border-b-0 lg:border-r">
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
          <FilterRow label="Função" options={roles} value={role} onChange={setRole} />
          <FilterRow label="Rota" options={lanes} value={lane} onChange={setLane} />
          <FilterRow label="Tags" options={tags} value={tag} onChange={setTag} />
          <ClassificationPicker label="Tipo de ataque" options={ATTACK_TYPES} values={attackTypes} onChange={setAttackTypes} />
          <ClassificationPicker label="Tipo de dano" options={DAMAGE_TYPES} values={damageTypes} onChange={setDamageTypes} />
          {anyFilter && (
            <Button variant="ghost" size="sm"
              onClick={() => { setQ(""); setRole(null); setLane(null); setTag(null); setAttackTypes([]); setDamageTypes([]); }}
              className="label-caps h-auto justify-start px-0 hover:text-primary"
            >
              <X className="size-3" /> Limpar filtros
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between border-t px-5 py-2">
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
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-4">
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
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-4">
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

function FilterRow({ label, options, value, onChange }: { label: string; options: string[]; value: string | null; onChange: (v: string | null) => void }) {
  if (!options.length) return null;
  return (
    <div>
      <div className="label-caps mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(value === o ? null : o)}
            className={cn(
              "border px-2 py-0.5 text-xs transition-colors",
              value === o ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary/60 hover:text-foreground",
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
