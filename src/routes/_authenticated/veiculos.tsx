import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Car as CarIcon,
  History,
  MessageCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatBRL, formatDate } from "@/lib/format";
import { StatusPill } from "./dashboard";

export const Route = createFileRoute("/_authenticated/veiculos")({
  ssr: false,
  component: VeiculosPage,
});

const schema = z.object({
  client_id: z.string().uuid("Selecione um cliente"),
  plate: z.string().trim().max(10).optional().or(z.literal("")),
  brand: z.string().trim().max(40).optional().or(z.literal("")),
  model: z.string().trim().max(60).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("" as any)),
  color: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

function VeiculosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [clientId, setClientId] = useState<string>("");
  const [lookupMsg, setLookupMsg] = useState<string>("");
  const [historyVehicle, setHistoryVehicle] = useState<any>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Lê plate / q / focus vindos do AppShell ou atalho rápido
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plate = params.get("plate");
    const q = params.get("q");
    const focus = params.get("focus");

    const initial = (plate || q || "").trim().toUpperCase();
    if (initial) setSearch(initial);

    if (focus === "1" || initial) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }

    if (plate || q || focus) {
      const url = new URL(window.location.href);
      url.searchParams.delete("plate");
      url.searchParams.delete("q");
      url.searchParams.delete("focus");
      window.history.replaceState({}, "", url.pathname + url.hash);
    }
  }, []);

  const lookupByPlate = async (raw: string) => {
    const plate = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    setLookupMsg("");
    if (plate.length < 6 || editing) return;
    const { data } = await supabase
      .from("vehicles")
      .select("*, clients(name)")
      .eq("plate", plate)
      .maybeSingle();
    if (!data || !formRef.current) return;
    const f = formRef.current;
    (f.elements.namedItem("brand") as HTMLInputElement).value = data.brand ?? "";
    (f.elements.namedItem("model") as HTMLInputElement).value = data.model ?? "";
    (f.elements.namedItem("year") as HTMLInputElement).value = data.year ? String(data.year) : "";
    (f.elements.namedItem("color") as HTMLInputElement).value = data.color ?? "";
    (f.elements.namedItem("notes") as HTMLTextAreaElement).value = data.notes ?? "";
    if (data.client_id) setClientId(data.client_id);
    setLookupMsg(
      `Veículo já cadastrado para ${(data as any).clients?.name ?? "outro cliente"} — campos preenchidos`,
    );
    toast.info("Veículo encontrado, dados preenchidos");
  };

  const { data: clients } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () =>
      (await supabase.from("clients").select("id, name").order("name")).data ?? [],
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles", search],
    queryFn: async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("*, clients(name, whatsapp), profiles!vehicles_created_by_fkey(full_name)")
        .order("created_at", { ascending: false });
      let rows = data ?? [];
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        rows = rows.filter(
          (v: any) =>
            (v.plate ?? "").toLowerCase().includes(s) ||
            (v.model ?? "").toLowerCase().includes(s) ||
            (v.brand ?? "").toLowerCase().includes(s) ||
            (v.clients?.name ?? "").toLowerCase().includes(s),
        );
      }
      return rows;
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: any) => {
      const parsed = schema.parse({ ...input, client_id: input.client_id || clientId });
      const payload = {
        client_id: parsed.client_id,
        plate: parsed.plate ? String(parsed.plate).toUpperCase() : null,
        brand: parsed.brand || null,
        model: parsed.model || null,
        year: parsed.year ? Number(parsed.year) : null,
        color: parsed.color || null,
        notes: parsed.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from("vehicles").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vehicles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success(editing ? "Veículo atualizado" : "Veículo cadastrado");
      setOpen(false);
      setEditing(null);
      setClientId("");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Veículo removido");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["vehicle-history", historyVehicle?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("id, order_number, service_name, amount, status, created_at, completed_at")
        .eq("vehicle_id", historyVehicle.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!historyVehicle,
  });

  const lastServiceDate = history?.find((h: any) => h.status === "concluido")?.completed_at;
  const daysSinceLastService = lastServiceDate
    ? Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const sendReminder = () => {
    const wa = historyVehicle?.clients?.whatsapp;
    if (!wa) {
      toast.error("Esse cliente não tem WhatsApp cadastrado");
      return;
    }
    const clientFirstName =
      (historyVehicle?.clients?.name ?? "").trim().split(" ")[0] || "tudo bem";
    const vehicleLabel =
      [historyVehicle?.brand, historyVehicle?.model].filter(Boolean).join(" ") || "seu veículo";
    const lastService = history?.find((h: any) => h.status === "concluido")?.service_name;
    const timeMsg =
      daysSinceLastService !== null
        ? `Já faz ${daysSinceLastService} dia${daysSinceLastService === 1 ? "" : "s"} desde o último serviço${
            lastService ? ` (${lastService})` : ""
          }`
        : "Notamos que faz um tempo desde a última visita";
    const message = `Olá, ${clientFirstName}! 😊\n\n🚗 ${timeMsg} no(a) ${vehicleLabel}.\n\n✨ Que tal agendar uma nova visita pra manter o cuidado com o seu carro?\n\nEquipe Estética Shiny 🙏`;
    window.open(
      `https://wa.me/${wa.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    upsert.mutate(Object.fromEntries(new FormData(e.currentTarget)));
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Veículos</h2>
          <p className="text-muted-foreground mt-1">
            {vehicles?.length ?? 0} veículos cadastrados
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              setEditing(null);
              setClientId("");
              setLookupMsg("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar" : "Novo"} veículo</DialogTitle>
            </DialogHeader>
            <form ref={formRef} onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={clientId || editing?.client_id}
                  onValueChange={setClientId}
                  name="client_id"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="hidden"
                  name="client_id"
                  value={clientId || editing?.client_id || ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="v-plate">Placa</Label>
                  <Input
                    id="v-plate"
                    name="plate"
                    defaultValue={editing?.plate ?? ""}
                    className="uppercase"
                    onBlur={(e) => lookupByPlate(e.target.value)}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                    }}
                  />
                  {lookupMsg && <p className="text-[11px] text-primary">{lookupMsg}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-year">Ano</Label>
                  <Input
                    id="v-year"
                    name="year"
                    type="number"
                    defaultValue={editing?.year ?? ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="v-brand">Marca</Label>
                  <Input id="v-brand" name="brand" defaultValue={editing?.brand ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v-model">Modelo</Label>
                  <Input id="v-model" name="model" defaultValue={editing?.model ?? ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-color">Cor</Label>
                <Input id="v-color" name="color" defaultValue={editing?.color ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-notes">Observações</Label>
                <Textarea
                  id="v-notes"
                  name="notes"
                  defaultValue={editing?.notes ?? ""}
                  rows={2}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={upsert.isPending}>
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative mb-6 max-w-md">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchRef}
          className="pl-9 uppercase"
          placeholder="Buscar por placa, modelo ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(!vehicles || vehicles.length === 0) && (
          <div className="md:col-span-2 lg:col-span-3 bg-card/50 border border-border rounded-xl p-10 text-center text-muted-foreground">
            Nenhum veículo. Cadastre o primeiro.
          </div>
        )}
        {vehicles?.map((v: any) => (
          <div
            key={v.id}
            onClick={() => setHistoryVehicle(v)}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="size-12 rounded-lg bg-secondary border border-border grid place-items-center">
                <CarIcon className="size-5 text-muted-foreground" />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(v);
                    setClientId(v.client_id);
                    setOpen(true);
                  }}
                  className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirm("Excluir veículo?") && del.mutate(v.id);
                  }}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            <h3 className="font-display font-semibold text-lg leading-tight">
              {[v.brand, v.model].filter(Boolean).join(" ") || "Veículo"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {v.plate && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary border border-border">
                  {v.plate}
                </span>
              )}
              {v.year && <span className="text-xs text-muted-foreground">{v.year}</span>}
              {v.color && (
                <span className="text-xs text-muted-foreground">· {v.color}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
              {v.clients?.name ?? "Cliente removido"}
            </p>
          </div>
        ))}
      </div>

      <Dialog open={!!historyVehicle} onOpenChange={(o) => !o && setHistoryVehicle(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {[historyVehicle?.brand, historyVehicle?.model].filter(Boolean).join(" ") ||
                "Veículo"}
              {historyVehicle?.plate && (
                <span className="text-muted-foreground font-mono text-sm ml-2">
                  {historyVehicle.plate}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            {historyVehicle?.clients?.name}
          </p>
          {historyVehicle?.profiles?.full_name && (
            <p className="text-xs text-muted-foreground/70 -mt-3">
              Cadastrado por {historyVehicle.profiles.full_name}
            </p>
          )}

          {daysSinceLastService !== null && (
            <div className="flex items-center gap-2 bg-secondary/40 border border-border rounded-lg p-3 text-sm">
              <Clock className="size-4 text-primary shrink-0" />
              <span>
                Último serviço concluído há{" "}
                <strong>
                  {daysSinceLastService} dia{daysSinceLastService === 1 ? "" : "s"}
                </strong>
                .
              </span>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={sendReminder}>
            <MessageCircle className="size-4 mr-2 text-[#25D366]" />
            Mandar lembrete pelo WhatsApp
          </Button>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <History className="size-3.5" /> Histórico de ordens de serviço
            </p>
            {historyLoading && (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            )}
            {!historyLoading && !history?.length && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma OS registrada pra esse veículo ainda.
              </p>
            )}
            {history?.map((h: any) => (
              <div
                key={h.id}
                className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{h.service_name}</p>
                  <p className="text-xs text-muted-foreground">
                    #{String(h.order_number).padStart(4, "0")} ·{" "}
                    {formatDate(h.completed_at ?? h.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill status={h.status} />
                  <span className="text-sm font-semibold">
                    {formatBRL(Number(h.amount))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}