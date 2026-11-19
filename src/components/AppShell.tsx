import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Users2,
  Car,
  ClipboardList,
  Images,
  DollarSign,
  BarChart3,
  Wrench,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Search,
  CalendarClock,
  Settings,
  Bell,
} from "lucide-react";
import { useState, type ReactNode, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BOOKING_MARKER } from "@/lib/booking.functions";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Operação" },
  { to: "/agenda", label: "Agenda", icon: CalendarDays, section: "Operação" },
  { to: "/ordens", label: "Ordens de Serviço", icon: ClipboardList, section: "Operação" },
  { to: "/clientes", label: "Clientes", icon: Users, section: "Operação" },
  { to: "/veiculos", label: "Veículos", icon: Car, section: "Operação" },
  { to: "/servicos", label: "Catálogo", icon: Wrench, section: "Gestão" },
  { to: "/galeria", label: "Galeria", icon: Images, section: "Gestão" },
  { to: "/financeiro", label: "Financeiro", icon: DollarSign, section: "Gestão", adminOnly: true },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, section: "Gestão", adminOnly: true },
  { to: "/funcionarios", label: "Funcionários", icon: Users2, section: "Gestão", adminOnly: true },
  { to: "/notificacoes", label: "Notificações", icon: Bell, section: "Sistema" },
  { to: "/configuracoes", label: "Configurações", icon: Settings, section: "Sistema" },
] as const;

const bottomNavLeft = [
  { to: "/dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
] as const;

const bottomNavRight = [
  { to: "/ordens", label: "Ordens", icon: ClipboardList },
  { to: "/clientes", label: "Clientes", icon: Users },
] as const;

/** Fora do AppShell — evita perder o foco a cada tecla */
function PlateSearch({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="px-3 pb-2">
      <div className="relative">
        <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="Buscar placa..."
          className="h-9 pl-8 text-xs uppercase tracking-wide"
          maxLength={10}
          autoComplete="off"
        />
      </div>
    </form>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const visibleNav = nav.filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin);
  const qc = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [plateQ, setPlateQ] = useState("");

  const searchPlate = (e: FormEvent) => {
    e.preventDefault();
    const q = plateQ.trim().toUpperCase();
    if (!q) return;
    setMenuOpen(false);
    navigate({ to: "/veiculos", search: { plate: q } as any });
    setPlateQ("");
  };

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("studio_name")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const studioName = profile?.studio_name || "Meu Estúdio";

  const renameStudio = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ studio_name: name })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Nome atualizado");
      setBrandOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isActive = (to: string) => loc.pathname === to || loc.pathname.startsWith(to + "/");

  const { data: pendingBookings } = useQuery({
    queryKey: ["pending-online-bookings"],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pendente")
        .ilike("notes", `${BOOKING_MARKER}%`)
        .gte("created_at", since);
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });
  const pendingCount = pendingBookings ?? 0;

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => {
    let lastSection = "";
    return (
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;
          const isAgendaPending =
            (item.to === "/agenda" || item.to === "/notificacoes") && pendingCount > 0;
          const showSection = item.section !== lastSection;
          lastSection = item.section;

          return (
            <div key={item.to}>
              {showSection && (
                <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {item.section}
                </p>
              )}
              <Link
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  "px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors",
                  isAgendaPending
                    ? "text-destructive hover:bg-destructive/10"
                    : active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    active && !isAgendaPending && "text-primary",
                    isAgendaPending && "text-destructive",
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {isAgendaPending && (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>
    );
  };

  const UserBlock = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="p-3 border-t border-sidebar-border">
      <div className="flex items-center gap-3 p-2">
        <div className="size-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {user?.user_metadata?.full_name ?? user?.email}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <button
          onClick={async () => {
            onNavigate?.();
            await signOut();
            navigate({ to: "/auth", replace: true });
          }}
          className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-white/5 transition-colors shrink-0"
          aria-label="Sair"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );

  const Brand = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex items-center gap-3">
      <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
        <div className="size-9 bg-primary rounded-lg flex items-center justify-center font-display font-bold text-white tracking-tighter italic shadow-lg shadow-primary/30 shrink-0">
          S
        </div>
        {!compact && (
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg tracking-tight truncate">{studioName}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Detailing OS</p>
          </div>
        )}
      </Link>
      {!compact && (
        <button
          onClick={() => setBrandOpen(true)}
          className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-white/5 transition-colors shrink-0"
          aria-label="Editar nome do estúdio"
        >
          <Pencil className="size-3" />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 border-r border-sidebar-border bg-sidebar flex-col fixed inset-y-0 z-30">
        <div className="p-6 pb-3">
          <Brand />
        </div>
        <PlateSearch value={plateQ} onChange={setPlateQ} onSubmit={searchPlate} />
        <NavList />
        <UserBlock />
      </aside>

      {/* Top bar mobile */}
      <header className="lg:hidden sticky top-0 z-40 bg-sidebar/95 backdrop-blur border-b border-sidebar-border flex items-center justify-between px-4 h-14">
        <Brand />
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="p-2 rounded-md hover:bg-white/5 text-foreground"
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 flex flex-col w-72 bg-sidebar">
            <SheetHeader className="p-4 border-b border-sidebar-border text-left">
              <SheetTitle className="font-display">Menu</SheetTitle>
            </SheetHeader>
            <div className="pt-3">
              <PlateSearch value={plateQ} onChange={setPlateQ} onSubmit={searchPlate} />
            </div>
            <div className="flex-1 flex flex-col py-1 overflow-y-auto">
              <NavList onNavigate={() => setMenuOpen(false)} />
            </div>
            <UserBlock onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="flex-1 lg:ml-64 overflow-x-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar/95 backdrop-blur border-t border-sidebar-border h-16 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16">
          {bottomNavLeft.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}

          <div className="relative flex items-start justify-center">
            <Sheet open={quickOpen} onOpenChange={setQuickOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Ações rápidas"
                  className="absolute -top-6 size-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 grid place-items-center border-4 border-background active:scale-95 transition-transform"
                >
                  <Plus className="size-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="p-0 bg-sidebar rounded-t-2xl border-sidebar-border">
                <SheetHeader className="p-5 border-b border-sidebar-border text-left">
                  <SheetTitle className="font-display">Ações rápidas</SheetTitle>
                </SheetHeader>
                <div className="p-4 grid gap-2 pb-8">
                  <button
                    onClick={() => {
                      setQuickOpen(false);
                      navigate({ to: "/agenda" });
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/40 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="size-11 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0">
                      <CalendarClock className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">Agenda do dia</p>
                      <p className="text-xs text-muted-foreground truncate">Ver compromissos de hoje</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setQuickOpen(false);
                      navigate({ to: "/agenda", search: { new: "1" } as any });
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/40 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="size-11 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0">
                      <Plus className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">Novo agendamento</p>
                      <p className="text-xs text-muted-foreground truncate">Abrir formulário rápido</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setQuickOpen(false);
                      navigate({ to: "/veiculos", search: { focus: "1" } as any });
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/40 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="size-11 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0">
                      <Search className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">Buscar por placa</p>
                      <p className="text-xs text-muted-foreground truncate">Consulta rápida de veículo</p>
                    </div>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {bottomNavRight.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Dialog open={brandOpen} onOpenChange={setBrandOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nome do estúdio</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = new FormData(e.currentTarget).get("studio_name") as string;
              if (name?.trim()) renameStudio.mutate(name.trim());
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="studio_name">Esse nome aparece no menu do sistema</Label>
              <Input
                id="studio_name"
                name="studio_name"
                defaultValue={studioName}
                maxLength={60}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={renameStudio.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}