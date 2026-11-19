import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users2, Wallet, Phone, CheckCircle2, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireAdmin } from "@/lib/require-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatBRL, formatDate, whatsappLink } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/funcionarios")({
  ssr: false,
  beforeLoad: async () => {
    if (!(await requireAdmin())) throw redirect({ to: "/dashboard" });
  },
  component: FuncionariosPage,
});

const payTypeLabel: Record<string, string> = {
  mensalista: "Mensalista",
  diarista: "Diarista",
  comissionado: "Comissionado",
};

const paymentMethodLabel: Record<string, string> = {
  pendente: "Pendente",
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência",
};

const employeeSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  role_title: z.string().trim().max(80).optional().or(z.literal("")),
  pay_type: z.enum(["mensalista", "diarista", "comissionado"]),
  base_salary: z.coerce.number().min(0),
  commission_percent: z.preprocess(
    (v) => (v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? 0 : v),
    z.coerce.number().min(0).max(100),
  ),
  pix_key: z.string().trim().max(140).optional().or(z.literal("")),
  hire_date: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  is_active: z.boolean(),
});

type Employee = {
  id: string;
  full_name: string;
  phone: string | null;
  role_title: string | null;
  pay_type: "mensalista" | "diarista" | "comissionado";
  base_salary: number;
  commission_percent: number;
  pix_key: string | null;
  hire_date: string | null;
  is_active: boolean;
  notes: string | null;
};

type Payment = {
  id: string;
  employee_id: string;
  reference_month: string;
  amount: number;
  payment_method: string;
  status: "pendente" | "pago" | "cancelado";
  paid_at: string | null;
  notes: string | null;
};

