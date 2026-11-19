import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-DF-HP2dR.js
var import_jsx_runtime = require_jsx_runtime();
var $$splitComponentImporter = () => import("./dashboard-BWudI8wS.mjs");
var Route = createFileRoute("/_authenticated/dashboard")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
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
//#endregion
export { StatusPill as n, Route as t };
