import { t as supabase } from "./client-eERwuxp7.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { A as Car, M as Calendar, a as TrendingUp, b as Copy, l as Plus, s as Share2, y as DollarSign } from "../_libs/lucide-react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { o as startOfMonth, s as endOfMonth, u as startOfDay } from "../_libs/date-fns.mjs";
import { t as formatBRL } from "./format-Cwm8imj1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-BWudI8wS.js
var import_jsx_runtime = require_jsx_runtime();
function DashboardPage() {
	const { data: stats } = useQuery({
		queryKey: ["dashboard-stats"],
		queryFn: async () => {
			const now = /* @__PURE__ */ new Date();
			const monthStart = startOfMonth(now).toISOString();
			const monthEnd = endOfMonth(now).toISOString();
			const todayStart = startOfDay(now).toISOString();
			const [orders, todayApts, monthOrders, clients] = await Promise.all([
				supabase.from("service_orders").select("id, amount, status, created_at").gte("created_at", monthStart).lte("created_at", monthEnd),
				supabase.from("appointments").select("id").gte("starts_at", todayStart),
				supabase.from("service_orders").select("amount").gte("created_at", monthStart).lte("created_at", monthEnd).eq("status", "concluido"),
				supabase.from("clients").select("id", {
					count: "exact",
					head: true
				})
			]);
			const revenue = (monthOrders.data ?? []).reduce((s, o) => s + Number(o.amount ?? 0), 0);
			const completedCount = (orders.data ?? []).filter((o) => o.status === "concluido").length;
			return {
				revenue,
				completedCount,
				ticket: completedCount ? revenue / completedCount : 0,
				clientsCount: clients.count ?? 0,
				todayApts: todayApts.data?.length ?? 0
			};
		}
	});
	const { data: activeOrders } = useQuery({
		queryKey: ["active-orders"],
		queryFn: async () => {
			const { data } = await supabase.from("service_orders").select("id, order_number, service_name, status, amount, created_at, clients(name), vehicles(model, brand, plate)").in("status", [
				"pendente",
				"confirmado",
				"em_andamento"
			]).order("created_at", { ascending: false }).limit(6);
			return data ?? [];
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-8 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex justify-between items-center mb-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-display font-bold",
					children: "Painel Geral"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground mt-1",
					children: "Visão completa do estúdio hoje"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/ordens",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4 mr-2" }), "Nova Ordem de Serviço"]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublicBookingLinkCard, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Faturamento / Mês",
						value: formatBRL(stats?.revenue ?? 0),
						icon: DollarSign,
						accent: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Ticket Médio",
						value: formatBRL(stats?.ticket ?? 0),
						icon: TrendingUp
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Concluídos no Mês",
						value: String(stats?.completedCount ?? 0),
						icon: Car
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Agendados Hoje",
						value: String(stats?.todayApts ?? 0),
						icon: Calendar
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-12 gap-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "col-span-12 lg:col-span-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-center mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-lg font-display font-bold",
								children: "Ordens em Andamento"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/ordens",
								className: "text-xs text-primary font-semibold",
								children: "Ver todas"
							})]
						}),
						(!activeOrders || activeOrders.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-card/50 border border-border rounded-xl p-10 text-center text-muted-foreground",
							children: [
								"Nenhuma ordem em andamento. ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/ordens",
									className: "text-primary font-medium",
									children: "Crie a primeira"
								}),
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: activeOrders?.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-card/50 p-4 rounded-xl border border-border flex items-center gap-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "size-14 rounded-lg bg-secondary border border-border shrink-0 grid place-items-center text-xs font-mono text-muted-foreground",
										children: ["#", String(o.order_number).padStart(4, "0")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between items-start mb-1 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "font-semibold truncate",
												children: o.vehicles ? `${o.vehicles.brand ?? ""} ${o.vehicles.model ?? ""}`.trim() : "Veículo não vinculado"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: o.status })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm text-muted-foreground truncate",
											children: [
												o.clients?.name ?? "—",
												" · ",
												o.service_name,
												o.vehicles?.plate && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ml-2 font-mono text-xs",
													children: o.vehicles.plate
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-right min-w-24",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold text-foreground font-display",
											children: formatBRL(Number(o.amount))
										})
									})
								]
							}, o.id))
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: "col-span-12 lg:col-span-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-card p-6 rounded-2xl border border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-display font-bold mb-4",
							children: "Atalhos rápidos"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickLink, {
									to: "/agenda",
									label: "Abrir agenda"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickLink, {
									to: "/clientes",
									label: "Cadastrar cliente"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickLink, {
									to: "/veiculos",
									label: "Cadastrar veículo"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickLink, {
									to: "/galeria",
									label: "Ver galeria antes/depois"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickLink, {
									to: "/financeiro",
									label: "Conferir financeiro"
								})
							]
						})]
					})
				})]
			})
		]
	});
}
function StatCard({ label, value, icon: Icon, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-card p-5 rounded-xl border border-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between mb-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `size-4 ${accent ? "text-primary" : "text-muted-foreground"}` })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-2xl font-display font-bold",
			children: value
		})]
	});
}
function QuickLink({ to, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "flex items-center justify-between p-3 rounded-lg bg-secondary/40 hover:bg-secondary text-sm font-medium transition-colors",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-primary",
			children: "→"
		})]
	});
}
function StatusPill({ status }) {
	const map = {
		pendente: "border-muted-foreground/30 text-muted-foreground",
		confirmado: "border-info/40 text-info",
		em_andamento: "border-primary/40 text-primary",
		concluido: "border-success/40 text-success",
		cancelado: "border-destructive/40 text-destructive"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `px-2 py-0.5 border text-[10px] font-bold rounded-full uppercase tracking-tighter shrink-0 ${map[status] ?? map.pendente}`,
		children: {
			pendente: "Pendente",
			confirmado: "Confirmado",
			em_andamento: "Em andamento",
			concluido: "Concluído",
			cancelado: "Cancelado"
		}[status] ?? status
	});
}
function PublicBookingLinkCard() {
	const url = typeof window !== "undefined" ? `${window.location.origin}/agendar` : "/agendar";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-8 bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "size-11 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-5 text-primary" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-semibold text-sm",
					children: "Link público de agendamento"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground truncate",
					children: ["Compartilhe com clientes para agendarem sozinhos: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-foreground font-mono",
						children: url
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => {
						navigator.clipboard.writeText(url);
						toast.success("Link copiado!");
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5 mr-1.5" }), " Copiar"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					size: "sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/agendar",
						target: "_blank",
						rel: "noreferrer",
						children: "Abrir"
					})
				})]
			})
		]
	});
}
//#endregion
export { StatusPill, DashboardPage as component };
