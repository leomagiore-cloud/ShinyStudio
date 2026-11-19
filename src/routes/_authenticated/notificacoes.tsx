import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CalendarClock, Mail, KeyRound, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { confirmOnlineBooking, cancelOnlineBooking } from "@/lib/confirm-booking";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  ssr: false,
  component: NotificacoesPage,
});

const TYPE_ICON: Record<string, any> = {
  agendamento_online: CalendarClock,
  email_alterado: Mail,
  senha_alterada: KeyRound,
};

function NotificacoesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"lembretes" | "historico">("lembretes");
  const [actingId, setActingId] = useState<string | null>(null);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, appointments(id, status, starts_at, ends_at, title, client_id, vehicle_id)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  const handleConfirm = async (appt: any) => {
    setActingId(appt.id);
    try {
      await confirmOnlineBooking(appt);
      toast.success("Agendamento confirmado e O.S criada!");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao confirmar");
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async (appt: any) => {
    setActingId(appt.id);
    try {
      await cancelOnlineBooking(appt.id);
      toast.success("Agendamento cancelado");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao cancelar");
    } finally {
      setActingId(null);
    }
  };

  const lembretes = (notifications ?? []).filter(
    (n: any) => n.type === "agendamento_online" && n.appointments?.status === "pendente"
  );
  const historico = notifications ?? [];
  const list = tab === "lembretes" ? lembretes : historico;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <header>
        <h2 className="text-3xl font-display font-bold flex items-center gap-2">
          <Bell className="size-7 text-primary" />
          Notificações
        </h2>
        <p className="text-muted-foreground mt-1">Agendamentos pendentes e histórico de eventos do sistema.</p>
      </header>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("lembretes")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "lembretes" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Lembretes {lembretes.length > 0 && <span className="ml-1 text-destructive">({lembretes.length})</span>}
        </button>
        <button
          onClick={() => setTab("historico")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "historico" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Histórico
        </button>
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && list.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {tab === "lembretes" ? "Nenhum agendamento online aguardando confirmação." : "Nenhuma notificação ainda."}
          </p>
        )}
        {list.map((n: any) => {
          const Icon = TYPE_ICON[n.type] ?? Bell;
          const isOnlineBooking = n.type === "agendamento_online";
          const status = n.appointments?.status;
          return (
            <div key={n.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
              <div className="size-9 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{n.title}</p>
                  {isOnlineBooking && status && status !== "pendente" && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${status === "cancelado" ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
                      {status === "cancelado" ? <XCircle className="size-3" /> : <CheckCircle2 className="size-3" />}
                      {status === "cancelado" ? "Cancelado" : "Confirmado"}
                    </span>
                  )}
                </div>
                {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                <p className="text-[11px] text-muted-foreground/70 mt-1">{formatDateTime(n.created_at)}</p>
                {isOnlineBooking && status === "pendente" && n.appointments && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" disabled={actingId === n.appointments.id} onClick={() => handleConfirm(n.appointments)}>
                      {actingId === n.appointments.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5 mr-1" />}
                      Confirmar
                    </Button>
                    <Button size="sm" variant="outline" disabled={actingId === n.appointments.id} onClick={() => handleCancel(n.appointments)}>
                      <XCircle className="size-3.5 mr-1" />
                      Cancelar
                    </Button>
                    <Link to="/agenda" className="text-xs font-semibold text-primary hover:underline ml-1">
                      Ver na agenda →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
