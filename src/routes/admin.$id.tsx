import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CharacterForm } from "@/components/moba/CharacterForm";
import { characterDetailQuery, charactersQuery } from "@/lib/moba";

export const Route = createFileRoute("/admin/$id")({
  head: () => ({ meta: [
    { title: "Editar personagem — Codex Arena" },
    { name: "description", content: "Edite as informações de um personagem no Codex Arena." },
    { property: "og:title", content: "Editar personagem — Codex Arena" },
    { property: "og:description", content: "Edite as informações de um personagem no Codex Arena." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const chars = useQuery(charactersQuery);
  const detail = useQuery({ ...characterDetailQuery(id), staleTime: 0 });
  if (chars.isLoading || detail.isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  const c = chars.data?.find((x) => x.id === id);
  if (!c) return <div className="text-muted-foreground">Personagem não encontrado.</div>;
  return <CharacterForm key={id} initial={c} abilities={detail.data?.abilities ?? []} counters={detail.data?.counters ?? []} />;
}
