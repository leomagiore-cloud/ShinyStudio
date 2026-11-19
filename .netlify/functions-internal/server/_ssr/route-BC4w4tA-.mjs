import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-eERwuxp7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useNavigate, f as Outlet, g as Link, l as useLocation } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime, _ as DialogTrigger, d as DialogClose, f as DialogContent, g as DialogTitle, h as DialogPortal, m as DialogOverlay, p as DialogDescription, u as Dialog } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { r as cn, t as Button } from "./button-PwNqyxv_.mjs";
import { A as Car, F as BellRing, N as CalendarDays, P as CalendarClock, S as ClipboardList, _ as Ellipsis, c as Search, d as MessageCircle, f as Menu, g as Images, h as LayoutDashboard, k as ChartColumn, l as Plus, n as Wrench, p as LogOut, r as Users, t as X, y as DollarSign } from "../_libs/lucide-react.mjs";
import { a as DialogTitle$1, i as DialogHeader, n as DialogContent$1, r as DialogFooter, t as Dialog$1 } from "./dialog-B_1MK0xI.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as format, r as parseISO, t as ptBR } from "../_libs/date-fns.mjs";
import { a as whatsappLink, i as formatTime } from "./format-Cwm8imj1.mjs";
import { t as BOOKING_MARKER } from "./booking.functions-Bxkub8Fp.mjs";
import { n as useAuth } from "./auth-context-DWnGmoIK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-BC4w4tA-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Sheet = Dialog;
var SheetTrigger = DialogTrigger;
var SheetPortal = DialogPortal;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = DialogOverlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = import_react.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = DialogContent.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = DialogTitle.displayName;
var SheetDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = DialogDescription.displayName;
var nav = [
	{
		to: "/dashboard",
		label: "Dashboard",
		icon: LayoutDashboard
	},
	{
		to: "/agenda",
		label: "Agenda",
		icon: CalendarDays
	},
	{
		to: "/clientes",
		label: "Clientes",
		icon: Users
	},
	{
		to: "/veiculos",
		label: "Veículos",
		icon: Car
	},
	{
		to: "/ordens",
		label: "Ordens de Serviço",
		icon: ClipboardList
	},
	{
		to: "/servicos",
		label: "Catálogo",
		icon: Wrench
	},
	{
		to: "/galeria",
		label: "Galeria",
		icon: Images
	},
	{
		to: "/financeiro",
		label: "Financeiro",
		icon: DollarSign
	},
	{
		to: "/relatorios",
		label: "Relatórios",
		icon: ChartColumn
	}
];
var bottomNavLeft = [{
	to: "/dashboard",
	label: "Início",
	icon: LayoutDashboard
}, {
	to: "/agenda",
	label: "Agenda",
	icon: CalendarDays
}];
var bottomNavRight = [{
	to: "/ordens",
	label: "Ordens",
	icon: ClipboardList
}, {
	to: "/clientes",
	label: "Clientes",
	icon: Users
}];
function AppShell({ children }) {
	const loc = useLocation();
	const navigate = useNavigate();
	const { user, signOut } = useAuth();
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const [quickOpen, setQuickOpen] = (0, import_react.useState)(false);
	const initials = (user?.user_metadata?.full_name ?? user?.email ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
	const isActive = (to) => loc.pathname === to || loc.pathname.startsWith(to + "/");
	const NavList = ({ onNavigate }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "flex-1 px-3 space-y-0.5 overflow-y-auto",
		children: nav.map((item) => {
			const active = isActive(item.to);
			const Icon = item.icon;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: item.to,
				onClick: onNavigate,
				className: cn("px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors", active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-4", active && "text-primary") }), item.label]
			}, item.to);
		})
	});
	const UserBlock = ({ onNavigate }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-3 border-t border-sidebar-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3 p-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold shrink-0",
					children: initials
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium truncate",
						children: user?.user_metadata?.full_name ?? user?.email
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground truncate",
						children: user?.email
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: async () => {
						onNavigate?.();
						await signOut();
						navigate({
							to: "/auth",
							replace: true
						});
					},
					className: "text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-white/5 transition-colors shrink-0",
					"aria-label": "Sair",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" })
				})
			]
		})
	});
	const Brand = ({ compact = false }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/dashboard",
		className: "flex items-center gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "size-9 bg-primary rounded-lg flex items-center justify-center font-display font-bold text-white tracking-tighter italic shadow-lg shadow-primary/30 shrink-0",
			children: "S"
		}), !compact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display font-bold text-lg tracking-tight",
			children: "ShinyGest"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] text-muted-foreground uppercase tracking-widest",
			children: "Detailing OS"
		})] })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground lg:flex",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "hidden lg:flex w-64 border-r border-sidebar-border bg-sidebar flex-col fixed inset-y-0 z-30",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavList, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserBlock, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "lg:hidden sticky top-0 z-40 bg-sidebar/95 backdrop-blur border-b border-sidebar-border flex items-center justify-between px-4 h-14",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
					open: menuOpen,
					onOpenChange: setMenuOpen,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "p-2 rounded-md hover:bg-white/5 text-foreground",
							"aria-label": "Abrir menu",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
						side: "right",
						className: "p-0 flex flex-col w-72 bg-sidebar",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
								className: "p-4 border-b border-sidebar-border text-left",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
									className: "font-display",
									children: "Menu"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex-1 flex flex-col py-3 overflow-y-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavList, { onNavigate: () => setMenuOpen(false) })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserBlock, { onNavigate: () => setMenuOpen(false) })
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 lg:ml-64 overflow-x-hidden pb-20 lg:pb-0",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "lg:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar/95 backdrop-blur border-t border-sidebar-border h-16 pb-[env(safe-area-inset-bottom)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-5 h-16",
					children: [
						bottomNavLeft.map((item) => {
							const active = isActive(item.to);
							const Icon = item.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								className: cn("flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors", active ? "text-primary" : "text-muted-foreground hover:text-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), item.label]
							}, item.to);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative flex items-start justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
								open: quickOpen,
								onOpenChange: setQuickOpen,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										"aria-label": "Ações rápidas",
										className: "absolute -top-6 size-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 grid place-items-center border-4 border-background active:scale-95 transition-transform",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-6" })
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
									side: "bottom",
									className: "p-0 bg-sidebar rounded-t-2xl border-sidebar-border",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
										className: "p-5 border-b border-sidebar-border text-left",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
											className: "font-display",
											children: "Ações rápidas"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 grid gap-2 pb-8",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => {
													setQuickOpen(false);
													navigate({ to: "/agenda" });
												},
												className: "flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/40 active:scale-[0.98] transition-all text-left",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "size-11 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { className: "size-5 text-primary" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-semibold text-sm",
														children: "Agenda do dia"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-muted-foreground truncate",
														children: "Ver compromissos de hoje"
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => {
													setQuickOpen(false);
													navigate({
														to: "/agenda",
														search: { new: "1" }
													});
												},
												className: "flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/40 active:scale-[0.98] transition-all text-left",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "size-11 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5 text-primary" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-semibold text-sm",
														children: "Novo agendamento"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-muted-foreground truncate",
														children: "Abrir formulário rápido"
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => {
													setQuickOpen(false);
													navigate({
														to: "/veiculos",
														search: { focus: "1" }
													});
												},
												className: "flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/40 active:scale-[0.98] transition-all text-left",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "size-11 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-5 text-primary" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-semibold text-sm",
														children: "Buscar por placa"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-muted-foreground truncate",
														children: "Consulta rápida de veículo"
													})]
												})]
											})
										]
									})]
								})]
							})
						}),
						bottomNavRight.map((item) => {
							const active = isActive(item.to);
							const Icon = item.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								className: cn("flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors", active ? "text-primary" : "text-muted-foreground hover:text-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), item.label]
							}, item.to);
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setMenuOpen(true),
					className: "absolute right-2 top-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors",
					"aria-label": "Mais",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-4" })
				})]
			})
		]
	});
}
var ACK_KEY = "shinygest:reminders:ack";
function loadAck() {
	try {
		return JSON.parse(localStorage.getItem(ACK_KEY) ?? "{}");
	} catch {
		return {};
	}
}
function saveAck(map) {
	const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 200);
	localStorage.setItem(ACK_KEY, JSON.stringify(Object.fromEntries(entries)));
}
function AppointmentReminder() {
	const [active, setActive] = (0, import_react.useState)(null);
	const [tick, setTick] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const i = setInterval(() => setTick((t) => t + 1), 2e4);
		return () => clearInterval(i);
	}, []);
	const { data: due } = useQuery({
		queryKey: ["due-appointments", tick],
		queryFn: async () => {
			const now = /* @__PURE__ */ new Date();
			const from = (/* @__PURE__ */ new Date(now.getTime() - 6e4)).toISOString();
			const to = new Date(now.getTime() + 3e4).toISOString();
			const { data } = await supabase.from("appointments").select("id, title, starts_at, status, notes, clients(name, phone, whatsapp), vehicles(model, plate)").gte("starts_at", from).lte("starts_at", to).in("status", ["pendente", "confirmado"]).order("starts_at");
			return data ?? [];
		},
		refetchInterval: 2e4
	});
	(0, import_react.useEffect)(() => {
		if (active || !due?.length) return;
		const ack = loadAck();
		const next = due.find((a) => !ack[a.id]);
		if (next) setActive(next);
	}, [due, active]);
	if (!active) return null;
	const phone = active.clients?.whatsapp || active.clients?.phone || "";
	const firstName = (active.clients?.name ?? "").split(" ")[0];
	const vehicleLabel = active.vehicles ? [active.vehicles.model, active.vehicles.plate].filter(Boolean).join(" - ") : "";
	const msg = `Olá ${firstName}! 👋\n\nPassando para lembrar do seu agendamento na *Shiny Studio* hoje às *${formatTime(active.starts_at)}*.\n\n🧾 Serviço: ${active.title}` + (vehicleLabel ? `\n🚗 Veículo: ${vehicleLabel}` : "") + "\n\nSeu horário está reservado e já estamos te aguardando. Caso precise remarcar ou tenha algum imprevisto, por favor nos avise por aqui.\n\nAté já! ✨";
	const dismiss = () => {
		const ack = loadAck();
		ack[active.id] = Date.now();
		saveAck(ack);
		setActive(null);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog$1, {
		open: true,
		onOpenChange: (o) => !o && dismiss(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
			className: "max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto size-12 rounded-full bg-primary/15 grid place-items-center mb-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellRing, { className: "size-6 text-primary" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
					className: "text-center text-xl font-display",
					children: "Horário agendado para agora"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center space-y-2 py-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-display font-bold text-primary",
							children: formatTime(active.starts_at)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: active.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted-foreground",
							children: [active.clients?.name, active.vehicles && ` · ${[active.vehicles.model, active.vehicles.plate].filter(Boolean).join(" · ")}`]
						}),
						active.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground italic",
							children: [
								"\"",
								active.notes,
								"\""
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "sm:justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: dismiss,
						className: "flex-1",
						children: "Fechar"
					}), phone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						className: "flex-1 bg-[#25D366] hover:bg-[#1ebe5a] text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: whatsappLink(phone, msg),
							target: "_blank",
							rel: "noreferrer",
							onClick: dismiss,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-4 mr-2" }), "WhatsApp"]
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: true,
						className: "flex-1",
						children: "Sem WhatsApp"
					})]
				})
			]
		})
	});
}
var SEEN_KEY = "shinygest.online-bookings.seen";
function getSeen() {
	try {
		return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]"));
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
function markSeen(id) {
	const s = getSeen();
	s.add(id);
	localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-200)));
}
function OnlineBookingNotifier() {
	const [mounted, setMounted] = (0, import_react.useState)(false);
	const timer = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => setMounted(true), []);
	(0, import_react.useEffect)(() => {
		if (!mounted) return;
		async function poll() {
			const since = (/* @__PURE__ */ new Date(Date.now() - 1440 * 60 * 1e3)).toISOString();
			const { data } = await supabase.from("appointments").select("id, starts_at, title, notes, clients(name, whatsapp, phone), vehicles(plate, model)").gte("created_at", since).ilike("notes", `${BOOKING_MARKER}%`).order("created_at", { ascending: false }).limit(20);
			const seen = getSeen();
			data?.forEach((row) => {
				if (seen.has(row.id)) return;
				markSeen(row.id);
				const name = row.clients?.name ?? "Cliente";
				const phone = row.clients?.whatsapp ?? row.clients?.phone ?? "";
				const when = format(parseISO(row.starts_at), "d/MM 'às' HH:mm", { locale: ptBR });
				const msg = `Olá ${name}! Recebemos seu pedido de agendamento na Shiny Studio para *${when}* (${row.title ?? "serviço"}${row.vehicles?.plate ? ` — ${row.vehicles.plate}` : ""}). Estamos confirmando! ✨`;
				const link = phone ? whatsappLink(phone, msg) : null;
				toast(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-9 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellRing, { className: "size-4 text-primary" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-sm",
								children: "Novo agendamento online"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground truncate",
								children: [
									name,
									" — ",
									row.title ?? "Serviço",
									" • ",
									when
								]
							}),
							link && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: link,
								target: "_blank",
								rel: "noreferrer",
								className: "mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#25D366] text-white text-xs font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-3.5" }), "Confirmar por WhatsApp"]
							})
						]
					})]
				}), { duration: 15e3 });
			});
		}
		poll();
		timer.current = window.setInterval(poll, 3e4);
		return () => {
			if (timer.current) clearInterval(timer.current);
		};
	}, [mounted]);
	return null;
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppointmentReminder, {}),
	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnlineBookingNotifier, {})
] });
//#endregion
export { SplitComponent as component };
