import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  TrendingUp,
  Car,
  Calendar,
  DollarSign,
  Share2,
  Copy,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { startOfDay, startOfMonth, endOfMonth, format } from "date-fns";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  component: DashboardPage,
});

function DashboardPage() {
  const { isAdmin } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();
      const todayStart = startOfDay(now).toISOString();
      const monthStartDate = format(startOfMonth(now), "yyyy-MM-dd");

      const [orders, todayApts, monthOrders, clients, expenses, receivable] =
        await Promise.all([
          supabase
            .from("service_orders")
            .select("id, amount, status, created_at")
            .gte("created_at", monthStart)
            .lte("created_at", monthEnd),
          supabase.from("appointments").select("id").gte("starts_at", todayStart),
          supabase
            .from("service_orders")
            .select("amount")
            .gte("created_at", monthStart)
            .lte("created_at", monthEnd)
            .eq("status", "concluido"),
          supabase.from("clients").select("id", { count: "exact", head: true }),
          supabase.from("expenses").select("amount").gte("expense_date", monthStartDate),
          supabase
            .from("service_orders")
            .select("amount")
            .eq("payment_method", "pendente")
            .not("status", "eq", "cancelado"),
        ]);

      const revenue = (monthOrders.data ?? []).reduce(
        (s, o) => s + Number(o.amount ?? 0),
        0,
      );
      const completedCount = (orders.data ?? []).filter(
        (o) => o.status === "concluido",
      ).length;
      const ticket = completedCount ? revenue / completedCount : 0;
      const expensesTotal = (expenses.data ?? []).reduce(
        (s, e) => s + Number(e.amount ?? 0),
        0,
      );
      const receivableTotal = (receivable.data ?? []).reduce(
        (s, o) => s + Number(o.amount ?? 0),
        0,
      );

      return {
        revenue,
        completedCount,
        ticket,
        clientsCount: clients.count ?? 0,
        todayApts: todayApts.data?.length ?? 0,
        expensesTotal,
        receivableTotal,
        result: revenue - expensesTotal,
      };
    },
  });

  const { data: todayAppointments } = useQuery({
    queryKey: ["today-appointments"],
    queryFn: async () => {
      const start = startOfDay(new Date()).toISOString();
      const end = new Date(startOfDay(new Date()).getTime() + 86_400_000).toISOString();
      const { data } = await supabase
        .from("appointments")
        .select("id, title, starts_at, status, clients(name), vehicles(model, plate)")
        .gte("starts_at", start)
        .lt("starts_at", end)
        .not("status", "eq", "cancelado")
        .order("starts_at");
      return data ?? [];
    },
  });

  const { data: activeOrders } = useQuery({
    queryKey: ["active-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_orders")
        .select(
          "id, order_number, service_name, status, amount, created_at, clients(name), vehicles(model, brand, plate)",
        )
        .in("status", ["pendente", "confirmado", "em_andamento"])
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const [ordersTab, setOrdersTab] = useState<"andamento" | "orcamentos">("andamento");

  const { data: budgetOrders } = useQuery({
    queryKey: ["budget-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_orders")
        .select(
          "id, order_number, service_name, status, amount, created_at, clients(name), vehicles(model, brand, plate)",
        )
        .eq("status", "orcamento")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: ordersTab === "orcamentos",
  });

  const listedOrders = ordersTab === "andamento" ? activeOrders : budgetOrders;

  return (
    <div className="page">
      <header className="page-header">
        <div className="min-w-0">
          <h2 className="text-2xl md:text-3xl font-display font-bold">Painel Geral</h2>
          <p className="text-muted-foreground mt-1 text-sm">Visão completa do estúdio hoje</p>
        </div>
        <div className="page-actions">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/ordens">
              <Plus className="size-4 mr-2" />
              Nova OS
            </Link>
          </Button>
        </div>
      </header>

      <PublicBookingLinkCard />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-5">
        {isAdmin && (
          <StatCard
            label="Faturamento / Mês"
            value={formatBRL(stats?.revenue ?? 0)}
            icon={DollarSign}
            accent
          />
        )}
        {isAdmin && (
          <StatCard
            label="Ticket Médio"
            value={formatBRL(stats?.ticket ?? 0)}
            icon={TrendingUp}
          />
        )}
        <StatCard
          label="Concluídos no Mês"
          value={String(stats?.completedCount ?? 0)}
          icon={Car}
        />
        <StatCard
          label="Agendados Hoje"
          value={String(stats?.todayApts ?? 0)}
          icon={Calendar}
        />
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5 mb-8 md:mb-10">
          <StatCard
            label="A receber"
            value={formatBRL(stats?.receivableTotal ?? 0)}
            icon={AlertCircle}
          />
          <StatCard
            label="Despesas / Mês"
            value={formatBRL(stats?.expensesTotal ?? 0)}
            icon={Wallet}
          />
          <StatCard
            label="Resultado / Mês"
            value={formatBRL(stats?.result ?? 0)}
            icon={TrendingUp}
            accent={(stats?.result ?? 0) >= 0}
          />
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 md:gap-8">
        <section className="col-span-12 lg:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-1 bg-secondary/40 border border-border rounded-lg p-1 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setOrdersTab("andamento")}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${
                  ordersTab === "andamento"
                    ? "bg-card text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Em andamento
              </button>
              <button
                type="button"
                onClick={() => setOrdersTab("orcamentos")}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${
                  ordersTab === "orcamentos"
                    ? "bg-card text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Orçamentos
              </button>
            </div>
            <Link
              to="/ordens"
              className="text-xs font-semibold text-primary self-start sm:self-auto shrink-0"
            >
              Ver todas →
            </Link>
          </div>

          {(!listedOrders || listedOrders.length === 0) && (
            <div className="bg-card/50 border border-border rounded-xl p-8 md:p-10 text-center text-muted-foreground text-sm">
              {ordersTab === "andamento" ? (
                <>
                  Nenhuma ordem em andamento.{" "}
                  <Link to="/ordens" className="text-primary font-medium">
                    Crie a primeira
                  </Link>
                  .
                </>
              ) : (
                "Nenhum orçamento registrado ainda."
              )}
            </div>
          )}

          <div className="space-y-3">
            {listedOrders?.map((o: any) => (
              <div
                key={o.id}
                className="bg-card/50 p-4 rounded-xl border border-border flex items-center gap-3 md:gap-6"
              >
                <div className="size-12 md:size-14 rounded-lg bg-secondary border border-border shrink-0 grid place-items-center text-xs font-mono text-muted-foreground">
                  #{String(o.order_number).padStart(4, "0")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="font-semibold truncate text-sm md:text-base">
                      {o.vehicles
                        ? `${o.vehicles.brand ?? ""} ${o.vehicles.model ?? ""}`.trim()
                        : "Veículo não vinculado"}
                    </h4>
                    <StatusPill status={o.status} />
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    {o.clients?.name ?? "—"} · {o.service_name}
                    {o.vehicles?.plate && (
                      <span className="ml-2 font-mono text-xs">{o.vehicles.plate}</span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block min-w-20">
                  <p className="text-sm font-semibold font-display">
                    {formatBRL(Number(o.amount))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-card p-5 md:p-6 rounded-2xl border border-border">
            <div className="flex justify-between items-center mb-4 gap-2">
              <h3 className="text-base md:text-lg font-display font-bold">Agenda de hoje</h3>
              <Link to="/agenda" className="text-xs text-primary font-semibold shrink-0">
                Ver agenda
              </Link>
            </div>
            {(!todayAppointments || todayAppointments.length === 0) && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum agendamento pra hoje.
              </p>
            )}
            <div className="space-y-2">
              {todayAppointments?.map((a: any) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40"
                >
                  <div className="text-xs font-mono font-bold text-primary shrink-0 w-11">
                    {new Date(a.starts_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {a.clients?.name ?? a.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.vehicles?.model ?? a.title}
                    </p>
                  </div>
                  <StatusPill status={a.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card p-5 md:p-6 rounded-2xl border border-border">
            <h3 className="text-base md:text-lg font-display font-bold mb-4">Atalhos rápidos</h3>
            <div className="space-y-2">
              <QuickLink to="/agenda" label="Abrir agenda" />
              <QuickLink to="/clientes" label="Cadastrar cliente" />
              <QuickLink to="/veiculos" label="Cadastrar veículo" />
              <QuickLink to="/galeria" label="Ver galeria antes/depois" />
              <QuickLink to="/financeiro" label="Conferir financeiro" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: any;
  accent?: boolean;
}) {
  return (
    <div
      className={`p-4 md:p-5 rounded-xl border ${
        accent ? "bg-primary/10 border-primary/30" : "bg-card border-border"
      }`}
    >
      <div className="flex items-start justify-between mb-2 gap-1">
        <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
          {label}
        </p>
        <Icon className={`size-4 shrink-0 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <p className="text-lg md:text-2xl font-display font-bold leading-tight break-words">
        {value}
      </p>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 hover:bg-secondary text-sm font-medium transition-colors"
    >
      <span>{label}</span>
      <span className="text-primary">→</span>
    </Link>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    orcamento: "border-warning/40 text-warning",
    pendente: "border-muted-foreground/30 text-muted-foreground",
    confirmado: "border-info/40 text-info",
    em_andamento: "border-primary/40 text-primary",
    concluido: "border-success/40 text-success",
    cancelado: "border-destructive/40 text-destructive",
  };
  const labels: Record<string, string> = {
    orcamento: "Orçamento",
    pendente: "Pendente",
    confirmado: "Confirmado",
    em_andamento: "Em andamento",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };
  return (
    <span
      className={`px-2 py-0.5 border text-[10px] font-bold rounded-full uppercase tracking-tighter shrink-0 ${
        map[status] ?? map.pendente
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function PublicBookingLinkCard() {
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/agendar` : "/agendar";
  return (
    <div className="mb-6 md:mb-8 bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="size-11 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0">
        <Share2 className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Link público de agendamento</p>
        <p className="text-xs text-muted-foreground break-all">
          Compartilhe com clientes:{" "}
          <span className="text-foreground font-mono">{url}</span>
        </p>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={() => {
            navigator.clipboard.writeText(url);
            toast.success("Link copiado!");
          }}
        >
          <Copy className="size-3.5 mr-1.5" /> Copiar
        </Button>
        <Button asChild size="sm" className="flex-1 sm:flex-none">
          <a href="/agendar" target="_blank" rel="noreferrer">
            Abrir
          </a>
        </Button>
      </div>
    </div>
  );
}