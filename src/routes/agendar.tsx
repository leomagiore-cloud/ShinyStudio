import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstagramFooter } from "@/components/InstagramFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBRL, formatDuration } from "@/lib/format";
import { createPublicBooking, getBookedSlots, getPublicServices, getStudioInfo } from "@/lib/booking.functions";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar horário — Shiny Studio" },
      {
        name: "description",
        content: "Escolha o serviço, dia e horário disponíveis para agendar seu detailing.",
      },
    ],
  }),
  component: BookingPage,
});

const OPEN_HOUR = 8;
const CLOSE_HOUR = 17;
const SLOT_MINUTES = 30;

const STEP_TITLES = ["Escolha o serviço", "Escolha o dia", "Escolha o horário", "Seus dados"];

const SECTION_ORDER = [
  "Lavagem",
  "Higienização",
  "Polimento",
  "Proteção",
  "Extras",
  "Outros",
];

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category?: string | null;
  sort_order?: number | null;
};

const STUDIO_SLUG = "recrossred";

function BookingPage() {
  const slug = STUDIO_SLUG;
  const isMobile = useIsMobile();

  const [showIntro, setShowIntro] = useState(false);
  const [introReady, setIntroReady] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("shiny-intro-seen");
    setShowIntro(!seen);
    setIntroReady(true);
  }, []);

  const finishIntro = () => {
    sessionStorage.setItem("shiny-intro-seen", "1");
    setShowIntro(false);
  };

  const [step, setStep] = useState(0);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", car_model: "", plate: "", notes: "" });
  const [success, setSuccess] = useState<null | { starts_at: string }>(null);

  const { data: studio, error: studioError, isLoading: studioLoading } = useQuery({
    queryKey: ["studio-info", slug],
    queryFn: () => getStudioInfo({ data: { slug } }),
    retry: false,
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["public-services", slug],
    queryFn: () => getPublicServices({ data: { slug } }) as Promise<Service[]>,
    enabled: !!studio,
  });

  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 14 }, (_, i) => addDays(today, i));
  }, []);

  const rangeFrom = days[0].toISOString();
  const rangeTo = addDays(days[days.length - 1], 1).toISOString();
  const { data: booked } = useQuery({
    queryKey: ["booked-slots", rangeFrom, rangeTo],
    queryFn: () => getBookedSlots({ data: { slug, from: rangeFrom, to: rangeTo } }),
    enabled: !!studio,
  });

  const toggleService = (id: string) =>
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const selectedServices = useMemo(
    () => services?.filter((s) => selectedServiceIds.includes(s.id)) ?? [],
    [services, selectedServiceIds],
  );
  const hasService = selectedServices.length > 0;
  const durationMin = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0) || 60;
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);

  const servicesBySection = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services ?? []) {
      const cat = (s.category || "Outros").trim() || "Outros";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    const ordered: { title: string; items: Service[] }[] = [];
    for (const title of SECTION_ORDER) {
      const items = map.get(title);
      if (items?.length) {
        ordered.push({ title, items });
        map.delete(title);
      }
    }
    for (const [title, items] of map) {
      ordered.push({ title, items });
    }
    return ordered;
  }, [services]);

  const slotsForDay = useMemo(() => {
    if (!selectedDay || !hasService || selectedDay.getDay() === 0) return [];
    const now = new Date();
    const slots: { time: string; available: boolean }[] = [];
    for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
      for (let m = 0; m < 60; m += SLOT_MINUTES) {
        const start = new Date(selectedDay);
        start.setHours(h, m, 0, 0);
        const end = new Date(start.getTime() + durationMin * 60_000);
        if (end.getHours() > CLOSE_HOUR || (end.getHours() === CLOSE_HOUR && end.getMinutes() > 0)) continue;
        if (start < now) continue;
        const overlaps = (booked ?? []).some((b) => {
          const bs = parseISO(b.starts_at).getTime();
          const be = parseISO(b.ends_at).getTime();
          return start.getTime() < be && end.getTime() > bs;
        });
        slots.push({ time: format(start, "HH:mm"), available: !overlaps });
      }
    }
    return slots;
  }, [selectedDay, hasService, booked, durationMin]);

  const dayHasAvailability = (d: Date) => {
    if (d.getDay() === 0) return false;
    if (!hasService) return true;
    const now = new Date();
    if (d < startOfDay(now)) return false;
    for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
      for (let m = 0; m < 60; m += SLOT_MINUTES) {
        const start = new Date(d);
        start.setHours(h, m, 0, 0);
        const end = new Date(start.getTime() + durationMin * 60_000);
        if (end.getHours() > CLOSE_HOUR || (end.getHours() === CLOSE_HOUR && end.getMinutes() > 0)) continue;
        if (start < now) continue;
        const overlaps = (booked ?? []).some((b) => {
          const bs = parseISO(b.starts_at).getTime();
          const be = parseISO(b.ends_at).getTime();
          return start.getTime() < be && end.getTime() > bs;
        });
        if (!overlaps) return true;
      }
    }
    return false;
  };

  useEffect(() => {
    setSelectedTime("");
  }, [selectedDay, selectedServiceIds]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!hasService || !selectedDay || !selectedTime) throw new Error("Selecione serviço, dia e horário");
      const [hh, mm] = selectedTime.split(":").map(Number);
      const start = new Date(selectedDay);
      start.setHours(hh, mm, 0, 0);
      await createPublicBooking({
        data: {
          slug,
          name: form.name,
          phone: form.phone,
          car_model: form.car_model,
          plate: form.plate,
          service_ids: selectedServiceIds,
          starts_at: start.toISOString(),
          notes: form.notes,
        },
      });
      return start.toISOString();
    },
    onSuccess: (starts_at) => setSuccess({ starts_at }),
    onError: (e: any) => toast.error(e.message ?? "Erro ao agendar"),
  });

  const goBack = () => setStep((s) => Math.max(0, s - 1));
  const goNext = () => setStep((s) => Math.min(3, s + 1));

  const canContinue =
    (step === 0 && selectedServiceIds.length > 0) ||
    (step === 1 && !!selectedDay) ||
    (step === 2 && !!selectedTime);

  const formValid = form.name.trim().length >= 2 && form.phone.trim().length >= 8;

  if (!introReady) {
    return <div className="min-h-screen bg-black" />;
  }

  if (showIntro) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <video
          autoPlay
          muted
          playsInline
          loop={false}
          className="absolute inset-0 w-full h-full object-cover"
          src={isMobile ? "/shiny-studio-vertical.mp4" : "/shiny-studio.mp4"}
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

  if (studioError) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center p-6 text-center">
        <div>
          <p className="font-display text-xl font-bold mb-2">Link inválido</p>
          <p className="text-muted-foreground text-sm">
            Esse link de agendamento não existe mais. Confira com o estúdio.
          </p>
        </div>
      </div>
    );
  }

  if (studioLoading || !studio) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="mx-auto size-14 rounded-full bg-primary/10 border border-primary/30 grid place-items-center">
            <CheckCircle2 className="size-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">
            Prontinho, {form.name.trim().split(" ")[0] || "tudo certo"}!
          </h1>
          <p className="text-muted-foreground text-sm">
            Reservamos{" "}
            <span className="text-foreground font-semibold">
              {selectedServices.map((s) => s.name).join(" + ")}
            </span>{" "}
            para{" "}
            <span className="text-foreground font-semibold">
              {format(parseISO(success.starts_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </span>
            .
          </p>
          <p className="text-xs text-muted-foreground">
            Seu agendamento está com status pendente — assim que a equipe confirmar, você recebe um aviso pelo
            WhatsApp. Precisa reagendar ou tirar uma dúvida? É só chamar no WhatsApp aqui embaixo.
          </p>
          <Button
            onClick={() => {
              setSuccess(null);
              setStep(0);
              setSelectedServiceIds([]);
              setSelectedDay(null);
              setSelectedTime("");
              setForm({ name: "", phone: "", car_model: "", plate: "", notes: "" });
            }}
            className="w-full"
          >
            Fazer outro agendamento
          </Button>
        </div>
        <InstagramFooter studioName={studio?.name ?? "Shiny Studio"} />
        <p className="text-center text-[10px] text-muted-foreground/50 py-4">
          Desenvolvido por{" "}
          <a
            href="https://www.instagram.com/magiore.br"
            target="_blank"
            rel="noreferrer"
            className="hover:text-muted-foreground transition-colors underline underline-offset-2"
          >
            @magiore.br
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-20">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              aria-label="Voltar"
              className="size-9 -ml-1 grid place-items-center rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <Link
              to="/"
              className="size-9 grid place-items-center rounded-lg bg-primary font-display font-bold text-white italic shadow-lg shadow-primary/30 shrink-0"
            >
              S
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-bold tracking-tight leading-tight truncate">
              {STEP_TITLES[step]}
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {studio?.name ?? "Shiny Studio"} · Agendamento online
            </p>
          </div>
          <a
            href="https://www.instagram.com/esteticashiny/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="size-9 grid place-items-center rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <Instagram className="size-[18px]" />
          </a>
        </div>

        {/* WhatsApp em destaque para público leigo */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <a
            href={`https://wa.me/5515997650859?text=${encodeURIComponent(
              "Olá! Quero agendar um serviço na Estética Shiny",
            )}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white font-semibold py-2.5 text-sm shadow-lg shadow-[#25D366]/20 hover:bg-[#20bd5a] transition-colors"
          >
            <MessageCircle className="size-[18px]" />
            Atendimento via WhatsApp
          </a>
        </div>

        {/* Progresso */}
        <div className="max-w-lg mx-auto px-4 pb-3 flex gap-1.5">
          {STEP_TITLES.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto w-full px-4 py-6 flex-1">
        {step > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {selectedServices.length > 0 && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border text-muted-foreground">
                {selectedServices.map((s) => s.name).join(" + ")}
              </span>
            )}
            {selectedDay && step > 1 && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border text-muted-foreground">
                {format(selectedDay, "EEE, d/MM", { locale: ptBR })}
              </span>
            )}
            {selectedTime && step > 2 && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border text-muted-foreground">
                {selectedTime}
              </span>
            )}
          </div>
        )}

        {/* 1. Serviço por seções */}
        {step === 0 && (
          <div className="space-y-6">
            <p className="text-xs text-muted-foreground -mt-1">
              Pode escolher mais de um serviço.
            </p>

            {servicesBySection.map((section) => (
              <div key={section.title} className="space-y-2">
                <div className="flex items-center gap-2 pt-1">
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {section.title}
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-2">
                  {section.items.map((s) => {
                    const active = selectedServiceIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleService(s.id)}
                        onKeyDown={(e) => e.key === "Enter" && toggleService(s.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all active:scale-[0.99] cursor-pointer ${
                          active
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold">{s.name}</p>
                            {s.description && (
                              <>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {s.description}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailService(s);
                                  }}
                                  className="text-[11px] text-primary font-semibold mt-1 hover:underline"
                                >
                                  Ver mais
                                </button>
                              </>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              <span className="text-primary font-semibold">
                                {formatBRL(Number(s.price))}
                              </span>
                              <span className="text-muted-foreground inline-flex items-center gap-1">
                                <Clock className="size-3" />
                                {formatDuration(s.duration_minutes)}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`size-5 rounded-full border-2 grid place-items-center shrink-0 mt-0.5 ${
                              active ? "border-primary bg-primary" : "border-border"
                            }`}
                          >
                            {active && <CheckCircle2 className="size-4 text-primary-foreground" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {!services?.length && (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando serviços...</p>
            )}

            {selectedServices.length > 0 && (
              <div className="sticky bottom-24 z-10 rounded-xl border border-primary/30 bg-card/95 backdrop-blur p-3 shadow-lg">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold">
                      {selectedServices.length} serviço{selectedServices.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(totalDuration)} no total
                    </p>
                  </div>
                  <p className="font-display text-lg font-bold text-primary">{formatBRL(totalPrice)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <Dialog open={!!detailService} onOpenChange={(o) => !o && setDetailService(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{detailService?.name}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {detailService?.description}
            </p>
            <div className="flex items-center gap-4 text-sm pt-2 border-t border-border mt-2">
              <span className="text-primary font-semibold">
                {detailService && formatBRL(Number(detailService.price))}
              </span>
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {detailService && formatDuration(detailService.duration_minutes)}
              </span>
            </div>
            <Button
              className="w-full mt-2"
              onClick={() => {
                if (detailService) {
                  toggleService(detailService.id);
                  setDetailService(null);
                }
              }}
            >
              Selecionar este serviço
            </Button>
          </DialogContent>
        </Dialog>

        {/* 2. Dia */}
        {step === 1 && (
          <div className="grid grid-cols-4 gap-2">
            {days.map((d) => {
              const active = selectedDay && isSameDay(selectedDay, d);
              const avail = dayHasAvailability(d);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={!avail}
                  onClick={() => setSelectedDay(d)}
                  className={`p-3 rounded-lg border text-center transition-all active:scale-[0.97] ${
                    active
                      ? "border-primary bg-primary/10"
                      : avail
                      ? "border-border bg-card hover:border-primary/40"
                      : "border-border/50 bg-secondary/30 opacity-40 cursor-not-allowed"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {format(d, "EEE", { locale: ptBR })}
                  </p>
                  <p className={`font-display text-lg font-bold mt-0.5 ${active ? "text-primary" : ""}`}>
                    {format(d, "d")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(d, "MMM", { locale: ptBR })}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Horário */}
        {step === 2 && (
          <div className="grid grid-cols-3 gap-2">
            {slotsForDay.map((s) => (
              <button
                key={s.time}
                type="button"
                disabled={!s.available}
                onClick={() => setSelectedTime(s.time)}
                className={`p-3 rounded-lg border text-sm font-mono transition-all active:scale-[0.97] ${
                  selectedTime === s.time
                    ? "border-primary bg-primary/10 text-primary"
                    : s.available
                    ? "border-border bg-card hover:border-primary/40"
                    : "border-border/50 bg-secondary/30 opacity-40 cursor-not-allowed line-through"
                }`}
              >
                {s.time}
              </button>
            ))}
            {slotsForDay.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground text-center py-8">
                Sem horários disponíveis nesse dia. Toque em voltar e escolha outra data.
              </p>
            )}
          </div>
        )}

        {/* 4. Dados */}
        {step === 3 && hasService && selectedDay && selectedTime && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0">
                <Calendar className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {selectedServices.map((s) => s.name).join(" + ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })} às {selectedTime}
                </p>
                <p className="text-xs text-primary font-semibold mt-0.5">
                  {formatBRL(totalPrice)} · {formatDuration(totalDuration)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp *</Label>
                <Input
                  id="phone"
                  required
                  type="tel"
                  inputMode="tel"
                  placeholder="(11) 99999-9999"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="plate">Placa</Label>
                  <Input
                    id="plate"
                    placeholder="ABC1D23"
                    className="uppercase"
                    value={form.plate}
                    onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="car_model">Modelo</Label>
                  <Input
                    id="car_model"
                    placeholder="Civic Preto"
                    value={form.car_model}
                    onChange={(e) => setForm({ ...form, car_model: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <InstagramFooter studioName={studio?.name ?? "Shiny Studio"} />

        <p className="text-center text-[10px] text-muted-foreground/50 py-4">
          Desenvolvido por{" "}
          <a
            href="https://www.instagram.com/magiore.br"
            target="_blank"
            rel="noreferrer"
            className="hover:text-muted-foreground transition-colors underline underline-offset-2"
          >
            @magiore.br
          </a>
        </p>
      </main>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={goBack} className="shrink-0">
              Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" className="flex-1" disabled={!canContinue} onClick={goNext}>
              Continuar
              <ChevronRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1"
              disabled={!formValid || submit.isPending}
              onClick={() => submit.mutate()}
            >
              {submit.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
              Confirmar agendamento
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}