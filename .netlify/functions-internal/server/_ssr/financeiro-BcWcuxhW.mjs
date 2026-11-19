import { t as supabase } from "./client-eERwuxp7.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as StatusPill } from "./dashboard-DF-HP2dR.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { d as startOfWeek, o as startOfMonth, u as startOfDay } from "../_libs/date-fns.mjs";
import { n as formatDate, t as formatBRL } from "./format-Cwm8imj1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/financeiro-BcWcuxhW.js
var import_jsx_runtime = require_jsx_runtime();
var labels = {
	dinheiro: "Dinheiro",
	pix: "PIX",
	cartao_credito: "Cartão crédito",
	cartao_debito: "Cartão débito",
	transferencia: "Transferência",
	pendente: "A receber"
};
function FinanceiroPage() {
	const { data: orders } = useQuery({
		queryKey: ["finance-orders"],
		queryFn: async () => (await supabase.from("service_orders").select("*, clients(name)").order("created_at", { ascending: false }).limit(200)).data ?? []
	});
	const now = /* @__PURE__ */ new Date();
	const dayStart = startOfDay(now).getTime();
	const weekStart = startOfWeek(now, { weekStartsOn: 1 }).getTime();
	const monthStart = startOfMonth(now).getTime();
	const concluded = orders?.filter((o) => o.status === "concluido") ?? [];
	const sum = (list) => list.reduce((s, o) => s + Number(o.amount ?? 0), 0);
	const today = sum(concluded.filter((o) => new Date(o.created_at).getTime() >= dayStart));
	const week = sum(concluded.filter((o) => new Date(o.created_at).getTime() >= weekStart));
	const month = sum(concluded.filter((o) => new Date(o.created_at).getTime() >= monthStart));
	const receivable = orders?.filter((o) => o.payment_method === "pendente" && o.status !== "cancelado") ?? [];
	const receivableTotal = sum(receivable);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-8 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-display font-bold",
					children: "Financeiro"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground mt-1",
					children: "Faturamento e contas a receber"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Hoje",
						value: formatBRL(today)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Esta semana",
						value: formatBRL(week)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Este mês",
						value: formatBRL(month),
						accent: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "A receber",
						value: formatBRL(receivableTotal),
						sub: `${receivable.length} OS`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display font-bold text-lg mb-4",
					children: "Contas a receber"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-card border border-border rounded-xl overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-left p-4",
									children: "OS"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-left p-4",
									children: "Cliente"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-left p-4",
									children: "Serviço"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-right p-4",
									children: "Valor"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "divide-y divide-border",
							children: [receivable.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 4,
								className: "p-8 text-center text-muted-foreground",
								children: "Tudo em dia!"
							}) }), receivable.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "hover:bg-white/5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "p-4 font-mono text-xs",
										children: ["#", String(o.order_number).padStart(4, "0")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-4",
										children: o.clients?.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-4 text-muted-foreground",
										children: o.service_name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-4 text-right font-display font-semibold",
										children: formatBRL(Number(o.amount))
									})
								]
							}, o.id))]
						})]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display font-bold text-lg mb-4",
				children: "Últimos lançamentos"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-card border border-border rounded-xl overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left p-4",
								children: "Data"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left p-4",
								children: "Cliente"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left p-4",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left p-4",
								children: "Pagamento"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-right p-4",
								children: "Valor"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "divide-y divide-border",
						children: orders?.slice(0, 30).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-white/5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4 text-xs text-muted-foreground",
									children: formatDate(o.created_at)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4",
									children: o.clients?.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: o.status })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4 text-xs text-muted-foreground",
									children: labels[o.payment_method] ?? o.payment_method
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4 text-right font-display font-semibold",
									children: formatBRL(Number(o.amount))
								})
							]
						}, o.id))
					})]
				})
			})] })
		]
	});
}
function Stat({ label, value, sub, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `p-5 rounded-xl border ${accent ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-2xl font-display font-bold",
				children: value
			}),
			sub && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground mt-1",
				children: sub
			})
		]
	});
}
//#endregion
export { FinanceiroPage as component };
