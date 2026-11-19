import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatTime, whatsappLink } from "@/lib/format";

const ACK_KEY = "shinystudio:reminders:ack";

function loadAck(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(ACK_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function saveAck(map: Record<string, number>) {
  // keep only last 200
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 200);
  localStorage.setItem(ACK_KEY, JSON.stringify(Object.fromEntries(entries)));
}

export function AppointmentReminder() {
  const [active, setActive] = useState<any | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 20_000);
    return () => clearInterval(i);
  }, []);

  const { data: due } = useQuery({
    queryKey: ["due-appointments", tick],
    queryFn: async () => {
      const now = new Date();
      const from = new Date(now.getTime() - 60_000).toISOString();
      const to = new Date(now.getTime() + 30_000).toISOString();
      const { data } = await supabase
        .from("appointments")
        .select("id, title, starts_at, status, notes, clients(name, phone, whatsapp), vehicles(model, plate)")
        .gte("starts_at", from)
        .lte("starts_at", to)
        .in("status", ["pendente", "confirmado"])
        .order("starts_at");
      return data ?? [];
    },
    refetchInterval: 20_000,
  });

  useEffect(() => {
    if (active || !due?.length) return;
    const ack = loadAck();
    const next = due.find((a) => !ack[a.id]);
    if (next) setActive(next);
  }, [due, active]);

  if (!active) return null;

  const phone = active.clients?.whatsapp || active.clients?.phone || "";
  const firstName = (active.clients?.name ?? "").split(" ")[0];
  const vehicleLabel = active.vehicles
    ? [active.vehicles.model, active.vehicles.plate].filter(Boolean).join(" - ")
    : "";
  const msg =
    `Olá ${firstName}! 👋\n\n` +
    `Passando para lembrar do seu agendamento na *Shiny Studio* hoje às *${formatTime(active.starts_at)}*.\n\n` +
    `🧾 Serviço: ${active.title}` +
    (vehicleLabel ? `\n🚗 Veículo: ${vehicleLabel}` : "") +
    `\n\nSeu horário está reservado e já estamos te aguardando. ` +
    `Caso precise remarcar ou tenha algum imprevisto, por favor nos avise por aqui.\n\n` +
    `Até já! ✨`;

  const dismiss = () => {
    const ack = loadAck();
    ack[active.id] = Date.now();
    saveAck(ack);
    setActive(null);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto size-12 rounded-full bg-primary/15 grid place-items-center mb-2">
            <BellRing className="size-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-display">
            Horário agendado para agora
          </DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-2 py-2">
          <p className="text-2xl font-display font-bold text-primary">{formatTime(active.starts_at)}</p>
          <p className="font-semibold">{active.title}</p>
          <p className="text-sm text-muted-foreground">
            {active.clients?.name}
            {active.vehicles && ` · ${[active.vehicles.model, active.vehicles.plate].filter(Boolean).join(" · ")}`}
          </p>
          {active.notes && <p className="text-xs text-muted-foreground italic">"{active.notes}"</p>}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="outline" onClick={dismiss} className="flex-1">Fechar</Button>
          {phone ? (
            <Button asChild className="flex-1 bg-[#25D366] hover:bg-[#1ebe5a] text-white">
              <a href={whatsappLink(phone, msg)} target="_blank" rel="noreferrer" onClick={dismiss}>
                <MessageCircle className="size-4 mr-2" />
                WhatsApp
              </a>
            </Button>
          ) : (
            <Button disabled className="flex-1">Sem WhatsApp</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
