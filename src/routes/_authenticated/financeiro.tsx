import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  startOfDay, startOfWeek, startOfMonth, subDays, format, parseISO,
  endOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Plus, Trash2, Pencil, Loader2, TrendingDown, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { formatBRL, formatDate } from "@/lib/format";
import { StatusPill } from "./dashboard";
import { requireAdmin } from "@/lib/require-admin";

export const Route = createFileRoute("/_authenticated/financeiro")({
  ssr: false,
  beforeLoad: async () => {
    if (!(await requireAdmin())) throw redirect({ to: "/dashboard" });
  },
  component: FinanceiroPage,
});

const labels: Record<string, string> = {
  dinheiro: "Dinheiro", pix: "PIX",
  cartao_credito: "Cartão crédito", cartao_debito: "Cartão débito",
  transferencia: "Transferência", convenio: "Convênio", pendente: "A receber",
};

const METHOD_COLORS: Record<string, string> = {
  dinheiro: "#22c55e", pix: "#06b6d4", cartao_credito: "#e11d48",
  cartao_debito: "#f97316", transferencia: "#a855f7", convenio: "#eab308", pendente: "#6b7280",
};

const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "all", label: "Tudo" },
] as const;

const EXPENSE_CATEGORIES = [
  "Gasolina", "Produtos", "Energia", "Aluguel", "Funcionário",
  "Manutenção", "Marketing", "Impostos", "Outros",
] as const;

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  category: z.string().min(1),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  expense_date: z.string().min(1),
});

type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  expense_date: string;
};

