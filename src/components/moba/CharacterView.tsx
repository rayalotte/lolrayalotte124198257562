import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ABILITY_FIELDS, SLOTS, SLOT_LABEL, STAT_KEYS, characterDetailQuery,
  type Ability, type Character, type Slot,
} from "@/lib/moba";
import { MediaImage, Monogram } from "./MediaImage";
import { cn } from "@/lib/utils";

const TABS = ["Visão geral", "Habilidades", "Atributos", "Itens", "Counters", "História"] as const;
type Tab = (typeof TABS)[number];

export function CharacterView({ character: c, all }: { character: Character; all: Character[] }) {
  const [tab, setTab] = useState<Tab>("Visão geral");
  const { data, isLoading } = useQuery(characterDetailQuery(c.id));
  const abilities = data?.abilities ?? [];
  const [slot, setSlot] = useState<Slot | null>(null);

  const openAbility = (s: Slot) => { setSlot(s); setTab("Habilidades"); };

  return (
    <div className="animate-rise">
      <section className="bg-stage relative min-h-[62vh] overflow-hidden lg:min-h-[74vh]">
        <MediaImage
          key={c.art_url ?? "none"}
          path={c.art_url}
          alt={c.name}
          eager
          className="animate-art absolute inset-0 size-full object-contain object-right-bottom md:object-[85%_bottom]"
          fallback={
            <div className="scanlines absolute inset-0 flex items-center justify-end pr-[8%]">
              <span className="font-display text-[22vw] font-bold leading-none text-foreground/[0.04] lg:text-[16vw]">{c.name.slice(0, 2).toUpperCase()}</span>
            </div>
          }
        />
        <div className="bg-fade-left pointer-events-none absolute inset-0 hidden md:block" />
        <div className="bg-fade-bottom pointer-events-none absolute inset-0" />
        <div className="relative flex min-h-[62vh] flex-col justify-end gap-5 p-6 md:p-10 lg:min-h-[74vh]">
          <div className="max-w-xl">
            {c.role && <div className="label-caps mb-2 text-primary">{c.role}</div>}
            <h1 className="font-display text-5xl font-bold uppercase leading-[0.9] tracking-wide md:text-7xl">{c.name}</h1>
            {c.title && <p className="mt-2 font-display text-lg text-muted-foreground md:text-xl">{c.title}</p>}
            {(c.lanes.length > 0 || c.tags.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.lanes.map((l) => <span key={l} className="border border-primary/50 bg-background/60 px-2 py-0.5 text-xs text-primary">{l}</span>)}
                {c.tags.map((t) => <span key={t} className="border bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">{t}</span>)}
              </div>
            )}
            {c.short_description && <p className="mt-4 max-w-lg text-sm leading-relaxed text-foreground/85 md:text-base">{c.short_description}</p>}
          </div>
          <AbilityBar abilities={abilities} active={tab === "Habilidades" ? slot : null} onPick={openAbility} />
        </div>
      </section>

      <nav className="sticky top-0 z-10 flex overflow-x-auto border-y bg-background/95 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative shrink-0 px-4 py-3 font-display text-xs uppercase tracking-[0.15em] transition-colors md:px-6",
              tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
            {tab === t && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </nav>

      <section className="min-h-[40vh] p-6 md:p-10">
        <div key={tab} className="animate-rise mx-auto max-w-4xl">
          {tab === "Visão geral" && <Overview c={c} />}
          {tab === "Habilidades" && (isLoading ? <Loading /> : <AbilitiesTab abilities={abilities} slot={slot} setSlot={setSlot} />)}
          {tab === "Atributos" && <StatsTab c={c} />}
          {tab === "Itens" && <ItemsTab c={c} />}
          {tab === "Counters" && (isLoading ? <Loading /> : <CountersTab counters={data?.counters ?? []} all={all} />)}
          {tab === "História" && <LoreTab c={c} />}
        </div>
      </section>
    </div>
  );
}

function Loading() { return <div className="h-24 animate-pulse bg-muted" />; }
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">{children}</div>;
}
function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="label-caps mb-4 text-primary">{children}</h2>;
}

