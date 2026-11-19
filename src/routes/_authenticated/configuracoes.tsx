import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2, KeyRound, Mail, Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadCsv, downloadTablePdf } from "@/lib/export";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  ssr: false,
  component: ConfiguracoesPage,
});

const passwordSchema = z
  .object({ password: z.string().min(6, "Mínimo de 6 caracteres").max(72), confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "As senhas não coincidem", path: ["confirm"] });

type ExportSource = {
  label: string;
  adminOnly?: boolean;
  needsRange?: boolean;
  headers: string[];
  fetch: (range?: { from: string; to: string }) => Promise<(string | number)[][]>;
};

const EXPORT_SOURCES: Record<string, ExportSource> = {
  clientes: {
    label: "Clientes",
    headers: ["Nome", "WhatsApp", "E-mail", "Cidade", "Cadastrado em"],
    fetch: async () => {
      const { data } = await supabase.from("clients").select("name, whatsapp, email, city, created_at").order("name");
      return (data ?? []).map((c: any) => [c.name ?? "", c.whatsapp ?? "", c.email ?? "", c.city ?? "", formatDate(c.created_at)]);
    },
  },
  veiculos: {
    label: "Veículos",
    headers: ["Placa", "Modelo", "Marca", "Cliente", "Cadastrado em"],
    fetch: async () => {
      const { data } = await supabase.from("vehicles").select("plate, model, brand, created_at, clients(name)").order("created_at", { ascending: false });
      return (data ?? []).map((v: any) => [v.plate ?? "", v.model ?? "", v.brand ?? "", v.clients?.name ?? "", formatDate(v.created_at)]);
    },
  },
  catalogo: {
    label: "Catálogo de serviços",
    headers: ["Nome", "Preço", "Duração", "Ativo"],
    fetch: async () => {
      const { data } = await supabase.from("service_catalog").select("name, price, duration_minutes, is_active").order("name");
      return (data ?? []).map((s: any) => [s.name ?? "", formatBRL(Number(s.price)), `${(s.duration_minutes / 60).toFixed(1)}h`, s.is_active ? "Sim" : "Não"]);
    },
  },
  ordens: {
    label: "Ordens de serviço",
    needsRange: true,
    headers: ["Nº", "Cliente", "Veículo", "Serviço", "Valor", "Status", "Pagamento", "Criada em"],
    fetch: async (range) => {
      let q = supabase.from("service_orders").select("order_number, service_name, amount, status, payment_method, created_at, clients(name), vehicles(plate)").order("created_at", { ascending: false });
      if (range) q = q.gte("created_at", range.from).lte("created_at", range.to);
      const { data } = await q;
      return (data ?? []).map((o: any) => [
        String(o.order_number).padStart(4, "0"), o.clients?.name ?? "", o.vehicles?.plate ?? "", o.service_name ?? "",
        formatBRL(Number(o.amount)), o.status ?? "", o.payment_method ?? "", formatDateTime(o.created_at),
      ]);
    },
  },
  agendamentos: {
    label: "Agendamentos",
    needsRange: true,
    headers: ["Título", "Cliente", "Início", "Status"],
    fetch: async (range) => {
      let q = supabase.from("appointments").select("title, starts_at, status, clients(name)").order("starts_at", { ascending: false });
      if (range) q = q.gte("starts_at", range.from).lte("starts_at", range.to);
      const { data } = await q;
      return (data ?? []).map((a: any) => [a.title ?? "", a.clients?.name ?? "", formatDateTime(a.starts_at), a.status ?? ""]);
    },
  },
  financeiro: {
    label: "Financeiro (OS concluídas)",
    adminOnly: true,
    needsRange: true,
    headers: ["Nº", "Cliente", "Serviço", "Valor", "Pagamento", "Concluída em"],
    fetch: async (range) => {
      let q = supabase.from("service_orders").select("order_number, service_name, amount, payment_method, completed_at, clients(name)").eq("status", "concluido").order("completed_at", { ascending: false });
      if (range) q = q.gte("completed_at", range.from).lte("completed_at", range.to);
      const { data } = await q;
      return (data ?? []).map((o: any) => [
        String(o.order_number).padStart(4, "0"), o.clients?.name ?? "", o.service_name ?? "",
        formatBRL(Number(o.amount)), o.payment_method ?? "", formatDateTime(o.completed_at),
      ]);
    },
  },
};

