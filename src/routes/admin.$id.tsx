import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CharacterForm } from "@/components/moba/CharacterForm";
import { characterDetailQuery, charactersQuery } from "@/lib/moba";

export const Route = createFileRoute("/admin/$id")({ component: EditPage });

function EditPage() {
  const { id } = Route.useParams();
  const chars = useQuery(charactersQuery);
  const detail = useQuery({ ...characterDetailQuery(id), staleTime: 0 });
  if (chars.isLoading || detail.isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  const c = chars.data?.find((x) => x.id === id);
  if (!c) return <div className="text-muted-foreground">Personagem não encontrado.</div>;
  return <CharacterForm key={id} initial={c} abilities={detail.data?.abilities ?? []} counters={detail.data?.counters ?? []} />;
}
