import { createFileRoute } from "@tanstack/react-router";
import { CharacterForm } from "@/components/moba/CharacterForm";

export const Route = createFileRoute("/admin/new")({
  head: () => ({ meta: [
    { title: "Novo personagem — Codex Arena" },
    { name: "description", content: "Cadastre um personagem no Codex Arena." },
    { property: "og:title", content: "Novo personagem — Codex Arena" },
    { property: "og:description", content: "Cadastre um personagem no Codex Arena." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <CharacterForm />,
});
