import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AdminPinDialog } from "@/components/AdminPinDialog";
import { adminDeleteAppointment } from "@/lib/admin-rpc";
import { toast } from "sonner";
import { z } from "zod";
import {
  startOfWeek, endOfWeek, addDays, format, addWeeks, subWeeks, isSameDay, parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { checkScheduleConflict } from "@/lib/scheduling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { StatusPill } from "./dashboard";
import { ServiceMultiSelect } from "@/components/ServiceMultiSelect";
import { confirmOnlineBooking, cancelOnlineBooking } from "@/lib/confirm-booking";
import { BOOKING_MARKER } from "@/lib/booking.functions";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda")({
  ssr: false,
  component: AgendaPage,
});

const schema = z.object({
  client_id: z.string().uuid(),
  vehicle_id: z.string().uuid().nullable().optional().or(z.literal("")),
  title: z.string().trim().min(2).max(160),
  starts_at: z.string().min(10),
  duration_minutes: z.coerce.number().int().min(15).max(60 * 24 * 30),
  status: z.enum(["pendente", "confirmado", "em_andamento", "concluido", "cancelado"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

function AgendaPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [pinDeleteId, setPinDeleteId] = useState<string | null>(null);
  const [conflictConfirm, setConflictConfirm] = useState<{ input: any; reason: string } | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [newClientMode, setNewClientMode] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockFullDay, setBlockFullDay] = useState(true);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newVehiclePlate, setNewVehiclePlate] = useState("");
  const [newVehicleModel, setNewVehicleModel] = useState("");

  const handleConfirmBooking = async (e: React.MouseEvent, a: any) => {
    e.stopPropagation();
    setActingId(a.id);
    try {
      await confirmOnlineBooking(a);
      toast.success("Agendamento confirmado e O.S criada!");
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao confirmar");
    } finally {
      setActingId(null);
    }
  };

  const handleCancelBooking = async (e: React.MouseEvent, a: any) => {
    e.stopPropagation();
    setActingId(a.id);
    try {
      await cancelOnlineBooking(a.id);
      toast.success("Agendamento cancelado");
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao cancelar");
    } finally {
      setActingId(null);
    }
  };
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);
  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [durationHours, setDurationHours] = useState("2");
  const [durationTouched, setDurationTouched] = useState(false);
  const [status, setStatus] = useState("pendente");

  const toggleService = (id: string) =>
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setEditing(null); setClientId(""); setVehicleId(""); setSelectedServiceIds([]); setStatus("pendente");
      setTitle(""); setTitleTouched(false); setDurationHours("2"); setDurationTouched(false);
      setDefaultDate(new Date());
      setOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const { data: appointments } = useQuery({
    queryKey: ["appointments", weekStart.toISOString()],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, clients(name), vehicles(plate, model), service_catalog(name, duration_minutes)")
        .gte("starts_at", weekStart.toISOString())
        .lte("starts_at", weekEnd.toISOString())
        .order("starts_at");
      return data ?? [];
    },
  });

  const { data: blocks } = useQuery({
    queryKey: ["schedule-blocks", weekStart.toISOString()],
    queryFn: async () => {
      const { data } = await supabase
        .from("schedule_blocks")
        .select("*")
        .gte("starts_at", weekStart.toISOString())
        .lte("starts_at", weekEnd.toISOString())
        .order("starts_at");
      return data ?? [];
    },
  });

  const createBlock = useMutation({
    mutationFn: async (input: { starts_at: string; ends_at: string; reason: string }) => {
      const { error } = await supabase.from("schedule_blocks").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule-blocks"] });
      toast.success("Horário bloqueado");
      setBlockOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao bloquear"),
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule-blocks"] });
      toast.success("Bloqueio removido");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover"),
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => (await supabase.from("clients").select("id, name").order("name")).data ?? [],
  });
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-list", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      return (await supabase.from("vehicles").select("id, plate, model").eq("client_id", clientId)).data ?? [];
    },
    enabled: !!clientId,
  });
  const { data: services } = useQuery({
    queryKey: ["services-list"],
    queryFn: async () => (await supabase.from("service_catalog").select("id, name, price, duration_minutes").eq("is_active", true)).data ?? [],
  });

  useEffect(() => {
    const sel = services?.filter((s) => selectedServiceIds.includes(s.id)) ?? [];
    if (!titleTouched) setTitle(sel.map((s) => s.name).join(" + "));
    if (!durationTouched) {
      const totalMin = sel.reduce((sum, s) => sum + s.duration_minutes, 0);
      setDurationHours(totalMin > 0 ? String(totalMin / 60) : "2");
    }
  }, [selectedServiceIds, services]);

  const resetForm = () => {
    setEditing(null); setClientId(""); setVehicleId(""); setSelectedServiceIds([]); setStatus("pendente"); setDefaultDate(null);
    setTitle(""); setTitleTouched(false); setDurationHours("2"); setDurationTouched(false);
    setNewClientMode(false); setNewClientName(""); setNewClientPhone(""); setNewVehiclePlate(""); setNewVehicleModel("");
  };

  const upsert = useMutation({
    mutationFn: async (input: any) => {
      const parsed = schema.parse(input);
      const starts = new Date(parsed.starts_at);
      const ends = new Date(starts.getTime() + parsed.duration_minutes * 60_000);

      const serviceIds: string[] = input.service_ids ?? [];
      const payload = {
        client_id: parsed.client_id,
        vehicle_id: parsed.vehicle_id || null,
        service_id: serviceIds[0] || null,
        title: parsed.title,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        status: parsed.status,
        notes: parsed.notes || null,
      };

      let appointmentId = editing?.id as string | undefined;
      if (editing) {
        const { error } = await supabase.from("appointments").update(payload).eq("id", editing.id);
        if (error) throw error;
        await supabase.from("appointment_services").delete().eq("appointment_id", editing.id);
      } else {
        const { data: created, error } = await supabase.from("appointments").insert(payload).select("id").single();
        if (error) throw error;
        appointmentId = created.id;
      }

      if (appointmentId && serviceIds.length > 0) {
        const items = serviceIds.map((id) => {
          const s = services?.find((x) => x.id === id);
          return {
            appointment_id: appointmentId,
            service_id: id,
            service_name: s?.name ?? "",
            price: s?.price ?? 0,
            duration_minutes: s?.duration_minutes ?? 0,
          };
        });
        const { error: itemsErr } = await supabase.from("appointment_services").insert(items as any);
        if (itemsErr) throw itemsErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["clients-list"] });
      qc.invalidateQueries({ queryKey: ["vehicles-list"] });
      toast.success(editing ? "Agendamento atualizado" : "Agendamento criado");
      setOpen(false); resetForm();
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const del = useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin?: string }) => {
      await adminDeleteAppointment(id, pin ?? null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento excluído");
      setOpen(false); resetForm(); setPinDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir — verifique o PIN"),
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const reschedule = useMutation({
    mutationFn: async ({ appt, newDay }: { appt: any; newDay: Date }) => {
      const oldStart = parseISO(appt.starts_at);
      const oldEnd = parseISO(appt.ends_at);
      const durationMs = oldEnd.getTime() - oldStart.getTime();
      const newStart = new Date(newDay);
      newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
      const newEnd = new Date(newStart.getTime() + durationMs);

      const { conflict, reason } = await checkScheduleConflict({
        startsAt: newStart,
        endsAt: newEnd,
        excludeAppointmentId: appt.id,
      });
      if (conflict) throw new Error(reason ?? "Esse horário já está ocupado nesse dia.");

      const { error } = await supabase
        .from("appointments")
        .update({ starts_at: newStart.toISOString(), ends_at: newEnd.toISOString() })
        .eq("id", appt.id);
      if (error) throw error;
      return newStart;
    },
    onSuccess: (newStart) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(`Reagendado para ${format(newStart, "d 'de' MMM", { locale: ptBR })}`);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao reagendar"),
  });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as any;

    let finalClientId = clientId;
    let finalVehicleId = vehicleId || null;

    if (newClientMode) {
      if (!newClientName.trim() || !newClientPhone.trim()) {
        toast.error("Preencha nome e WhatsApp do cliente novo");
        return;
      }
      const { data: newClient, error: clientErr } = await supabase
        .from("clients")
        .insert({ name: newClientName.trim(), whatsapp: newClientPhone.trim() })
        .select("id")
        .single();
      if (clientErr) {
        toast.error(clientErr.message);
        return;
      }
      finalClientId = newClient.id;
      if (newVehiclePlate.trim() || newVehicleModel.trim()) {
        const { data: newVehicle, error: vehicleErr } = await supabase
          .from("vehicles")
          .insert({ client_id: newClient.id, plate: newVehiclePlate.trim() || null, model: newVehicleModel.trim() || null })
          .select("id")
          .single();
        if (vehicleErr) {
          toast.error(vehicleErr.message);
          return;
        }
        finalVehicleId = newVehicle.id;
      }
    }

    const input = {
      client_id: finalClientId,
      vehicle_id: finalVehicleId,
      service_ids: selectedServiceIds,
      title,
      starts_at: fd.starts_at,
      duration_minutes: Math.round(Number(durationHours || 0) * 60),
      status,
      notes: fd.notes,
    };
    try {
      const parsed = schema.parse(input);
      const starts = new Date(parsed.starts_at);
      const ends = new Date(starts.getTime() + parsed.duration_minutes * 60_000);
      const { conflict, reason } = await checkScheduleConflict({
        startsAt: starts,
        endsAt: ends,
        excludeAppointmentId: editing?.id,
      });
      if (conflict) {
        setConflictConfirm({ input, reason: reason ?? "Já existe um compromisso nesse horário." });
        return;
      }
      upsert.mutate(input);
    } catch (err: any) {
      toast.error(err.message ?? "Confira os dados do formulário");
    }
  };

  const openForDay = (d: Date) => {
    resetForm();
    setDefaultDate(d);
    setOpen(true);
  };

  const openForEdit = async (a: any) => {
    setEditing(a);
    setClientId(a.client_id ?? "");
    setVehicleId(a.vehicle_id ?? "");
    setStatus(a.status ?? "pendente");
    setDefaultDate(null);

    const { data: items } = await supabase.from("appointment_services").select("service_id").eq("appointment_id", a.id);
    const ids = items?.length ? items.map((i: any) => i.service_id).filter(Boolean) : a.service_id ? [a.service_id] : [];
    setSelectedServiceIds(ids);
    setTitle(a.title ?? "");
    setTitleTouched(true);
    const mins = Math.round((new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / 60000);
    setDurationHours(mins > 0 ? String(mins / 60) : "2");
    setDurationTouched(true);

    setOpen(true);
  };

  const editStartsAt = editing ? format(parseISO(editing.starts_at), "yyyy-MM-dd'T'HH:mm") : "";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* HEADER — empilha no mobile, botões quebram linha sem cortar */}
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-display font-bold">Agenda</h2>
          <p className="text-muted-foreground mt-1 capitalize text-sm sm:text-base">
            {format(weekStart, "d 'de' MMM", { locale: ptBR })} – {format(weekEnd, "d 'de' MMM, yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {isAdmin && (
            <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  🚫 Bloquear horário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Bloquear horário (feriado, folga...)</DialogTitle></DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = Object.fromEntries(new FormData(e.currentTarget)) as any;
                    const day = fd.date as string;
                    const starts_at = blockFullDay ? `${day}T00:00:00` : `${day}T${fd.start_time}:00`;
                    const ends_at = blockFullDay ? `${day}T23:59:59` : `${day}T${fd.end_time}:00`;
                    createBlock.mutate({ starts_at, ends_at, reason: fd.reason || "Bloqueado" });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="block-date">Data *</Label>
                    <Input id="block-date" name="date" type="date" required />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={blockFullDay} onChange={(e) => setBlockFullDay(e.target.checked)} />
                    Dia inteiro
                  </label>
                  {!blockFullDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="block-start">Das</Label>
                        <Input id="block-start" name="start_time" type="time" required={!blockFullDay} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="block-end">Até</Label>
                        <Input id="block-end" name="end_time" type="time" required={!blockFullDay} />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="block-reason">Motivo</Label>
                    <Input id="block-reason" name="reason" placeholder="Ex: Feriado, folga da equipe..." />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createBlock.isPending}>Bloquear</Button>
                  </DialogFooter>
                </form>
                {!!blocks?.length && (
                  <div className="space-y-1.5 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground">Bloqueios dessa semana</p>
                    {blocks.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between gap-2 text-xs bg-secondary/40 rounded-md px-2.5 py-1.5">
                        <span className="truncate">{format(parseISO(b.starts_at), "dd/MM")} — {b.reason}</span>
                        <button type="button" onClick={() => deleteBlock.mutate(b.id)} className="text-destructive shrink-0">Remover</button>
                      </div>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex-1 sm:flex-none">
                <Plus className="size-4 mr-2" />Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Editar agendamento" : "Novo agendamento"}</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Cliente {!newClientMode && "*"}</Label>
                    {!editing && (
                      <button
                        type="button"
                        onClick={() => { setNewClientMode((v) => !v); setClientId(""); setVehicleId(""); }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {newClientMode ? "Selecionar cliente existente" : "+ Cliente novo"}
                      </button>
                    )}
                  </div>
                  {newClientMode ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input placeholder="Nome do cliente *" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} required={newClientMode} />
                      <Input placeholder="WhatsApp *" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} required={newClientMode} />
                      <Input placeholder="Placa (opcional)" className="uppercase" value={newVehiclePlate} onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())} />
                      <Input placeholder="Modelo (opcional)" value={newVehicleModel} onChange={(e) => setNewVehicleModel(e.target.value)} />
                    </div>
                  ) : (
                    <Select value={clientId} onValueChange={(v) => { setClientId(v); setVehicleId(""); }}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
                {!newClientMode && (
                  <div className="space-y-2">
                    <Label>Veículo</Label>
                    <Select value={vehicleId} onValueChange={setVehicleId} disabled={!clientId}>
                      <SelectTrigger><SelectValue placeholder={clientId ? "Selecione" : "Selecione um cliente primeiro"} /></SelectTrigger>
                      <SelectContent>{vehicles?.map((v) => <SelectItem key={v.id} value={v.id}>{[v.model, v.plate].filter(Boolean).join(" · ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Serviços (selecione um ou mais)</Label>
                  <ServiceMultiSelect services={services} selectedIds={selectedServiceIds} onToggle={toggleService} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a-title">Título *</Label>
                  <Input
                    id="a-title" value={title} required
                    onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="a-start">Início *</Label>
                    <Input id="a-start" name="starts_at" type="datetime-local"
                      defaultValue={editing ? editStartsAt : (defaultDate ? format(defaultDate, "yyyy-MM-dd'T'08:00") : "")}
                      required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="a-dur">Duração (horas) *</Label>
                    <Input
                      id="a-dur" type="number" min="0.25" step="0.25" value={durationHours} required
                      onChange={(e) => { setDurationHours(e.target.value); setDurationTouched(true); }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="em_andamento">Em andamento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="a-notes">Observações</Label><Textarea id="a-notes" name="notes" defaultValue={editing?.notes ?? ""} rows={2} /></div>
                <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
                  {editing ? (
                    <Button
                      type="button" variant="destructive"
                      className="w-full sm:w-auto"
                      onClick={() => (isAdmin ? confirm("Excluir agendamento?") && del.mutate({ id: editing.id }) : setPinDeleteId(editing.id))}
                    >
                      <Trash2 className="size-4 mr-2" />Excluir
                    </Button>
                  ) : <div className="hidden sm:block" />}
                  <Button type="submit" disabled={upsert.isPending} className="w-full sm:w-auto">
                    {editing ? "Salvar" : "Agendar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <p className="text-xs text-muted-foreground mb-2 hidden md:block">
        💡 Arraste um agendamento para outro dia da semana para reagendar rapidamente.
      </p>
      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/30 min-w-[700px]">
          {days.map((d) => {
            const isToday = isSameDay(d, new Date());
            return (
              <div key={d.toISOString()} className={`p-3 text-center border-r border-border last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{format(d, "EEE", { locale: ptBR })}</p>
                <p className={`text-2xl font-display font-bold mt-1 ${isToday ? "text-primary" : ""}`}>{format(d, "d")}</p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 min-h-[500px] min-w-[700px]">
          {days.map((d) => {
            const dayApts = appointments?.filter((a) => isSameDay(parseISO(a.starts_at), d)) ?? [];
            const dayKey = d.toISOString();
            const isDropTarget = dragOverDay === dayKey;
            return (
              <div
                key={dayKey}
                onClick={(e) => { if (e.target === e.currentTarget) openForDay(d); }}
                onDragOver={(e) => { e.preventDefault(); setDragOverDay(dayKey); }}
                onDragLeave={() => setDragOverDay((cur) => (cur === dayKey ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverDay(null);
                  const apptId = e.dataTransfer.getData("text/appointment-id");
                  const appt = appointments?.find((a) => a.id === apptId);
                  if (appt && !isSameDay(parseISO(appt.starts_at), d)) {
                    reschedule.mutate({ appt, newDay: d });
                  }
                  setDraggingId(null);
                }}
                className={`border-r border-border last:border-r-0 p-2 space-y-1.5 text-left transition-colors min-h-[500px] cursor-pointer ${
                  isDropTarget ? "bg-primary/10" : "hover:bg-white/[0.02]"
                }`}
              >
                {dayApts.length === 0 && (
                  <span className="block text-[10px] text-muted-foreground/40 text-center mt-4 pointer-events-none">+ agendar</span>
                )}
                {dayApts.map((a: any) => {
                  const isPendingOnline = a.status === "pendente" && String(a.notes ?? "").startsWith(BOOKING_MARKER);
                  return (
                  <div
                    role="button"
                    tabIndex={0}
                    key={a.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/appointment-id", a.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(a.id);
                    }}
                    onDragEnd={() => { setDraggingId(null); setDragOverDay(null); }}
                    onClick={(e) => { e.stopPropagation(); openForEdit(a); }}
                    onKeyDown={(e) => { if (e.key === "Enter") openForEdit(a); }}
                    className={`w-full p-2 rounded-md border-l-2 text-xs text-left transition-colors cursor-grab active:cursor-grabbing ${
                      isPendingOnline ? "bg-destructive/10 border-destructive" : "bg-primary/10 border-primary hover:bg-primary/20"
                    } ${draggingId === a.id ? "opacity-40" : ""}`}
                  >
                    <p className="font-mono text-[10px] text-primary">{format(parseISO(a.starts_at), "HH:mm")}</p>
                    <p className="font-semibold mt-0.5 truncate">{a.title}</p>
                    <p className="text-muted-foreground truncate text-[11px]">{a.clients?.name}</p>
                    <div className="mt-1"><StatusPill status={a.status} /></div>
                    {isPendingOnline && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <button
                          type="button"
                          disabled={actingId === a.id}
                          onClick={(e) => handleConfirmBooking(e, a)}
                          className="flex-1 flex items-center justify-center gap-1 rounded bg-primary text-primary-foreground py-1 text-[10px] font-semibold"
                        >
                          {actingId === a.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                          Confirmar
                        </button>
                        <button
                          type="button"
                          disabled={actingId === a.id}
                          onClick={(e) => handleCancelBooking(e, a)}
                          className="flex items-center justify-center rounded border border-border py-1 px-1.5 text-[10px]"
                        >
                          <XCircle className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <AdminPinDialog
        open={!!pinDeleteId}
        onOpenChange={(o) => !o && setPinDeleteId(null)}
        loading={del.isPending}
        entityLabel="este agendamento"
        onConfirm={(pin) => del.mutate({ id: pinDeleteId!, pin })}
      />

      <AlertDialog open={!!conflictConfirm} onOpenChange={(o) => !o && setConflictConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Horário ocupado</AlertDialogTitle>
            <AlertDialogDescription>
              {conflictConfirm?.reason} Isso costuma acontecer quando mais de um carro é atendido ao mesmo tempo.
              Quer criar este agendamento mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConflictConfirm(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (conflictConfirm) upsert.mutate(conflictConfirm.input);
                setConflictConfirm(null);
              }}
            >
              Criar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}