function ConfiguracoesPage() {
  const { isAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const sourceKeys = Object.keys(EXPORT_SOURCES).filter((k) => !EXPORT_SOURCES[k].adminOnly || isAdmin);
  const [source, setSource] = useState(sourceKeys[0]);
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo] = useState(today);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setNewEmail(data.user?.email ?? "");
    });
  }, []);

  const changeEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = z.string().email("E-mail inválido").safeParse(newEmail);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (newEmail === email) {
      toast.error("Esse já é o seu e-mail atual.");
      return;
    }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enviamos um link de confirmação para o e-mail novo (e para o atual, por segurança). A troca só vale depois de confirmar.");
    await supabase.from("notifications").insert({
      type: "email_alterado",
      title: "Troca de e-mail solicitada",
      body: `${email} → ${newEmail} (aguardando confirmação por e-mail)`,
    });
  };

  const changePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = passwordSchema.safeParse({ password: fd.get("password"), confirm: fd.get("confirm") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setPasswordLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada com sucesso!");
    await supabase.from("notifications").insert({
      type: "senha_alterada",
      title: "Senha alterada",
      body: `Senha da conta ${email} foi atualizada.`,
    });
    (e.target as HTMLFormElement).reset();
  };

  const handleExport = async () => {
    const cfg = EXPORT_SOURCES[source];
    if (!cfg) return;
    setExporting(true);
    try {
      const range = cfg.needsRange ? { from: `${dateFrom}T00:00:00`, to: `${dateTo}T23:59:59` } : undefined;
      const rows = await cfg.fetch(range);
      if (rows.length === 0) {
        toast.error("Nenhum registro encontrado para esse filtro.");
        return;
      }
      const filename = `${cfg.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      if (format === "csv") {
        downloadCsv(`${filename}.csv`, cfg.headers, rows);
      } else {
        downloadTablePdf(cfg.label, cfg.headers, rows, cfg.needsRange ? `${formatDate(dateFrom)} a ${formatDate(dateTo)}` : undefined);
      }
      toast.success("Exportação gerada!");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao exportar");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <header>
        <h2 className="text-3xl font-display font-bold">Configurações</h2>
        <p className="text-muted-foreground mt-1">Gerencie o acesso da sua conta e exporte seus dados.</p>
      </header>

      <Tabs defaultValue="conta">
        <TabsList>
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="exportar">Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="space-y-6 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-primary" />
              <h3 className="font-semibold">E-mail de login</h3>
            </div>
            <p className="text-sm text-muted-foreground">Atual: {email || "carregando..."}</p>
            <form onSubmit={changeEmail} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-email">Novo e-mail</Label>
                <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </div>
              <Button type="submit" disabled={emailLoading}>
                {emailLoading ? <Loader2 className="size-4 animate-spin" /> : "Enviar confirmação de troca"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Por segurança, o sistema envia um link de confirmação antes de trocar o e-mail de verdade — não precisamos guardar sua senha atual pra isso.
              </p>
            </form>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              <h3 className="font-semibold">Senha</h3>
            </div>
            <form onSubmit={changePassword} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input id="new-password" name="password" type="password" placeholder="••••••••" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input id="confirm-password" name="confirm" type="password" placeholder="••••••••" required />
              </div>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? <Loader2 className="size-4 animate-spin" /> : "Salvar nova senha"}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="exportar" className="space-y-6 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Download className="size-4 text-primary" />
              <h3 className="font-semibold">Exportar dados</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Escolha o que exportar e o formato — útil pra mandar algo específico que um cliente pediu, sem precisar de botão em cada tela.
            </p>

            <div className="space-y-2">
              <Label>O que exportar</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sourceKeys.map((k) => <SelectItem key={k} value={k}>{EXPORT_SOURCES[k].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {EXPORT_SOURCES[source]?.needsRange && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="exp-from">De</Label>
                  <Input id="exp-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-to">Até</Label>
                  <Input id="exp-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Formato</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat("csv")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${format === "csv" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  <FileSpreadsheet className="size-4" /> CSV (Excel)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("pdf")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${format === "pdf" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  <FileText className="size-4" /> PDF
                </button>
              </div>
            </div>

            <Button onClick={handleExport} disabled={exporting} className="w-full">
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <><Download className="size-4 mr-2" /> Exportar</>}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
