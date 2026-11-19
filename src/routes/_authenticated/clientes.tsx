import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MessageCircle, Trash2, Pencil, Navigation, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AdminPinDialog } from "@/components/AdminPinDialog";
import { adminDeleteClient } from "@/lib/admin-rpc";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { whatsappLink, onlyDigits } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/clientes")({
  ssr: false,
  component: ClientesPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  address_zip: z.string().trim().max(12).optional().or(z.literal("")),
  address_street: z.string().trim().max(160).optional().or(z.literal("")),
  address_number: z.string().trim().max(20).optional().or(z.literal("")),
  address_complement: z.string().trim().max(80).optional().or(z.literal("")),
  address_neighborhood: z.string().trim().max(100).optional().or(z.literal("")),
  address_city: z.string().trim().max(100).optional().or(z.literal("")),
  address_state: z.string().trim().max(2).optional().or(z.literal("")),
});

function fullAddress(c: any) {
  if (!c) return "";
  const line1 = [c.address_street, c.address_number].filter(Boolean).join(", ");
  const line2 = [c.address_neighborhood, c.address_city, c.address_state].filter(Boolean).join(", ");
  return [line1, c.address_complement, line2, c.address_zip].filter(Boolean).join(" — ");
}

function gpsLink(c: any) {
  const addr = [
    [c.address_street, c.address_number].filter(Boolean).join(", "),
    c.address_neighborhood,
    c.address_city,
    c.address_state,
    c.address_zip,
  ]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
}

function ClientesPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [pinDeleteId, setPinDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [addr, setAddr] = useState({
    address_zip: "", address_street: "", address_number: "", address_complement: "",
    address_neighborhood: "", address_city: "", address_state: "",
  });

  const { data: clients } = useQuery({
    queryKey: ["clients", search],
    queryFn: async () => {
      let q = supabase.from("clients").select("*, vehicles(id, plate, model), profiles!clients_created_by_fkey(full_name)").order("created_at", { ascending: false });
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: any) => {
      const parsed = schema.parse(input);
      const payload = {
        name: parsed.name,
        phone: parsed.phone || null,
        whatsapp: parsed.whatsapp || null,
        email: parsed.email || null,
        notes: parsed.notes || null,
        address_zip: parsed.address_zip || null,
        address_street: parsed.address_street || null,
        address_number: parsed.address_number || null,
        address_complement: parsed.address_complement || null,
        address_neighborhood: parsed.address_neighborhood || null,
        address_city: parsed.address_city || null,
        address_state: parsed.address_state ? parsed.address_state.toUpperCase() : null,
      };
      if (editing) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success(editing ? "Cliente atualizado" : "Cliente cadastrado");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const del = useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin?: string }) => {
      await adminDeleteClient(id, pin ?? null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente removido");
      setPinDeleteId(null);
    },
    onError: (e: any) => {
      if (e.code === "23503" || /foreign key/i.test(e.message ?? "")) {
        toast.error("Esse cliente tem ordens de serviço no histórico e não pode ser excluído (isso protege seu histórico financeiro). Se quiser, edite os dados dele em vez de excluir.");
        return;
      }
      toast.error(e.message ?? "Erro ao excluir — verifique o PIN");
    },
  });

  const openNew = () => {
    setEditing(null);
    setAddr({ address_zip: "", address_street: "", address_number: "", address_complement: "", address_neighborhood: "", address_city: "", address_state: "" });
    setOpen(true);
  };
  const openEdit = (c: any) => {
    setEditing(c);
    setAddr({
      address_zip: c.address_zip ?? "",
      address_street: c.address_street ?? "",
      address_number: c.address_number ?? "",
      address_complement: c.address_complement ?? "",
      address_neighborhood: c.address_neighborhood ?? "",
      address_city: c.address_city ?? "",
      address_state: c.address_state ?? "",
    });
    setOpen(true);
  };
  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
  };

  const lookupCep = async (rawCep: string) => {
    const cep = onlyDigits(rawCep);
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setAddr((prev) => ({
        ...prev,
        address_street: data.logradouro || prev.address_street,
        address_neighborhood: data.bairro || prev.address_neighborhood,
        address_city: data.localidade || prev.address_city,
        address_state: data.uf || prev.address_state,
      }));
    } catch {
      toast.error("Não foi possível buscar o CEP agora");
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    upsert.mutate({ ...Object.fromEntries(fd), ...addr });
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Clientes</h2>
          <p className="text-muted-foreground mt-1">{clients?.length ?? 0} clientes cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : closeDialog())}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="size-4 mr-2" />Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} cliente</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="c-name">Nome *</Label>
                <Input id="c-name" name="name" defaultValue={editing?.name} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="c-phone">Telefone</Label>
                  <Input id="c-phone" name="phone" defaultValue={editing?.phone ?? ""} placeholder="(11) 9999-9999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-wa">WhatsApp</Label>
                  <Input id="c-wa" name="whatsapp" defaultValue={editing?.whatsapp ?? ""} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-email">E-mail</Label>
                <Input id="c-email" name="email" type="email" defaultValue={editing?.email ?? ""} />
              </div>

              <div className="pt-2 border-t border-border space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-2">Endereço</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="c-zip">CEP</Label>
                    <div className="relative">
                      <Input
                        id="c-zip"
                        value={addr.address_zip}
                        placeholder="00000-000"
                        onChange={(e) => setAddr({ ...addr, address_zip: e.target.value })}
                        onBlur={(e) => lookupCep(e.target.value)}
                      />
                      {cepLoading && <Loader2 className="size-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-number">Número</Label>
                    <Input id="c-number" value={addr.address_number} onChange={(e) => setAddr({ ...addr, address_number: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-street">Rua</Label>
                  <Input id="c-street" value={addr.address_street} onChange={(e) => setAddr({ ...addr, address_street: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="c-complement">Complemento</Label>
                    <Input id="c-complement" value={addr.address_complement} onChange={(e) => setAddr({ ...addr, address_complement: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-neighborhood">Bairro</Label>
                    <Input id="c-neighborhood" value={addr.address_neighborhood} onChange={(e) => setAddr({ ...addr, address_neighborhood: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_80px] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="c-city">Cidade</Label>
                    <Input id="c-city" value={addr.address_city} onChange={(e) => setAddr({ ...addr, address_city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-state">UF</Label>
                    <Input id="c-state" maxLength={2} className="uppercase" value={addr.address_state} onChange={(e) => setAddr({ ...addr, address_state: e.target.value.toUpperCase() })} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-notes">Observações</Label>
                <Textarea id="c-notes" name="notes" defaultValue={editing?.notes ?? ""} rows={3} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={upsert.isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative mb-6 max-w-md">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Mobile: cards empilhados */}
      <div className="md:hidden space-y-3">
        {(!clients || clients.length === 0) && (
          <div className="bg-card/50 border border-border rounded-xl p-10 text-center text-muted-foreground">
            Nenhum cliente ainda. Cadastre o primeiro.
          </div>
        )}
        {clients?.map((c: any) => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div>
              <p className="font-semibold">{c.name}</p>
              {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">{c.phone ?? c.whatsapp ?? "Sem contato"}</p>
              {isAdmin && c.profiles?.full_name && (
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Cadastrado por {c.profiles.full_name}</p>
              )}
            </div>
            {c.address_street && <p className="text-xs text-muted-foreground">{fullAddress(c)}</p>}
            <p className="text-xs text-muted-foreground">
              {c.vehicles?.length
                ? c.vehicles.map((v: any) => v.model || v.plate).filter(Boolean).join(", ")
                : <span className="italic">Sem veículos</span>}
            </p>
            <div className="flex gap-2 pt-2 border-t border-border">
              {c.address_street && (
                <a href={gpsLink(c)} target="_blank" rel="noreferrer" className="p-2 rounded-md bg-secondary/60 text-primary" aria-label="Abrir no GPS">
                  <Navigation className="size-4" />
                </a>
              )}
              {c.whatsapp && (
                <a href={whatsappLink(c.whatsapp, `Olá ${c.name}, aqui é da Shiny Studio!`)} target="_blank" rel="noreferrer" className="p-2 rounded-md bg-secondary/60 text-success" aria-label="WhatsApp">
                  <MessageCircle className="size-4" />
                </a>
              )}
              <button onClick={() => openEdit(c)} className="p-2 rounded-md bg-secondary/60 text-muted-foreground" aria-label="Editar">
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => (isAdmin ? confirm(`Excluir ${c.name}?`) && del.mutate({ id: c.id }) : setPinDeleteId(c.id))}
                className="p-2 rounded-md bg-secondary/60 text-destructive ml-auto" aria-label="Excluir">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-4 font-semibold">Nome</th>
              <th className="text-left p-4 font-semibold">Contato</th>
              <th className="text-left p-4 font-semibold">Endereço</th>
              <th className="text-left p-4 font-semibold">Veículos</th>
              <th className="text-right p-4 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(!clients || clients.length === 0) && (
              <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Nenhum cliente ainda. Cadastre o primeiro.</td></tr>
            )}
            {clients?.map((c: any) => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="p-4 font-medium">
                  {c.name}
                  {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                  {isAdmin && c.profiles?.full_name && <div className="text-[11px] text-muted-foreground/60">Cadastrado por {c.profiles.full_name}</div>}
                </td>
                <td className="p-4 text-muted-foreground">{c.phone ?? c.whatsapp ?? "—"}</td>
                <td className="p-4 text-muted-foreground max-w-[220px]">
                  {c.address_street ? (
                    <span className="text-xs line-clamp-2">{fullAddress(c)}</span>
                  ) : (
                    <span className="text-xs italic">Sem endereço</span>
                  )}
                </td>
                <td className="p-4 text-muted-foreground">
                  {c.vehicles?.length
                    ? c.vehicles.map((v: any) => v.model || v.plate).filter(Boolean).join(", ")
                    : <span className="text-xs italic">Sem veículos</span>}
                </td>
                <td className="p-4">
                  <div className="flex gap-2 justify-end">
                    {c.address_street && (
                      <a href={gpsLink(c)} target="_blank" rel="noreferrer"
                        className="p-2 rounded-md hover:bg-primary/10 text-primary transition-colors" aria-label="Abrir no GPS" title="Abrir no GPS">
                        <Navigation className="size-4" />
                      </a>
                    )}
                    {c.whatsapp && (
                      <a href={whatsappLink(c.whatsapp, `Olá ${c.name}, aqui é da Shiny Studio!`)} target="_blank" rel="noreferrer"
                        className="p-2 rounded-md hover:bg-success/10 text-success transition-colors" aria-label="WhatsApp">
                        <MessageCircle className="size-4" />
                      </a>
                    )}
                    <button onClick={() => openEdit(c)} className="p-2 rounded-md hover:bg-white/5 text-muted-foreground transition-colors" aria-label="Editar">
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => (isAdmin ? confirm(`Excluir ${c.name}?`) && del.mutate({ id: c.id }) : setPinDeleteId(c.id))}
                      className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors" aria-label="Excluir">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPinDialog
        open={!!pinDeleteId}
        onOpenChange={(o) => !o && setPinDeleteId(null)}
        loading={del.isPending}
        entityLabel="este cliente"
        onConfirm={(pin) => del.mutate({ id: pinDeleteId!, pin })}
      />
    </div>
  );
}
