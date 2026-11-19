import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/redefinir-senha")({
  ssr: false,
  component: ResetPasswordPage,
});

const schema = z.object({
  password: z.string().min(6, "Mínimo de 6 caracteres").max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "As senhas não coincidem", path: ["confirm"] });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // O link do e-mail de recuperação cria uma sessão temporária (evento PASSWORD_RECOVERY).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ password: fd.get("password"), confirm: fd.get("confirm") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("notifications").insert({
      type: "senha_alterada",
      title: "Senha redefinida",
      body: `Senha da conta ${userData.user?.email ?? ""} foi redefinida via link de recuperação.`,
    });
    toast.success("Senha atualizada!");
    setTimeout(() => navigate({ to: "/dashboard", replace: true }), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl text-center">
        {done ? (
          <div className="space-y-3">
            <CheckCircle2 className="size-10 text-primary mx-auto" />
            <p className="font-semibold">Senha atualizada com sucesso!</p>
            <p className="text-sm text-muted-foreground">Redirecionando...</p>
          </div>
        ) : !ready ? (
          <div className="space-y-3 py-6">
            <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Confirmando o link de recuperação... Se essa mensagem não sumir, o link pode ter expirado —
              solicite um novo em "Esqueci minha senha".
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 text-left">
            <div>
              <h1 className="font-display font-bold text-xl text-center mb-1">Nova senha</h1>
              <p className="text-xs text-muted-foreground text-center">Escolha uma nova senha para sua conta.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input id="confirm" name="confirm" type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Salvar nova senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
