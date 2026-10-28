import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administração — Codex Arena" },
      { name: "description", content: "Painel administrativo do Codex Arena." },
      { property: "og:title", content: "Administração — Codex Arena" },
      { property: "og:description", content: "Painel administrativo do Codex Arena." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (session === undefined || (session && isAdmin === null))
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando…</div>;
  if (!session) return <AuthForm />;
  if (!isAdmin)
    return (
      <Shell email={session.user.email}>
        <div className="mx-auto max-w-md py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Acesso negado</h1>
          <p className="mt-2 text-muted-foreground">Esta conta não tem permissão de administrador.</p>
        </div>
      </Shell>
    );
  return <Shell email={session.user.email}><Outlet /></Shell>;
}

function Shell({ email, children }: { email?: string | undefined; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b bg-panel px-5 py-3">
        <Link to="/admin" className="font-display font-bold tracking-[0.2em]">CODEX<span className="text-primary">·</span>ADMIN</Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted-foreground sm:inline">{email}</span>
          <Link to="/" className="text-muted-foreground hover:text-primary">Ver site</Link>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>Sair</Button>
        </div>
      </header>
      <div className="p-5 md:p-8">{children}</div>
    </div>
  );
}

function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
        if (error) throw error;
        if (!data.session) toast.success("Conta criada. Confirme pelo link enviado ao seu e-mail.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na autenticação");
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-stage flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 border bg-panel p-6">
        <div>
          <div className="label-caps text-primary">Acesso restrito</div>
          <h1 className="font-display text-2xl font-bold">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
          {mode === "up" && <p className="mt-1 text-xs text-muted-foreground">Somente a primeira conta criada recebe permissão de administrador.</p>}
        </div>
        <div className="space-y-1.5"><Label htmlFor="em">E-mail</Label><Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">Senha</Label><Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Aguarde…" : mode === "in" ? "Entrar" : "Criar conta"}</Button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-center text-xs text-muted-foreground hover:text-primary">
          {mode === "in" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
        </button>
        <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-primary">← Voltar à enciclopédia</Link>
      </form>
    </div>
  );
}
