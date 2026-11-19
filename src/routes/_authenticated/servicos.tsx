import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Wrench, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL, formatDuration } from "@/lib/format";
import { generateCatalogPdf, sharePdfToWhatsapp } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/servicos")({
  ssr: false,
  component: ServicosPage,
});

const CATEGORIES = [
  "Lavagem",
  "Higienização",
  "Polimento",
  "Proteção",
  "Extras",
  "Outros",
] as const;

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.coerce.number().min(0),
  duration_minutes: z.coerce.number().int().min(5).max(60 * 24 * 30),
  is_active: z.boolean(),
  category: z.string().min(1),
  sort_order: z.coerce.number().int().min(0).max(9999),
});

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  category?: string | null;
  sort_order?: number | null;
};

function ServicosPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [category, setCategory] = useState<string>("Outros");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { data: services } = useQuery({
    queryKey: ["service-catalog"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_catalog")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      return (data ?? []) as Service[];
    },
  });

  const save = useMutation({
    mutationFn: async (input: any) => {
      const parsed = schema.parse(input);
      const payload = {
        name: parsed.name,
        description: parsed.description || null,
        price: parsed.price,
        duration_minutes: parsed.duration_minutes,
        is_active: parsed.is_active,
        category: parsed.category || "Outros",
        sort_order: parsed.sort_order ?? 0,
      };
      if (editing) {
        const { error } = await supabase
          .from("service_catalog")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("service_catalog").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-catalog"] });
      qc.invalidateQueries({ queryKey: ["services-list"] });
      qc.invalidateQueries({ queryKey: ["public-services"] });
      toast.success(editing ? "Serviço atualizado" : "Serviço criado");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_catalog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-catalog"] });
      qc.invalidateQueries({ queryKey: ["services-list"] });
      qc.invalidateQueries({ queryKey: ["public-services"] });
      toast.success("Serviço excluído");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir"),
  });

  const openNew = () => {
    setEditing(null);
    setIsActive(true);
    setCategory("Outros");
    setOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setIsActive(s.is_active);
    setCategory(s.category || "Outros");
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as any;
    const duration_minutes = Math.round(Number(fd.duration_hours) * 60);
    delete fd.duration_hours;
    save.mutate({
      ...fd,
      duration_minutes,
      is_active: isActive,
      category,
      sort_order: Number(fd.sort_order) || 0,
    });
  };

  const handleShareCatalog = async () => {
    const active = (services ?? []).filter((s) => s.is_active);
    if (active.length === 0) {
      toast.error("Nenhum serviço ativo para incluir no catálogo");
      return;
    }
    setGeneratingPdf(true);
    try {
      const blob = generateCatalogPdf(active);
      await sharePdfToWhatsapp(
        blob,
        "ShinyStudio-Catalogo.pdf",
        undefined,
        "Segue nosso catálogo de serviços!",
      );
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao gerar PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* HEADER — empilha no mobile; botões full-width clicáveis */}
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl md:text-3xl font-display font-bold break-words">
            Catálogo de Serviços
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie os serviços e as seções do agendamento online
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:shrink-0">
          <Button
            variant="outline"
            disabled={generatingPdf}
            onClick={handleShareCatalog}
            className="w-full sm:w-auto"
          >
            {generatingPdf ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="size-4 mr-2" />
            )}
            Enviar PDF
          </Button>

          <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : closeDialog())}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="w-full sm:w-auto">
                <Plus className="size-4 mr-2" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="s-name">Nome *</Label>
                  <Input
                    id="s-name"
                    name="name"
                    defaultValue={editing?.name ?? ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-desc">Descrição</Label>
                  <Textarea
                    id="s-desc"
                    name="description"
                    rows={3}
                    defaultValue={editing?.description ?? ""}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="s-price">Preço (R$) *</Label>
                    <Input
                      id="s-price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={editing?.price ?? 0}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s-dur">Duração (horas) *</Label>
                    <Input
                      id="s-dur"
                      name="duration_hours"
                      type="number"
                      min="0.25"
                      step="0.25"
                      defaultValue={editing ? editing.duration_minutes / 60 : 1}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Categoria (seção no agendar) *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha a seção" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s-order">Ordem na lista</Label>
                    <Input
                      id="s-order"
                      name="sort_order"
                      type="number"
                      min={0}
                      defaultValue={editing?.sort_order ?? 0}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Menor número aparece primeiro
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <Label htmlFor="s-active" className="cursor-pointer">
                      Ativo
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Disponível na agenda e OS
                    </p>
                  </div>
                  <Switch id="s-active" checked={isActive} onCheckedChange={setIsActive} />
                </div>
                <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
                    {editing ? "Salvar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {(!services || services.length === 0) && (
        <div className="bg-card/50 border border-border rounded-xl p-10 text-center text-muted-foreground">
          Nenhum serviço cadastrado ainda.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services?.map((s) => (
          <div
            key={s.id}
            className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-lg bg-primary/15 grid place-items-center shrink-0">
                  <Wrench className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(s.duration_minutes)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="px-2 py-0.5 border border-border bg-secondary/50 text-[10px] font-bold rounded-full uppercase tracking-tighter text-muted-foreground">
                  {s.category || "Outros"}
                </span>
                {!s.is_active && (
                  <span className="px-2 py-0.5 border border-muted-foreground/30 text-[10px] font-bold rounded-full uppercase tracking-tighter text-muted-foreground">
                    Inativo
                  </span>
                )}
              </div>
            </div>
            {s.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
            )}
            <div className="flex items-end justify-between mt-auto pt-2 border-t border-border">
              <p className="text-xl font-display font-bold">
                {formatBRL(Number(s.price))}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(s)}
                  aria-label="Editar"
                >
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Excluir">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
                      <AlertDialogDescription>
                        "{s.name}" será removido do catálogo. Agendamentos e OS existentes
                        não serão apagados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(s.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}