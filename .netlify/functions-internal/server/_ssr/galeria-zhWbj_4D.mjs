import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-eERwuxp7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as formatDate } from "./format-Cwm8imj1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/galeria-zhWbj_4D.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GaleriaPage() {
	const { data: orders } = useQuery({
		queryKey: ["gallery"],
		queryFn: async () => {
			const { data } = await supabase.from("service_orders").select("id, order_number, service_name, created_at, clients(name), vehicles(brand, model, plate), service_photos(id, kind, storage_path)").order("created_at", { ascending: false }).limit(50);
			return (data ?? []).filter((o) => (o.service_photos ?? []).length > 0);
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-8 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-display font-bold",
					children: "Galeria Antes & Depois"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground mt-1",
					children: "Repositório visual dos resultados — perfeito para compartilhar."
				})]
			}),
			(!orders || orders.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-card/50 border border-border rounded-xl p-16 text-center text-muted-foreground",
				children: [
					"Nenhuma OS com fotos ainda. Vá em ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Ordens de Serviço" }),
					" e adicione fotos antes/depois."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-10",
				children: orders?.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GalleryItem, { order: o }, o.id))
			})
		]
	});
}
function GalleryItem({ order }) {
	const [urls, setUrls] = (0, import_react.useState)({});
	(0, import_react.useEffect)(() => {
		(async () => {
			const map = {};
			for (const p of order.service_photos) {
				const { data } = await supabase.storage.from("service-photos").createSignedUrl(p.storage_path, 3600);
				if (data) map[p.id] = data.signedUrl;
			}
			setUrls(map);
		})();
	}, [order]);
	const antes = order.service_photos.filter((p) => p.kind === "antes");
	const depois = order.service_photos.filter((p) => p.kind === "depois");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "bg-card border border-border rounded-2xl p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-start justify-between mb-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "font-display font-bold text-lg",
				children: [(order.vehicles ? `${order.vehicles.brand ?? ""} ${order.vehicles.model ?? ""}`.trim() : "") || order.service_name, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted-foreground font-normal text-sm ml-2",
					children: ["— ", order.service_name]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted-foreground mt-1",
				children: [
					order.clients?.name,
					" · OS #",
					String(order.order_number).padStart(4, "0"),
					" · ",
					formatDate(order.created_at)
				]
			})] })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 md:grid-cols-2 gap-6",
			children: ["antes", "depois"].map((kind) => {
				const list = kind === "antes" ? antes : depois;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] uppercase tracking-widest font-bold mb-2 text-muted-foreground",
					children: kind
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [list.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "col-span-2 aspect-video bg-secondary/30 border border-dashed border-border rounded-lg grid place-items-center text-xs text-muted-foreground",
						children: "Sem fotos"
					}), list.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: urls[p.id],
						target: "_blank",
						rel: "noreferrer",
						className: "block aspect-square rounded-lg overflow-hidden bg-secondary border border-border hover:border-primary/40 transition-colors",
						children: urls[p.id] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: urls[p.id],
							alt: kind,
							className: "w-full h-full object-cover"
						})
					}, p.id))]
				})] }, kind);
			})
		})]
	});
}
//#endregion
export { GaleriaPage as component };
