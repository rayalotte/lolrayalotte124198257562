import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nova senha — Codex Arena" },
      { name: "description", content: "Defina uma nova senha para sua conta do Codex Arena." },
      { property: "og:title", content: "Nova senha — Codex Arena" },
      { property: "og:description", content: "Defina uma nova senha para sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => { if (s.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return setErr("A senha precisa ter pelo menos 6 caracteres.");
    if (pw !== pw2) return setErr("As senhas não coincidem.");
    setErr(null); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Senha alterada com sucesso.");
    navigate({ to: "/admin" });
  };

  return (
    <div className="bg-stage flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 border bg-panel p-6">
        <div>
          <div className="label-caps text-primary">Recuperação</div>
          <h1 className="font-display text-2xl font-bold">Nova senha</h1>
        </div>
        {!ready ? (
          <p className="text-sm text-muted-foreground">Abra esta página pelo link enviado ao seu e-mail. Se o link expirou, peça um novo na tela de login.</p>
        ) : (
          <>
            <div className="space-y-1.5"><Label htmlFor="p1">Nova senha</Label><Input id="p1" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="p2">Confirmar senha</Label><Input id="p2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
            {err && <p className="text-xs text-destructive">{err}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Salvando…" : "Salvar nova senha"}</Button>
          </>
        )}
        <Link to="/admin" className="block text-center text-xs text-muted-foreground hover:text-primary">← Voltar ao login</Link>
      </form>
    </div>
  );
}