function FinanceiroPage() {
  const [tab, setTab] = useState<"receitas" | "despesas">("receitas");
  const [period, setPeriod] = useState("30");
  const [methodFilter, setMethodFilter] = useState("all");

  const { data: orders } = useQuery({
    queryKey: ["finance-orders"],
    queryFn: async () =>
      (await supabase.from("service_orders").select("*, clients(name)").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  const now = new Date();
  const dayStart = startOfDay(now).getTime();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).getTime();
  const monthStart = startOfMonth(now).getTime();
  const periodStart = period === "all" ? 0 : startOfDay(subDays(now, Number(period) - 1)).getTime();

  const concluded = orders?.filter((o: any) => o.status === "concluido") ?? [];
  const sum = (list: any[]) => list.reduce((s, o) => s + Number(o.amount ?? 0), 0);

  const today = sum(concluded.filter((o: any) => new Date(o.completed_at ?? o.created_at).getTime() >= dayStart));
  const week = sum(concluded.filter((o: any) => new Date(o.completed_at ?? o.created_at).getTime() >= weekStart));
  const month = sum(concluded.filter((o: any) => new Date(o.completed_at ?? o.created_at).getTime() >= monthStart));
  const receivable = orders?.filter((o: any) => o.payment_method === "pendente" && o.status !== "cancelado") ?? [];
  const receivableTotal = sum(receivable);

  const periodConcluded = useMemo(
    () =>
      concluded.filter((o: any) => {
        const t = new Date(o.completed_at ?? o.created_at).getTime();
        if (t < periodStart) return false;
        if (methodFilter !== "all" && o.payment_method !== methodFilter) return false;
        return true;
      }),
    [concluded, periodStart, methodFilter],
  );
  const periodTotal = sum(periodConcluded);

  const byMethod = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of periodConcluded) {
      const m = o.payment_method ?? "pendente";
      map[m] = (map[m] ?? 0) + Number(o.amount ?? 0);
    }
    return Object.entries(map)
      .map(([method, total]) => ({ method, label: labels[method] ?? method, total }))
      .sort((a, b) => b.total - a.total);
  }, [periodConcluded]);

  const byDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of periodConcluded) {
      const day = format(parseISO(o.completed_at ?? o.created_at), "dd/MM");
      map[day] = (map[day] ?? 0) + Number(o.amount ?? 0);
    }
    return Object.entries(map).map(([day, total]) => ({ day, total }));
  }, [periodConcluded]);

  const filteredHistory = useMemo(
    () => (orders ?? []).filter((o: any) => methodFilter === "all" || o.payment_method === methodFilter),
    [orders, methodFilter],
  );

  // ===== DESPESAS =====
  const qc = useQueryClient();
  const { user } = useAuth();
  const [expenseMonth, setExpenseMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "Produtos",
    description: "",
    expense_date: format(new Date(), "yyyy-MM-dd"),
  });

  const expenseRange = useMemo(() => {
    const base = parseISO(`${expenseMonth}-01`);
    return {
      from: format(startOfMonth(base), "yyyy-MM-dd"),
      to: format(endOfMonth(base), "yyyy-MM-dd"),
    };
  }, [expenseMonth]);

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", expenseRange.from, expenseRange.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .gte("expense_date", expenseRange.from)
        .lte("expense_date", expenseRange.to)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });

  const expensesTotal = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses],
  );

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  // Resultado do mês atual (receita OS concluídas do mês - despesas do mês)
  const monthResult = month - expensesTotal;

  const openCreateExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      amount: "",
      category: "Produtos",
      description: "",
      expense_date: format(new Date(), "yyyy-MM-dd"),
    });
    setExpenseOpen(true);
  };

  const openEditExpense = (e: Expense) => {
    setEditingExpense(e);
    setExpenseForm({
      amount: String(e.amount),
      category: e.category,
      description: e.description ?? "",
      expense_date: e.expense_date,
    });
    setExpenseOpen(true);
  };

  const saveExpense = useMutation({
    mutationFn: async () => {
      const parsed = expenseSchema.parse({
        amount: expenseForm.amount.replace(",", "."),
        category: expenseForm.category,
        description: expenseForm.description,
        expense_date: expenseForm.expense_date,
      });
      const payload = {
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description || null,
        expense_date: parsed.expense_date,
        created_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      };
      if (editingExpense) {
        const { error } = await supabase.from("expenses").update(payload).eq("id", editingExpense.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("expenses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(editingExpense ? "Despesa atualizada" : "Despesa cadastrada");
      setExpenseOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const removeExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Despesa excluída");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir"),
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold">Financeiro</h2>
          <p className="text-muted-foreground mt-1">Receitas, despesas e resultado do estúdio</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 border border-border w-fit mb-8">
        <button
          type="button"
          onClick={() => setTab("receitas")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "receitas" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Receitas
        </button>
        <button
          type="button"
          onClick={() => setTab("despesas")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "despesas" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Despesas
        </button>
      </div>

      {/* ===== ABA RECEITAS ===== */}
      {tab === "receitas" && (
        <>
          <div className="flex gap-2 mb-6">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as formas</SelectItem>
                {Object.entries(labels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
            <Stat label="Hoje" value={formatBRL(today)} />
            <Stat label="Esta semana" value={formatBRL(week)} />
            <Stat label="Este mês (receita)" value={formatBRL(month)} accent />
            <Stat label="Despesas do mês" value={formatBRL(expensesTotal)} />
            <Stat
              label="Resultado do mês"
              value={formatBRL(monthResult)}
              sub={monthResult >= 0 ? "Lucro" : "Prejuízo"}
              accent={monthResult >= 0}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-10">
            <section className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
              <h3 className="font-display font-bold mb-4">Faturamento por dia</h3>
              {byDay.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">Sem dados concluídos nesse período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `R$${v}`} width={55} />
                    <Tooltip
                      formatter={(v: number) => [formatBRL(v), "Faturamento"]}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="total" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            <section className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
              <h3 className="font-display font-bold mb-4">Por forma de pagamento</h3>
              {byMethod.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">Sem dados nesse período.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={byMethod} dataKey="total" nameKey="label" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {byMethod.map((entry) => (
                          <Cell key={entry.method} fill={METHOD_COLORS[entry.method] ?? "#999"} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => formatBRL(v)}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {byMethod.map((m) => (
                      <div key={m.method} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="size-2 rounded-full" style={{ background: METHOD_COLORS[m.method] ?? "#999" }} />
                          {m.label}
                        </span>
                        <span className="font-semibold">{formatBRL(m.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          <section className="mb-10">
            <h3 className="font-display font-bold text-lg mb-4">Contas a receber</h3>
            <div className="bg-card border border-border rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="text-left p-4">OS</th><th className="text-left p-4">Cliente</th><th className="text-left p-4">Serviço</th><th className="text-right p-4">Valor</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {receivable.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Tudo em dia!</td></tr>}
                  {receivable.map((o: any) => (
                    <tr key={o.id} className="hover:bg-white/5">
                      <td className="p-4 font-mono text-xs">#{String(o.order_number).padStart(4, "0")}</td>
                      <td className="p-4">{o.clients?.name}</td>
                      <td className="p-4 text-muted-foreground">{o.service_name}</td>
                      <td className="p-4 text-right font-display font-semibold">{formatBRL(Number(o.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="font-display font-bold text-lg mb-4">
              Lançamentos {methodFilter !== "all" && <span className="text-muted-foreground font-normal text-sm">· {labels[methodFilter]}</span>}
            </h3>
            <div className="bg-card border border-border rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[620px]">
                <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left p-4">Data</th><th className="text-left p-4">Cliente</th>
                    <th className="text-left p-4">Serviço</th><th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Pagamento</th><th className="text-right p-4">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredHistory.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum lançamento com esse filtro.</td></tr>}
                  {filteredHistory.slice(0, 40).map((o: any) => (
                    <tr key={o.id} className="hover:bg-white/5">
                      <td className="p-4 text-xs text-muted-foreground">{formatDate(o.created_at)}</td>
                      <td className="p-4">{o.clients?.name}</td>
                      <td className="p-4 text-muted-foreground text-xs">{o.service_name}</td>
                      <td className="p-4"><StatusPill status={o.status} /></td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {labels[o.payment_method] ?? o.payment_method}
                        {o.payment_method === "cartao_credito" && o.installments > 1 && ` (${o.installments}x)`}
                      </td>
                      <td className="p-4 text-right font-display font-semibold">{formatBRL(Number(o.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ===== ABA DESPESAS ===== */}
      {tab === "despesas" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <Input
              type="month"
              value={expenseMonth}
              onChange={(e) => setExpenseMonth(e.target.value)}
              className="w-[180px]"
            />
            <Button onClick={openCreateExpense}>
              <Plus className="size-4 mr-1" />
              Nova despesa
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingDown className="size-3.5" />
                Total do mês
              </div>
              <p className="font-display text-2xl font-bold text-destructive">{formatBRL(expensesTotal)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Wallet className="size-3.5" />
                Lançamentos
              </div>
              <p className="font-display text-2xl font-bold">{expenses.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground mb-1">Período</p>
              <p className="font-display text-lg font-bold capitalize">
                {format(parseISO(`${expenseMonth}-01`), "MMMM yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          {expensesByCategory.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 mb-8">
              <p className="text-sm font-semibold mb-3">Por categoria</p>
              <div className="space-y-2">
                {expensesByCategory.map(([cat, value]) => {
                  const pct = expensesTotal > 0 ? (value / expensesTotal) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{cat}</span>
                        <span className="font-medium">{formatBRL(value)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary/80" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">Lançamentos de despesas</p>
            </div>
            {expensesLoading ? (
              <div className="py-16 grid place-items-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Nenhuma despesa neste mês.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {expenses.map((e) => (
                  <div key={e.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02]">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border">
                          {e.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(e.expense_date), "dd/MM/yyyy")}
                        </span>
                      </div>
                      {e.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{e.description}</p>
                      )}
                    </div>
                    <p className="font-semibold text-destructive shrink-0">{formatBRL(Number(e.amount))}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => openEditExpense(e)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Excluir esta despesa?")) removeExpense.mutate(e.id);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingExpense ? "Editar despesa" : "Nova despesa"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={expenseForm.category}
                    onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    rows={2}
                    placeholder="Ex: gasolina, shampoo, conta de luz..."
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setExpenseOpen(false)}>Cancelar</Button>
                <Button onClick={() => saveExpense.mutate()} disabled={saveExpense.isPending}>
                  {saveExpense.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`p-5 rounded-xl border ${accent ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-display font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}