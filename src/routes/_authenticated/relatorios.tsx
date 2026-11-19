import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL, formatDate } from "@/lib/format";
import { StatusPill } from "./dashboard";
import { requireAdmin } from "@/lib/require-admin";

export const Route = createFileRoute("/_authenticated/relatorios")({
  ssr: false,
  beforeLoad: async () => {
    if (!(await requireAdmin())) throw redirect({ to: "/dashboard" });
  },
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const today = new Date();
  const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const [from, setFrom] = useState(monthAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));

  const { data: orders } = useQuery({
    queryKey: ["report", from, to],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_orders")
        .select("*, clients(name), vehicles(plate, model)")
        .gte("created_at", new Date(from).toISOString())
        .lte("created_at", new Date(to + "T23:59:59").toISOString())
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const total = orders?.reduce((s, o: any) => s + (o.status === "concluido" ? Number(o.amount) : 0), 0) ?? 0;
  const completed = orders?.filter((o: any) => o.status === "concluido").length ?? 0;

  const exportCSV = () => {
    if (!orders || orders.length === 0) return;
    const header = ["OS", "Data", "Cliente", "Veículo", "Serviço", "Status", "Pagamento", "Valor"];
    const rows = orders.map((o: any) => [
      `#${String(o.order_number).padStart(4, "0")}`,
      formatDate(o.created_at),
      o.clients?.name ?? "",
      o.vehicles ? `${o.vehicles.model ?? ""} ${o.vehicles.plate ?? ""}`.trim() : "",
      o.service_name,
      o.status,
      o.payment_method,
      String(o.amount).replace(".", ","),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `shinystudio-relatorio-${from}-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* HEADER — empilha no mobile; botão export full-width */}
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-display font-bold">Relatórios</h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Exporte dados para Excel ou outras ferramentas
          </p>
        </div>
        <Button
          onClick={exportCSV}
          disabled={!orders?.length}
          className="w-full sm:w-auto lg:shrink-0"
        >
          <Download className="size-4 mr-2" />Exportar CSV
        </Button>
      </header>

      {/* FILTROS — coluna no mobile, linha em telas maiores */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-2 w-full sm:w-auto">
          <Label htmlFor="r-from">De</Label>
          <Input
            id="r-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full sm:w-[180px]"
          />
        </div>
        <div className="space-y-2 w-full sm:w-auto">
          <Label htmlFor="r-to">Até</Label>
          <Input
            id="r-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full sm:w-[180px]"
          />
        </div>

        <div className="flex gap-6 w-full sm:w-auto sm:ml-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Faturado</p>
            <p className="text-2xl font-display font-bold text-success">{formatBRL(total)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Concluídas</p>
            <p className="text-2xl font-display font-bold">{completed}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-4">OS</th><th className="text-left p-4">Data</th>
              <th className="text-left p-4">Cliente</th><th className="text-left p-4">Serviço</th>
              <th className="text-left p-4">Status</th><th className="text-right p-4">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(!orders || orders.length === 0) && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">Sem dados no período.</td></tr>}
            {orders?.map((o: any) => (
              <tr key={o.id} className="hover:bg-white/5">
                <td className="p-4 font-mono text-xs">#{String(o.order_number).padStart(4, "0")}</td>
                <td className="p-4 text-xs text-muted-foreground">{formatDate(o.created_at)}</td>
                <td className="p-4">{o.clients?.name}</td>
                <td className="p-4 text-muted-foreground">{o.service_name}</td>
                <td className="p-4"><StatusPill status={o.status} /></td>
                <td className="p-4 text-right font-display font-semibold">{formatBRL(Number(o.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}