import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-eERwuxp7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as StatusPill } from "./dashboard-DF-HP2dR.mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { n as Label, t as Input } from "./label-DDmitfqC.mjs";
import { v as Download } from "../_libs/lucide-react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as formatDate, t as formatBRL } from "./format-Cwm8imj1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/relatorios-CEg6sXSL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RelatoriosPage() {
	const today = /* @__PURE__ */ new Date();
	const [from, setFrom] = (0, import_react.useState)(new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().slice(0, 10));
	const [to, setTo] = (0, import_react.useState)(today.toISOString().slice(0, 10));
	const { data: orders } = useQuery({
		queryKey: [
			"report",
			from,
			to
		],
		queryFn: async () => {
			const { data } = await supabase.from("service_orders").select("*, clients(name), vehicles(plate, model)").gte("created_at", new Date(from).toISOString()).lte("created_at", (/* @__PURE__ */ new Date(to + "T23:59:59")).toISOString()).order("created_at", { ascending: false });
			return data ?? [];
		}
	});
	const total = orders?.reduce((s, o) => s + (o.status === "concluido" ? Number(o.amount) : 0), 0) ?? 0;
	const completed = orders?.filter((o) => o.status === "concluido").length ?? 0;
	const exportCSV = () => {
		if (!orders || orders.length === 0) return;
		const csv = [[
			"OS",
			"Data",
			"Cliente",
			"Veículo",
			"Serviço",
			"Status",
			"Pagamento",
			"Valor"
		], ...orders.map((o) => [
			`#${String(o.order_number).padStart(4, "0")}`,
			formatDate(o.created_at),
			o.clients?.name ?? "",
			o.vehicles ? `${o.vehicles.model ?? ""} ${o.vehicles.plate ?? ""}`.trim() : "",
			o.service_name,
			o.status,
			o.payment_method,
			String(o.amount).replace(".", ",")
		])].map((r) => r.map((c) => `"${String(c).replace(/"/g, "\"\"")}"`).join(";")).join("\n");
		const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `shinygest-relatorio-${from}-${to}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-8 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex justify-between items-center mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-display font-bold",
					children: "Relatórios"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground mt-1",
					children: "Exporte dados para Excel ou outras ferramentas"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: exportCSV,
					disabled: !orders?.length,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4 mr-2" }), "Exportar CSV"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-card border border-border rounded-xl p-5 mb-6 flex gap-4 items-end",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "r-from",
							children: "De"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "r-from",
							type: "date",
							value: from,
							onChange: (e) => setFrom(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "r-to",
							children: "Até"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "r-to",
							type: "date",
							value: to,
							onChange: (e) => setTo(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex gap-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground uppercase tracking-wider",
							children: "Faturado"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-display font-bold text-success",
							children: formatBRL(total)
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground uppercase tracking-wider",
							children: "Concluídas"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-display font-bold",
							children: completed
						})] })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
								children: "Data"
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
								className: "text-left p-4",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-right p-4",
								children: "Valor"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y divide-border",
						children: [(!orders || orders.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 6,
							className: "p-10 text-center text-muted-foreground",
							children: "Sem dados no período."
						}) }), orders?.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-white/5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "p-4 font-mono text-xs",
									children: ["#", String(o.order_number).padStart(4, "0")]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4 text-xs text-muted-foreground",
									children: formatDate(o.created_at)
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
									className: "p-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: o.status })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4 text-right font-display font-semibold",
									children: formatBRL(Number(o.amount))
								})
							]
						}, o.id))]
					})]
				})
			})
		]
	});
}
//#endregion
export { RelatoriosPage as component };