function FuncionariosPage() {
  const qc = useQueryClient();

  // ---- Employees ----
  const [empOpen, setEmpOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [payType, setPayType] = useState<"mensalista" | "diarista" | "comissionado">("mensalista");

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").order("full_name");
      if (error) throw error;
      return (data ?? []) as Employee[];
    },
  });

  const saveEmployee = useMutation({
    mutationFn: async (input: any) => {
      const parsed = employeeSchema.parse(input);
      const payload = {
        full_name: parsed.full_name,
        phone: parsed.phone || null,
        role_title: parsed.role_title || null,
        pay_type: parsed.pay_type,
        base_salary: parsed.base_salary,
        commission_percent: parsed.commission_percent,
        pix_key: parsed.pix_key || null,
        hire_date: parsed.hire_date || null,
        notes: parsed.notes || null,
        is_active: parsed.is_active,
      };
      if (editingEmp) {
        const { error } = await supabase.from("employees").update(payload).eq("id", editingEmp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employees").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success(editingEmp ? "Funcionário atualizado" : "Funcionário cadastrado");
      closeEmpDialog();
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const removeEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["employee-payments"] });
      toast.success("Funcionário excluído");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir"),
  });

  const openNewEmp = () => {
    setEditingEmp(null);
    setIsActive(true);
    setPayType("mensalista");
    setEmpOpen(true);
  };
  const openEditEmp = (e: Employee) => {
    setEditingEmp(e);
    setIsActive(e.is_active);
    setPayType(e.pay_type);
    setEmpOpen(true);
  };
  const closeEmpDialog = () => {
    setEmpOpen(false);
    setEditingEmp(null);
  };

  const submitEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    saveEmployee.mutate({ ...fd, pay_type: payType, is_active: isActive });
  };

  // ---- Payments ----
  type PaymentMethod = "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "transferencia" | "pendente";
  const [payOpen, setPayOpen] = useState(false);
  const [payEmployeeId, setPayEmployeeId] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("pix");

  const { data: payments } = useQuery({
    queryKey: ["employee-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_payments")
        .select("*")
        .order("reference_month", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Payment[];
    },
  });

  const employeeById = useMemo(
    () => Object.fromEntries((employees ?? []).map((e) => [e.id, e])),
    [employees],
  );

  const savePayment = useMutation({
    mutationFn: async (fd: FormData) => {
      if (!payEmployeeId) throw new Error("Selecione o funcionário");
      const refMonth = String(fd.get("reference_month"));
      const payload = {
        employee_id: payEmployeeId,
        reference_month: `${refMonth}-01`,
        amount: Number(fd.get("amount")),
        payment_method: payMethod,
        notes: String(fd.get("notes") ?? "") || null,
        status: "pendente" as const,
      };
      const { error } = await supabase.from("employee_payments").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-payments"] });
      toast.success("Pagamento lançado");
      setPayOpen(false);
      setPayEmployeeId("");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao lançar pagamento"),
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employee_payments")
        .update({ status: "pago", paid_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-payments"] });
      toast.success("Pagamento marcado como pago");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar"),
  });

  const removePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employee_payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-payments"] });
      toast.success("Lançamento excluído");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir"),
  });

  const pendingTotal = (payments ?? [])
    .filter((p) => p.status === "pendente")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold">Funcionários</h2>
          <p className="text-muted-foreground mt-1">Equipe do estúdio e controle de pagamentos</p>
        </div>
      </header>

      <Tabs defaultValue="equipe" className="space-y-6">
        <TabsList>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="acessos">Acessos ao sistema</TabsTrigger>
        </TabsList>

        {/* ===== EQUIPE ===== */}
        <TabsContent value="equipe" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={empOpen} onOpenChange={(o) => (o ? setEmpOpen(true) : closeEmpDialog())}>
              <DialogTrigger asChild>
                <Button onClick={openNewEmp}>
                  <Plus className="size-4 mr-2" />
                  Novo funcionário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingEmp ? "Editar funcionário" : "Novo funcionário"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submitEmployee} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="f-name">Nome completo *</Label>
                    <Input id="f-name" name="full_name" defaultValue={editingEmp?.full_name ?? ""} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="f-phone">WhatsApp</Label>
                      <Input id="f-phone" name="phone" placeholder="(11) 99999-9999" defaultValue={editingEmp?.phone ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="f-role">Função</Label>
                      <Input id="f-role" name="role_title" placeholder="Ex.: Polidor" defaultValue={editingEmp?.role_title ?? ""} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de pagamento</Label>
                    <Select value={payType} onValueChange={(v: any) => setPayType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensalista">Mensalista</SelectItem>
                        <SelectItem value="diarista">Diarista</SelectItem>
                        <SelectItem value="comissionado">Comissionado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="f-salary">
                        {payType === "diarista" ? "Valor da diária (R$)" : "Salário base (R$)"}
                      </Label>
                      <Input id="f-salary" name="base_salary" type="number" step="0.01" min="0"
                        defaultValue={editingEmp?.base_salary ?? 0} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="f-commission">Comissão (%)</Label>
                      <Input id="f-commission" name="commission_percent" type="number" step="0.1" min="0" max="100"
                        defaultValue={editingEmp?.commission_percent ?? 0}
                        disabled={payType !== "comissionado"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="f-pix">Chave PIX</Label>
                      <Input id="f-pix" name="pix_key" defaultValue={editingEmp?.pix_key ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="f-hire">Data de contratação</Label>
                      <Input id="f-hire" name="hire_date" type="date" defaultValue={editingEmp?.hire_date ?? ""} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="f-notes">Observações</Label>
                    <Textarea id="f-notes" name="notes" rows={2} defaultValue={editingEmp?.notes ?? ""} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <Label htmlFor="f-active" className="cursor-pointer">Ativo</Label>
                      <p className="text-xs text-muted-foreground">Funcionário atualmente na equipe</p>
                    </div>
                    <Switch id="f-active" checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeEmpDialog}>Cancelar</Button>
                    <Button type="submit" disabled={saveEmployee.isPending}>
                      {editingEmp ? "Salvar" : "Cadastrar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {(!employees || employees.length === 0) && (
            <div className="bg-card/50 border border-border rounded-xl p-10 text-center text-muted-foreground">
              Nenhum funcionário cadastrado ainda.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees?.map((e) => (
              <div key={e.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-lg bg-primary/15 grid place-items-center shrink-0">
                      <Users2 className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{e.full_name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{e.role_title || payTypeLabel[e.pay_type]}</p>
                    </div>
                  </div>
                  {!e.is_active && (
                    <span className="px-2 py-0.5 border border-muted-foreground/30 text-[10px] font-bold rounded-full uppercase tracking-tighter text-muted-foreground shrink-0">
                      Inativo
                    </span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{payTypeLabel[e.pay_type]}{e.pay_type === "comissionado" && ` · ${e.commission_percent}%`}</p>
                  {e.phone && (
                    <a href={whatsappLink(e.phone)} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                      <Phone className="size-3" />{e.phone}
                    </a>
                  )}
                </div>

                <div className="flex items-end justify-between mt-auto pt-2 border-t border-border">
                  <p className="text-lg font-display font-bold">{formatBRL(Number(e.base_salary))}</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditEmp(e)} aria-label="Editar">
                      <Pencil className="size-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Excluir">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{e.full_name}" será removido. Os pagamentos já lançados também serão apagados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeEmployee.mutate(e.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ===== PAGAMENTOS ===== */}
        <TabsContent value="pagamentos" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="size-9 rounded-lg bg-amber-500/15 grid place-items-center">
                <Clock3 className="size-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendente no total</p>
                <p className="font-display font-bold">{formatBRL(pendingTotal)}</p>
              </div>
            </div>

            <Dialog open={payOpen} onOpenChange={setPayOpen}>
              <DialogTrigger asChild>
                <Button disabled={!employees?.length}>
                  <Plus className="size-4 mr-2" />
                  Lançar pagamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo lançamento</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => { e.preventDefault(); savePayment.mutate(new FormData(e.currentTarget)); }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Funcionário *</Label>
                    <Select value={payEmployeeId} onValueChange={setPayEmployeeId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {employees?.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="p-month">Mês de referência *</Label>
                      <Input id="p-month" name="reference_month" type="month" required
                        defaultValue={new Date().toISOString().slice(0, 7)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p-amount">Valor (R$) *</Label>
                      <Input id="p-amount" name="amount" type="number" step="0.01" min="0" required
                        defaultValue={employeeById[payEmployeeId]?.base_salary ?? 0} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de pagamento</Label>
                    <Select value={payMethod} onValueChange={(v: any) => setPayMethod(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de crédito</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de débito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-notes">Observações</Label>
                    <Textarea id="p-notes" name="notes" rows={2} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={savePayment.isPending}>Lançar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {(!payments || payments.length === 0) && (
            <div className="bg-card/50 border border-border rounded-xl p-10 text-center text-muted-foreground">
              Nenhum pagamento lançado ainda.
            </div>
          )}

          <div className="space-y-2">
            {payments?.map((p) => {
              const emp = employeeById[p.employee_id];
              return (
                <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 flex-wrap">
                  <div className="size-10 rounded-lg bg-primary/15 grid place-items-center shrink-0">
                    <Wallet className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{emp?.full_name ?? "Funcionário removido"}</p>
                    <p className="text-xs text-muted-foreground">
                      Ref. {formatDate(`${p.reference_month}T00:00:00`)} · {paymentMethodLabel[p.payment_method] ?? p.payment_method}
                    </p>
                  </div>
                  <p className="font-display font-bold">{formatBRL(Number(p.amount))}</p>
                  {p.status === "pago" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tighter bg-emerald-500/15 text-emerald-500">
                      <CheckCircle2 className="size-3" /> Pago
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tighter bg-amber-500/15 text-amber-500">
                      <Clock3 className="size-3" /> Pendente
                    </span>
                  )}
                  <div className="flex gap-1">
                    {p.status !== "pago" && (
                      <Button variant="outline" size="sm" onClick={() => markPaid.mutate(p.id)}>
                        Marcar pago
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Excluir">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
                          <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removePayment.mutate(p.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ===== ACESSOS ===== */}
        <TabsContent value="acessos" className="space-y-4">
          <TeamAccessTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TeamAccessTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const { data: team, isLoading } = useQuery({
    queryKey: ["studio-team"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("list_studio_team");
      if (error) throw error;
      return (data ?? []) as { user_id: string; email: string; full_name: string | null; role: string }[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: { email: string; password: string; name: string }) => {
      const { createEmployeeAccount } = await import("@/lib/team.functions");
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Sessão expirada, faça login novamente.");
      await createEmployeeAccount({ data: { access_token: token, ...input } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studio-team"] });
      toast.success("Acesso criado — repasse o e-mail e a senha ao funcionário");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar acesso"),
  });

  const revoke = useMutation({
    mutationFn: async (target_user_id: string) => {
      const { revokeEmployeeAccess } = await import("@/lib/team.functions");
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Sessão expirada, faça login novamente.");
      await revokeEmployeeAccess({ data: { access_token: token, target_user_id } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studio-team"] });
      toast.success("Acesso removido");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover acesso"),
  });

  const setPin = useMutation({
    mutationFn: async (pin: string) => {
      const { setAdminPin } = await import("@/lib/admin-rpc");
      await setAdminPin(pin);
    },
    onSuccess: () => { toast.success("PIN de administrador atualizado"); setPinOpen(false); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao definir PIN"),
  });

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold">PIN de administrador</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Colaboradores só cadastram clientes, criam O.S e agendamentos — pra excluir qualquer um
              desses, o sistema pede esse PIN. Só quem é admin pode definir/trocar.
            </p>
          </div>
          <Dialog open={pinOpen} onOpenChange={setPinOpen}>
            <DialogTrigger asChild><Button variant="outline">Definir / trocar PIN</Button></DialogTrigger>
            <DialogContent className="max-w-xs">
              <DialogHeader><DialogTitle>Novo PIN de administrador</DialogTitle></DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const pin = (new FormData(e.currentTarget).get("pin") as string) ?? "";
                  if (pin.length < 4) { toast.error("Use pelo menos 4 dígitos"); return; }
                  setPin.mutate(pin);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="pin">Novo PIN (mín. 4 dígitos)</Label>
                  <Input id="pin" name="pin" type="password" inputMode="numeric" required minLength={4} autoFocus />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={setPin.isPending}>Salvar PIN</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-2" />Novo acesso de funcionário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar acesso de colaborador</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = Object.fromEntries(new FormData(e.currentTarget)) as any;
                create.mutate({ email: fd.email, password: fd.password, name: fd.name });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="acc-name">Nome *</Label>
                <Input id="acc-name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-email">E-mail de login *</Label>
                <Input id="acc-email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-password">Senha inicial *</Label>
                <Input id="acc-password" name="password" type="text" minLength={6} required />
                <p className="text-xs text-muted-foreground">Repasse essa senha ao funcionário — ele pode trocá-la depois.</p>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={create.isPending}>{create.isPending ? "Criando..." : "Criar acesso"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && !team?.length && <p className="p-4 text-sm text-muted-foreground">Nenhum acesso de equipe cadastrado ainda.</p>}
        {team?.map((t) => (
          <div key={t.user_id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{t.full_name || t.email}</p>
              <p className="text-xs text-muted-foreground truncate">{t.email} · {t.role === "admin" ? "Administrador" : "Colaborador"}</p>
            </div>
            {t.role !== "admin" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive shrink-0"><Trash2 className="size-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover acesso de {t.full_name || t.email}?</AlertDialogTitle>
                    <AlertDialogDescription>O login deixa de funcionar imediatamente. Essa ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => revoke.mutate(t.user_id)}>Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
