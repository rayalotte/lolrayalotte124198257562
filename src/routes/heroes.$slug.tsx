import { createFileRoute } from "@tanstack/react-router";
import { Encyclopedia } from "@/components/moba/Encyclopedia";

export const Route = createFileRoute("/heroes/$slug")({
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    return {
      meta: [
        { title: `${name} — Codex Arena` },
        { name: "description", content: `Habilidades, atributos e história de ${name} no Codex Arena.` },
        { property: "og:title", content: `${name} — Codex Arena` },
        { property: "og:description", content: `Habilidades, atributos e história de ${name}.` },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: HeroPage,
});

function HeroPage() {
  const { slug } = Route.useParams();
  return <Encyclopedia slug={slug} />;
}
