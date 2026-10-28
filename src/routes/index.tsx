import { createFileRoute } from "@tanstack/react-router";
import { Encyclopedia } from "@/components/moba/Encyclopedia";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Codex Arena — Enciclopédia de Heróis" },
      { name: "description", content: "Explore os heróis da arena: habilidades, atributos, itens, counters e história." },
      { property: "og:title", content: "Codex Arena — Enciclopédia de Heróis" },
      { property: "og:description", content: "Explore os heróis da arena: habilidades, atributos, itens, counters e história." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Encyclopedia />,
});
