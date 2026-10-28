import { createFileRoute } from "@tanstack/react-router";
import { CharacterForm } from "@/components/moba/CharacterForm";

export const Route = createFileRoute("/admin/new")({ component: () => <CharacterForm /> });
