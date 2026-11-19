import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BellRing, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BOOKING_MARKER } from "@/lib/booking.functions";
import { whatsappLink } from "@/lib/format";
import { playNotificationSound } from "@/lib/notification-sound";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const SEEN_KEY = "shinystudio.online-bookings.seen";

type Row = {
  id: string;
  starts_at: string;
  title: string | null;
  clients: { name: string | null; whatsapp: string | null; phone: string | null } | null;
  vehicles: { plate: string | null; model: string | null } | null;
};

function getSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}
function markSeen(id: string) {
  const s = getSeen();
  s.add(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-200)));
}

export function OnlineBookingNotifier() {
  const [mounted, setMounted] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function poll() {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("appointments")
        .select("id, starts_at, title, notes, clients(name, whatsapp, phone), vehicles(plate, model)")
        .gte("created_at", since)
        .ilike("notes", `${BOOKING_MARKER}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      const seen = getSeen();
      const newRows = (data as Row[] | null)?.filter((row) => !seen.has(row.id)) ?? [];
      if (newRows.length > 0) playNotificationSound();
      newRows.forEach((row) => {
        markSeen(row.id);
        const name = row.clients?.name ?? "Cliente";
        const phone = row.clients?.whatsapp ?? row.clients?.phone ?? "";
        const when = format(parseISO(row.starts_at), "d/MM 'às' HH:mm", { locale: ptBR });
        const firstName = name.trim().split(" ")[0] || name;
        const lines = [
          `Olá, ${firstName}! 😊`,
          "",
          "Recebemos sua solicitação de agendamento na Estética Shiny.",
          "",
          `📅 Data: ${when}`,
          `✨ Serviço: ${row.title ?? "serviço"}`,
        ];
        if (row.vehicles?.plate) lines.push(`🔖 Placa do veículo: ${row.vehicles.plate}`);
        lines.push(
          "",
          "Seu agendamento foi confirmado com sucesso! Estamos ansiosos para atendê-lo. Até breve!",
          "Agradecemos pela preferência!",
          "",
          "Equipe Estética Shiny",
        );
        const msg = lines.join("\n");
        const link = phone ? whatsappLink(phone, msg) : null;

        toast(
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0">
              <BellRing className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">Novo agendamento online</p>
              <p className="text-xs text-muted-foreground truncate">
                {name} — {row.title ?? "Serviço"} • {when}
              </p>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#25D366] text-white text-xs font-semibold"
                >
                  <MessageCircle className="size-3.5" />
                  Confirmar por WhatsApp
                </a>
              )}
            </div>
          </div>,
          { id: `booking-${row.id}`, duration: Infinity },
        );

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("Novo agendamento online 🔔", {
              body: `${name} — ${row.title ?? "Serviço"} • ${when}`,
              tag: `booking-${row.id}`,
            });
          } catch {
            // navegador pode bloquear silenciosamente — sem problema, o toast e o sino continuam funcionando
          }
        }
      });
    }

    poll();
    timer.current = window.setInterval(poll, 30_000) as unknown as number;
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [mounted]);

  return null;
}