function AbilityBar({ abilities, active, onPick }: { abilities: Ability[]; active: Slot | null; onPick: (s: Slot) => void }) {
  return (
    <div className="flex gap-2">
      {SLOTS.map((s) => {
        const a = abilities.find((x) => x.slot === s);
        return (
          <button
            key={s}
            onClick={() => onPick(s)}
            title={a?.name ?? SLOT_LABEL[s]}
            className={cn(
              "clip-notch group relative size-14 overflow-hidden border bg-panel transition-all md:size-16",
              active === s ? "shadow-glow border-primary" : "hover:border-primary/60",
              s === "P" && "mr-2",
            )}
          >
            <MediaImage path={a?.icon_url} alt={a?.name ?? s} className="size-full object-cover" fallback={<Monogram name={a?.name ?? "—"} className="size-full text-xs" />} />
            <span className="absolute bottom-0 right-0 bg-background/90 px-1 font-display text-[10px] font-bold text-primary">{s === "P" ? "P" : s}</span>
          </button>
        );
      })}
    </div>
  );
}

function AbilitiesTab({ abilities, slot, setSlot }: { abilities: Ability[]; slot: Slot | null; setSlot: (s: Slot) => void }) {
  if (!abilities.length) return <Empty>Nenhuma habilidade cadastrada para este herói.</Empty>;
  const current = slot ?? abilities.find((a) => a.slot === "P")?.slot ?? abilities[0].slot;
  const a = abilities.find((x) => x.slot === current);
  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <div className="flex gap-2 md:flex-col">
        {SLOTS.map((s) => {
          const ab = abilities.find((x) => x.slot === s);
          return (
            <button key={s} onClick={() => setSlot(s)} className={cn("flex items-center gap-3 border px-3 py-2 text-left transition-colors md:w-52", current === s ? "border-primary bg-accent" : "hover:border-primary/50")}>
              <span className="font-display text-sm font-bold text-primary">{SLOT_LABEL[s]}</span>
              <span className="hidden truncate text-sm md:inline">{ab?.name || <span className="text-muted-foreground">—</span>}</span>
            </button>
          );
        })}
      </div>
      {!a ? (
        <Empty>Habilidade {SLOT_LABEL[current]} não cadastrada.</Empty>
      ) : (
        <div className="border bg-card p-5">
          <div className="flex gap-4">
            <MediaImage path={a.icon_url} alt={a.name ?? ""} className="clip-notch size-20 shrink-0 object-cover" fallback={<Monogram name={a.name ?? "?"} className="clip-notch size-20 shrink-0" />} />
            <div>
              <div className="label-caps text-primary">{SLOT_LABEL[a.slot]}</div>
              <h3 className="font-display text-2xl font-bold">{a.name || "Sem nome"}</h3>
            </div>
          </div>
          {a.description && <p className="mt-4 whitespace-pre-line leading-relaxed text-foreground/90">{a.description}</p>}
          {ABILITY_FIELDS.some(([k]) => a[k]) && (
            <dl className="mt-5 grid grid-cols-2 gap-px border bg-border sm:grid-cols-3">
              {ABILITY_FIELDS.filter(([k]) => a[k]).map(([k, label]) => (
                <div key={k} className="bg-card p-3">
                  <dt className="label-caps">{label}</dt>
                  <dd className="mt-1 font-display text-lg">{a[k]}</dd>
                </div>
              ))}
            </dl>
          )}
          {a.effects && <Block title="Efeitos adicionais" text={a.effects} />}
          {a.notes && <Block title="Observações" text={a.notes} />}
        </div>
      )}
    </div>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-5">
      <div className="label-caps mb-1">{title}</div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{text}</p>
    </div>
  );
}

function Overview({ c }: { c: Character }) {
  const rows = [["Nome", c.name], ["Título", c.title], ["Função", c.role], ["Rotas", c.lanes.join(", ")]].filter(([, v]) => v);
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_260px]">
      <div>
        <Heading>Resumo</Heading>
        {c.short_description ? <p className="whitespace-pre-line leading-relaxed">{c.short_description}</p> : <Empty>Sem descrição cadastrada.</Empty>}
        {c.gallery.length > 0 && (
          <div className="mt-8">
            <Heading>Galeria</Heading>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {c.gallery.map((p) => <MediaImage key={p} path={p} alt={c.name} className="aspect-video w-full border object-cover" />)}
            </div>
          </div>
        )}
      </div>
      <dl className="space-y-3 border-l pl-5">
        {rows.map(([k, v]) => (
          <div key={k}><dt className="label-caps">{k}</dt><dd className="mt-0.5">{v}</dd></div>
        ))}
      </dl>
    </div>
  );
}

