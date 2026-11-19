import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

const credSchema = z.object({
  email: z.string().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo de 6 caracteres").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Intro no mobile
  const [showIntro, setShowIntro] = useState(false);
  const [introReady, setIntroReady] = useState(false);

  useEffect(() => {
    // Só mostra intro no mobile e se ainda não viu nessa sessão
    if (isMobile) {
      const seen = sessionStorage.getItem("shiny-auth-intro-seen");
      setShowIntro(!seen);
    }
    setIntroReady(true);
  }, [isMobile]);

  const finishIntro = () => {
    sessionStorage.setItem("shiny-auth-intro-seen", "1");
    setShowIntro(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = credSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard", replace: true });
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const parsed = z.string().email("E-mail inválido").safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setForgotLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Se esse e-mail estiver cadastrado, enviamos um link para redefinir a senha.");
    setForgotOpen(false);
  };

  // Aguarda decidir se mostra intro
  if (!introReady) {
    return <div className="min-h-screen bg-black" />;
  }

  // ========== INTRO (só no mobile) ==========
  if (showIntro && isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <video
          autoPlay
          muted
          playsInline
          loop={false}
          className="absolute inset-0 w-full h-full object-cover"
          src="/shiny-studio-vertical.mp4"
          onEnded={finishIntro}
        />
        <button
          onClick={finishIntro}
          className="absolute bottom-8 right-6 z-10 text-white/80 text-sm font-medium px-4 py-2 rounded-full bg-black/40 backdrop-blur hover:bg-black/60 transition"
        >
          Pular →
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex">
      {/* Vídeo de fundo */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={isMobile ? "/shiny-studio-vertical.mp4" : "/shiny-studio.mp4"}
      />

      {/* Card de login */}
      <div
        className={`relative z-10 w-full p-6 flex items-center ${
          isMobile ? "justify-center" : "justify-end pr-12 lg:pr-20"
        }`}
      >
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center font-display font-bold text-white tracking-tighter italic text-xl shadow-lg shadow-primary/30">
              S
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight text-white">Shiny Studio</h1>
              <p className="text-xs text-white/70">Gestão para estúdios de detailing</p>
            </div>
          </div>

          <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-6 shadow-2xl">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="si-email">E-mail</Label>
                <Input id="si-email" name="email" type="email" placeholder="voce@estudio.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-password">Senha</Label>
                <Input id="si-password" name="password" type="password" placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors mt-4"
            >
              Esqueci minha senha
            </button>
          </div>

          <p className="text-center text-xs text-white/50 mt-6">
            Desenvolvido por{" "}
            <a
              href="https://www.instagram.com/magiore.br"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors underline underline-offset-2"
            >
              @magiore.br
            </a>
          </p>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Informe o e-mail da sua conta — enviaremos um link para você criar uma nova senha.
          </p>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fp-email">E-mail</Label>
              <Input id="fp-email" name="email" type="email" placeholder="voce@estudio.com" required autoFocus />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={forgotLoading}>
                {forgotLoading ? <Loader2 className="size-4 animate-spin" /> : "Enviar link de recuperação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}