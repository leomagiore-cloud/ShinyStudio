import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Upload, Trash2, Camera, FileDown, Loader2, Video, Share2, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatBRL, formatDateTime } from "@/lib/format";
import { checkScheduleConflict } from "@/lib/scheduling";
import { generateOsPdf, sharePdfToWhatsapp } from "@/lib/pdf";
import { StatusPill } from "./dashboard";
import { useAuth } from "@/lib/auth-context";
import { AdminPinDialog } from "@/components/AdminPinDialog";
import { adminDeleteServiceOrder } from "@/lib/admin-rpc";
import { ServiceMultiSelect } from "@/components/ServiceMultiSelect";

export const Route = createFileRoute("/_authenticated/ordens")({
  ssr: false,
  component: OrdensPage,
});

const schema = z.object({
  client_id: z.string().uuid(),
  vehicle_id: z.string().uuid().optional().or(z.literal("")),
  service_name: z.string().trim().min(2).max(200),
  amount: z.coerce.number().min(0),
  duration_minutes: z.coerce.number().int().min(15).max(60 * 24 * 30),
  starts_at: z.string().min(10),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CHECKLIST_KEYS = [
  "Pintura ok",
  "Motor / capô",
  "Interno limpo",
  "Rodas / pneus",
  "Vidros",
  "Faróis",
  "Riscos / marcas",
  "Amassados",
  "Objetos pessoais",
  "Combustível anotado",
];

function OrdensPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<any>(null);
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceName, setServiceName] = useState("");
  const [serviceNameTouched, setServiceNameTouched] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [durationHours, setDurationHours] = useState("1");
  const [durationTouched, setDurationTouched] = useState(false);
  const [startsAt, setStartsAt] = useState(() => toLocalInputValue(new Date()));
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [pinDeleteId, setPinDeleteId] = useState<string | null>(null);
  const [editTimeOrder, setEditTimeOrder] = useState<any>(null);
  const [conflictConfirm, setConflictConfirm] = useState<{ input: any; reason: string } | null>(null);
  const [editStartsAt, setEditStartsAt] = useState("");

  const toggleService = (id: string) =>
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_orders")
        .select("*, clients(name, whatsapp), vehicles(plate, model, brand)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () =>
      (await supabase.from("clients").select("id, name").order("name")).data ?? [],
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-list", clientId],
    queryFn: async () =>
      clientId
        ? (await supabase.from("vehicles").select("id, plate, model").eq("client_id", clientId)).data ?? []
        : [],
    enabled: !!clientId,
  });

  const { data: services } = useQuery({
    queryKey: ["services-list"],
    queryFn: async () =>
      (await supabase
        .from("service_catalog")
        .select("id, name, price, duration_minutes")
        .eq("is_active", true)).data ?? [],
  });

  useEffect(() => {
    const sel = services?.filter((s) => selectedServiceIds.includes(s.id)) ?? [];
    if (!serviceNameTouched) setServiceName(sel.map((s) => s.name).join(" + "));
    if (!amountTouched) setAmount(sel.reduce((sum, s) => sum + Number(s.price), 0).toFixed(2));
    if (!durationTouched) {
      const totalMin = sel.reduce((sum, s) => sum + s.duration_minutes, 0);
      setDurationHours(totalMin > 0 ? String(totalMin / 60) : "1");
    }
  }, [selectedServiceIds, services]);

  const create = useMutation({
    mutationFn: async (input: any) => {
      const parsed = schema.parse(input);
      const starts = new Date(parsed.starts_at);
      if (Number.isNaN(starts.getTime())) throw new Error("Horário de entrada inválido");
      const ends = new Date(starts.getTime() + parsed.duration_minutes * 60_000);

      const { data: createdOrder, error } = await supabase
        .from("service_orders")
        .insert({
          client_id: parsed.client_id,
          vehicle_id: parsed.vehicle_id || null,
          service_id: input.service_ids[0] || null,
          service_name: parsed.service_name,
          amount: parsed.amount,
          payment_method: "pendente",
          status: "em_andamento",
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
          started_at: starts.toISOString(),
          notes: parsed.notes || null,
          checklist,
        })
        .select("id")
        .single();
      if (error) throw error;

      const ids: string[] = input.service_ids ?? [];
      if (ids.length > 0) {
        const items = ids.map((id) => {
          const s = services?.find((x) => x.id === id);
          return {
            order_id: createdOrder.id,
            service_id: id,
            service_name: s?.name ?? "",
            price: s?.price ?? 0,
            duration_minutes: s?.duration_minutes ?? 0,
          };
        });
        const { error: itemsErr } = await supabase.from("service_order_items").insert(items as any);
        if (itemsErr) throw itemsErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("OS criada — horário bloqueado na agenda");
      setOpen(false);
      setClientId("");
      setVehicleId("");
      setSelectedServiceIds([]);
      setChecklist({});
      setServiceName("");
      setServiceNameTouched(false);
      setAmount("");
      setAmountTouched(false);
      setDurationHours("1");
      setDurationTouched(false);
      setStartsAt(toLocalInputValue(new Date()));
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const deleteOrder = useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin?: string }) => {
      await adminDeleteServiceOrder(id, pin ?? null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("OS excluída");
      setPinDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir — verifique o PIN"),
  });

  const updateOrderTime = useMutation({
    mutationFn: async ({
      id,
      startsAtLocal,
      durationMs,
    }: {
      id: string;
      startsAtLocal: string;
      durationMs: number;
    }) => {
      const starts = new Date(startsAtLocal);
      if (Number.isNaN(starts.getTime())) throw new Error("Horário inválido");
      const ends = new Date(starts.getTime() + durationMs);
      const { conflict, reason } = await checkScheduleConflict({
        startsAt: starts,
        endsAt: ends,
        excludeOrderId: id,
      });
      if (conflict) throw new Error(reason ?? "Esse horário já está ocupado.");
      const { error } = await supabase
        .from("service_orders")
        .update({
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
          started_at: starts.toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Horário de entrada atualizado");
      setEditTimeOrder(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch: any = { status };
      if (status === "em_andamento") patch.started_at = new Date().toISOString();
      const { error } = await supabase.from("service_orders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Status atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const completeOrder = useMutation({
    mutationFn: async ({
      id,
      payment_method,
      installments,
    }: {
      id: string;
      payment_method: string;
      installments: number;
    }) => {
      const { error } = await supabase
        .from("service_orders")
        .update({
          status: "concluido",
          completed_at: new Date().toISOString(),
          payment_method: payment_method as any,
          installments,
          paid_at: payment_method !== "pendente" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("OS concluída!");
      setPaymentOrder(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleStatusChange = (order: any, status: string) => {
    if (status === "concluido") {
      setPaymentOrder(order);
      return;
    }
    updateStatus.mutate({ id: order.id, status });
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as any;
    const input = {
      client_id: clientId,
      vehicle_id: vehicleId,
      service_name: serviceName,
      amount,
      duration_minutes: Math.round(Number(durationHours || 0) * 60),
      starts_at: startsAt,
      notes: fd.notes,
      service_ids: selectedServiceIds,
    };
    try {
      const parsed = schema.parse(input);
      const starts = new Date(parsed.starts_at);
      const ends = new Date(starts.getTime() + parsed.duration_minutes * 60_000);
      const { conflict, reason } = await checkScheduleConflict({ startsAt: starts, endsAt: ends });
      if (conflict) {
        setConflictConfirm({
          input,
          reason: reason ?? "Já existe uma OS aberta nesse horário.",
        });
        return;
      }
      create.mutate(input);
    } catch (err: any) {
      toast.error(err.message ?? "Confira os dados do formulário");
    }
  };

  const handleShareGallery = async (o: any) => {
    const url = `${window.location.origin}/galeria/${o.id}`;
    const clientFirstName = (o.clients?.name ?? "").trim().split(" ")[0] || "tudo bem";
    const text = `Olá, ${clientFirstName}! 😊\n\n📸 Segue o link com as fotos de antes e depois da Ordem de Serviço #${String(o.order_number).padStart(4, "0")}, referente ao ${o.service_name}:\n${url}\n\n🙏 Agradecemos a confiança e permanecemos à disposição.\n\nEquipe Estética Shiny ✨`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Antes & Depois", text });
        return;
      } catch {
        return;
      }
    }
    if (o.clients?.whatsapp) {
      window.open(
        `https://wa.me/${o.clients.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
        "_blank",
      );
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  const handleGeneratePdf = async (o: any) => {
    setGeneratingPdfId(o.id);
    try {
      const { data: items } = await supabase
        .from("service_order_items")
        .select("service_name, price")
        .eq("order_id", o.id);

      const { data: photoRows } = await supabase
        .from("service_photos")
        .select("kind, storage_path")
        .eq("order_id", o.id)
        .not("storage_path", "ilike", "%.mp4")
        .not("storage_path", "ilike", "%.mov")
        .not("storage_path", "ilike", "%.webm");

      const photos = (
        await Promise.all(
          (photoRows ?? []).map(async (p) => {
            const { data: signed } = await supabase.storage
              .from("service-photos")
              .createSignedUrl(p.storage_path, 300);
            return signed?.signedUrl
              ? { kind: p.kind as "antes" | "depois", url: signed.signedUrl }
              : null;
          }),
        )
      ).filter((p): p is { kind: "antes" | "depois"; url: string } => !!p);

      const blob = await generateOsPdf(o, items ?? [], photos);
      const filename = `ShinyStudio-OS-${String(o.order_number).padStart(4, "0")}.pdf`;
      const clientFirstName = (o.clients?.name ?? "").trim().split(" ")[0] || "tudo bem";
      const message = `Olá, ${clientFirstName}! 😊\n\n📄 Segue em PDF o resumo da Ordem de Serviço #${String(o.order_number).padStart(4, "0")}, referente ao ${o.service_name}.\n\n🙏 Agradecemos a confiança e permanecemos à disposição.\n\nEquipe Estética Shiny ✨`;
      await sharePdfToWhatsapp(blob, filename, o.clients?.whatsapp, message);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao gerar PDF");
    } finally {
      setGeneratingPdfId(null);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Ordens de Serviço</h2>
          <p className="text-muted-foreground mt-1">{orders?.length ?? 0} OS no total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Nova OS
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova ordem de serviço</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground -mt-2">
              Ao criar, o horário fica reservado na agenda pela duração informada.
            </p>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={clientId}
                  onValueChange={(v) => {
                    setClientId(v);
                    setVehicleId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Veículo</Label>
                <Select value={vehicleId} onValueChange={setVehicleId} disabled={!clientId}>
                  <SelectTrigger>
                    <SelectValue placeholder={clientId ? "Selecione" : "Cliente primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {[v.model, v.plate].filter(Boolean).join(" · ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Serviços do catálogo (um ou mais)</Label>
                <ServiceMultiSelect
                  services={services}
                  selectedIds={selectedServiceIds}
                  onToggle={toggleService}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-name">Nome do serviço (na OS) *</Label>
                <Input
                  id="o-name"
                  name="service_name"
                  value={serviceName}
                  required
                  onChange={(e) => {
                    setServiceName(e.target.value);
                    setServiceNameTouched(true);
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="o-amount">Valor (R$) *</Label>
                  <Input
                    id="o-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    required
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setAmountTouched(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="o-duration">Tempo estimado (horas) *</Label>
                  <Input
                    id="o-duration"
                    name="duration_hours"
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={durationHours}
                    required
                    onChange={(e) => {
                      setDurationHours(e.target.value);
                      setDurationTouched(true);
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-starts">Horário de entrada *</Label>
                <Input
                  id="o-starts"
                  name="starts_at"
                  type="datetime-local"
                  value={startsAt}
                  required
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>

              {/* Checklist de entrada */}
              <div className="space-y-2">
                <Label>Checklist de entrada do veículo</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CHECKLIST_KEYS.map((k) => (
                    <label
                      key={k}
                      className="flex items-center gap-2 text-sm cursor-pointer p-2.5 rounded-lg bg-secondary/40 border border-border"
                    >
                      <input
                        type="checkbox"
                        checked={!!checklist[k]}
                        onChange={(e) =>
                          setChecklist({ ...checklist, [k]: e.target.checked })
                        }
                      />
                      {k}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="o-notes">Observações</Label>
                <Textarea id="o-notes" name="notes" rows={2} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={create.isPending}>
                  Criar OS
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {(!orders || orders.length === 0) && (
          <div className="bg-card/50 border border-border rounded-xl p-10 text-center text-muted-foreground">
            Nenhuma OS criada ainda.
          </div>
        )}
        {orders?.map((o: any) => (
          <div key={o.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">
                  #{String(o.order_number).padStart(4, "0")} · {formatDateTime(o.created_at)}
                </p>
                <p className="font-semibold truncate mt-0.5">{o.clients?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {o.vehicles
                    ? `${o.vehicles.brand ?? ""} ${o.vehicles.model ?? ""} ${
                        o.vehicles.plate ? "· " + o.vehicles.plate : ""
                      }`
                    : "—"}
                </p>
              </div>
              <StatusPill status={o.status} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate">{o.service_name}</span>
              <span className="font-display font-semibold shrink-0">
                {formatBRL(Number(o.amount))}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setDetailOpen(o)}>
                <Camera className="size-3.5 mr-1" />
                Mídia
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShareGallery(o)}>
                <Share2 className="size-3.5 mr-1" />
                Galeria
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={generatingPdfId === o.id}
                onClick={() => handleGeneratePdf(o)}
              >
                {generatingPdfId === o.id ? (
                  <Loader2 className="size-3.5 mr-1 animate-spin" />
                ) : (
                  <FileDown className="size-3.5 mr-1" />
                )}
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditTimeOrder(o);
                  setEditStartsAt(toLocalInputValue(new Date(o.starts_at)));
                }}
              >
                <Clock className="size-3.5" />
              </Button>
              {isAdmin ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Excluir OS #{String(o.order_number).padStart(4, "0")}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Essa ação não pode ser desfeita. Fotos e vídeos também serão apagados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteOrder.mutate({ id: o.id })}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setPinDeleteId(o.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
              <Select value={o.status} onValueChange={(v) => handleStatusChange(o, v)}>
                <SelectTrigger className="h-9 flex-1 min-w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orcamento">Orçamento</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-4">OS</th>
              <th className="text-left p-4">Cliente / Veículo</th>
              <th className="text-left p-4">Serviço</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Valor</th>
              <th className="text-right p-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted-foreground">
                  Nenhuma OS criada ainda.
                </td>
              </tr>
            )}
            {orders?.map((o: any) => (
              <tr key={o.id} className="hover:bg-white/5">
                <td className="p-4 font-mono text-xs">
                  #{String(o.order_number).padStart(4, "0")}
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDateTime(o.created_at)}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-medium">{o.clients?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.vehicles
                      ? `${o.vehicles.brand ?? ""} ${o.vehicles.model ?? ""} ${
                          o.vehicles.plate ? "· " + o.vehicles.plate : ""
                        }`
                      : "—"}
                  </div>
                </td>
                <td className="p-4">{o.service_name}</td>
                <td className="p-4">
                  <StatusPill status={o.status} />
                </td>
                <td className="p-4 text-right font-display font-semibold">
                  {formatBRL(Number(o.amount))}
                </td>
                <td className="p-4">
                  <div className="flex gap-2 justify-end flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setDetailOpen(o)}>
                      <Camera className="size-3.5 mr-1" />
                      Mídia
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShareGallery(o)}>
                      <Share2 className="size-3.5 mr-1" />
                      Galeria
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={generatingPdfId === o.id}
                      onClick={() => handleGeneratePdf(o)}
                    >
                      {generatingPdfId === o.id ? (
                        <Loader2 className="size-3.5 mr-1 animate-spin" />
                      ) : (
                        <FileDown className="size-3.5 mr-1" />
                      )}
                      PDF
                    </Button>
                    <Select value={o.status} onValueChange={(v) => handleStatusChange(o, v)}>
                      <SelectTrigger className="h-9 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orcamento">Orçamento</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="em_andamento">Em andamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar horário"
                      onClick={() => {
                        setEditTimeOrder(o);
                        setEditStartsAt(toLocalInputValue(new Date(o.starts_at)));
                      }}
                    >
                      <Clock className="size-4" />
                    </Button>
                    {isAdmin ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Excluir OS">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Excluir OS #{String(o.order_number).padStart(4, "0")}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita. Fotos e vídeos também serão apagados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteOrder.mutate({ id: o.id })}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir OS"
                        onClick={() => setPinDeleteId(o.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailOpen && <PhotosDialog order={detailOpen} onClose={() => setDetailOpen(null)} />}

      {paymentOrder && (
        <PaymentDialog
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onConfirm={(payment_method, installments) =>
            completeOrder.mutate({ id: paymentOrder.id, payment_method, installments })
          }
          loading={completeOrder.isPending}
        />
      )}

      <AdminPinDialog
        open={!!pinDeleteId}
        onOpenChange={(o) => !o && setPinDeleteId(null)}
        loading={deleteOrder.isPending}
        entityLabel="esta OS"
        onConfirm={(pin) => deleteOrder.mutate({ id: pinDeleteId!, pin })}
      />

      <AlertDialog open={!!conflictConfirm} onOpenChange={(o) => !o && setConflictConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Horário ocupado</AlertDialogTitle>
            <AlertDialogDescription>
              {conflictConfirm?.reason} Quer criar esta OS mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConflictConfirm(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (conflictConfirm) create.mutate(conflictConfirm.input);
                setConflictConfirm(null);
              }}
            >
              Criar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editTimeOrder && (
        <Dialog open onOpenChange={(o) => !o && setEditTimeOrder(null)}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>
                Editar horário — OS #{String(editTimeOrder.order_number).padStart(4, "0")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="edit-starts">Horário de entrada</Label>
              <Input
                id="edit-starts"
                type="datetime-local"
                value={editStartsAt}
                onChange={(e) => setEditStartsAt(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTimeOrder(null)}>
                Cancelar
              </Button>
              <Button
                disabled={updateOrderTime.isPending}
                onClick={() => {
                  const durationMs =
                    new Date(editTimeOrder.ends_at).getTime() -
                    new Date(editTimeOrder.starts_at).getTime();
                  updateOrderTime.mutate({
                    id: editTimeOrder.id,
                    startsAtLocal: editStartsAt,
                    durationMs,
                  });
                }}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function PaymentDialog({
  order,
  onClose,
  onConfirm,
  loading,
}: {
  order: any;
  onClose: () => void;
  onConfirm: (method: string, installments: number) => void;
  loading: boolean;
}) {
  const [method, setMethod] = useState("pix");
  const [installments, setInstallments] = useState(1);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Finalizar OS #{String(order.order_number).padStart(4, "0")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Valor total:{" "}
          <span className="font-semibold text-foreground">
            {formatBRL(Number(order.amount))}
          </span>
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao_credito">Cartão de crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão de débito</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="convenio">Convênio</SelectItem>
                <SelectItem value="pendente">Pendente / a receber</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {method === "cartao_credito" && (
            <div className="space-y-2">
              <Label>Parcelas</Label>
              <Select
                value={String(installments)}
                onValueChange={(v) => setInstallments(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">À vista (1x)</SelectItem>
                  {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={loading}
            onClick={() => onConfirm(method, method === "cartao_credito" ? installments : 1)}
          >
            Confirmar e concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhotosDialog({ order, onClose }: { order: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: photos } = useQuery({
    queryKey: ["photos", order.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_photos")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at");
      const enriched = await Promise.all(
        (data ?? []).map(async (p) => {
          const { data: signed } = await supabase.storage
            .from("service-photos")
            .createSignedUrl(p.storage_path, 3600);
          return { ...p, url: signed?.signedUrl };
        }),
      );
      return enriched;
    },
  });

  const isVideo = (path: string) => /\.(mp4|mov|webm|m4v|avi)$/i.test(path);
  const MAX_FILE_MB = 50;

  const upload = async (file: File, kind: "antes" | "depois") => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(
        `"${file.name}" tem ${sizeMb}MB — limite ${MAX_FILE_MB}MB por arquivo.`,
        { duration: 8000 },
      );
      return;
    }
    setUploading(true);
    try {
      const path = `${order.id}/${kind}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("service-photos").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase
        .from("service_photos")
        .insert({ order_id: order.id, kind, storage_path: path });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["photos", order.id] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Arquivo enviado");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const del = async (id: string, path: string) => {
    await supabase.storage.from("service-photos").remove([path]);
    await supabase.from("service_photos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["photos", order.id] });
    qc.invalidateQueries({ queryKey: ["gallery"] });
  };

  const antes = photos?.filter((p) => p.kind === "antes") ?? [];
  const depois = photos?.filter((p) => p.kind === "depois") ?? [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Fotos e vídeos da OS #{String(order.order_number).padStart(4, "0")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          {(["antes", "depois"] as const).map((kind) => {
            const list = kind === "antes" ? antes : depois;
            return (
              <div key={kind}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display font-bold capitalize">{kind}</h4>
                  <label className="cursor-pointer inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                    <Upload className="size-3.5" />
                    Enviar
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      disabled={uploading}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? []);
                        for (const f of files) await upload(f, kind);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {list.length === 0 && (
                    <div className="col-span-2 aspect-square bg-secondary/30 rounded-lg border border-dashed border-border grid place-items-center text-xs text-muted-foreground">
                      Sem arquivos
                    </div>
                  )}
                  {list.map((p) => (
                    <div
                      key={p.id}
                      className="relative group aspect-square rounded-lg overflow-hidden bg-secondary border border-border"
                    >
                      {p.url && isVideo(p.storage_path) ? (
                        <div className="relative w-full h-full">
                          <video
                            src={p.url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                          <div className="absolute inset-0 grid place-items-center bg-black/20">
                            <Video className="size-6 text-white drop-shadow" />
                          </div>
                        </div>
                      ) : (
                        p.url && <img src={p.url} alt={kind} className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => del(p.id, p.storage_path)}
                        className="absolute top-1 right-1 p-1 rounded-md bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}