function StatsTab({ c }: { c: Character }) {
  const base = STAT_KEYS.filter(([k]) => c.stats?.[k]);
  if (!base.length && !c.custom_stats.length) return <Empty>Nenhum atributo cadastrado.</Empty>;
  return (
    <div className="space-y-8">
      {base.length > 0 && (
        <div><Heading>Básicos</Heading>
          <dl className="grid grid-cols-2 gap-px border bg-border sm:grid-cols-3">
            {base.map(([k, l]) => <div key={k} className="bg-card p-4"><dt className="label-caps">{l}</dt><dd className="mt-1 font-display text-2xl">{c.stats[k]}</dd></div>)}
          </dl>
        </div>
      )}
      {c.custom_stats.length > 0 && (
        <div><Heading>Avançados</Heading>
          <dl className="divide-y border">
            {c.custom_stats.map((s, i) => <div key={i} className="flex justify-between px-4 py-2.5"><dt className="text-muted-foreground">{s.label}</dt><dd className="font-display">{s.value}</dd></div>)}
          </dl>
        </div>
      )}
    </div>
  );
}

function ItemsTab({ c }: { c: Character }) {
  if (!c.items.length) return <Empty>Nenhum item recomendado cadastrado.</Empty>;
  return (
    <ol className="space-y-2">
      {c.items.map((it, i) => (
        <li key={i} className="flex gap-4 border bg-card p-4">
          <span className="font-display text-xl text-primary">{String(i + 1).padStart(2, "0")}</span>
          <div><div className="font-display font-semibold">{it.name}</div>{it.note && <p className="text-sm text-muted-foreground">{it.note}</p>}</div>
        </li>
      ))}
    </ol>
  );
}

function CountersTab({ counters, all }: { counters: { target_id: string; kind: string; note: string | null }[]; all: Character[] }) {
  if (!counters.length) return <Empty>Nenhum counter cadastrado.</Empty>;
  const col = (kind: string, title: string) => {
    const list = counters.filter((x) => x.kind === kind);
    return (
      <div><Heading>{title}</Heading>
        {!list.length ? <Empty>Nenhum.</Empty> : (
          <ul className="space-y-2">
            {list.map((x) => {
              const t = all.find((c) => c.id === x.target_id);
              if (!t) return null;
              return (
                <li key={x.target_id}>
                  <Link to="/heroes/$slug" params={{ slug: t.slug }} className="flex items-center gap-3 border bg-card p-2 transition-colors hover:border-primary/60">
                    <MediaImage path={t.portrait_url} alt={t.name} className="size-12 object-cover" fallback={<Monogram name={t.name} className="size-12 text-xs" />} />
                    <div><div className="font-display font-semibold">{t.name}</div>{x.note && <p className="text-xs text-muted-foreground">{x.note}</p>}</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };
  return <div className="grid gap-8 md:grid-cols-2">{col("strong", "Forte contra")}{col("weak", "Fraco contra")}</div>;
}

function LoreTab({ c }: { c: Character }) {
  if (!c.biography && !c.notes && !c.changelog) return <Empty>Nenhuma história cadastrada.</Empty>;
  return (
    <div className="space-y-8">
      {c.biography && <div><Heading>Biografia</Heading><p className="whitespace-pre-line text-lg leading-relaxed text-foreground/90">{c.biography}</p></div>}
      {c.notes && <div><Heading>Observações</Heading><p className="whitespace-pre-line text-foreground/85">{c.notes}</p></div>}
      {c.changelog && <div><Heading>Histórico de alterações</Heading><p className="whitespace-pre-line text-sm text-muted-foreground">{c.changelog}</p></div>}
    </div>
  );
}
