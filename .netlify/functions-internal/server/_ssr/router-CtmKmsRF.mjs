import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-eERwuxp7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, j as redirect, m as createFileRoute, p as lazyRouteComponent, s as Scripts, v as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Route$13 } from "./dashboard-DF-HP2dR.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { t as AuthProvider } from "./auth-context-DWnGmoIK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CtmKmsRF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-D4sxS2dI.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground font-display",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Página não encontrada"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "A página que você procura não existe ou foi movida."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Voltar ao início"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "Esta página não carregou"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Algo deu errado. Tente recarregar ou volte ao início."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Tentar novamente"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Início"
					})]
				})
			]
		})
	});
}
var Route$12 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "ShinyGest — Gestão para Estúdios de Estética Automotiva" },
			{
				name: "description",
				content: "Plataforma completa para estúdios de detailing: agenda visual, clientes, veículos, ordens de serviço com fotos antes/depois e financeiro."
			},
			{
				name: "author",
				content: "ShinyGest"
			},
			{
				property: "og:title",
				content: "ShinyGest — Gestão para Estúdios de Estética Automotiva"
			},
			{
				property: "og:description",
				content: "Plataforma completa para estúdios de detailing: agenda visual, clientes, veículos, ordens de serviço com fotos antes/depois e financeiro."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:title",
				content: "ShinyGest — Gestão para Estúdios de Estética Automotiva"
			},
			{
				name: "twitter:description",
				content: "Plataforma completa para estúdios de detailing: agenda visual, clientes, veículos, ordens de serviço com fotos antes/depois e financeiro."
			},
			{
				property: "og:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/950c3e3d-6328-4d00-b561-b4e0808211f4/id-preview-69a0d5cc--486d62f8-a7de-4a81-9f59-fa6f1bde9cdb.lovable.app-1782999773792.png"
			},
			{
				name: "twitter:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/950c3e3d-6328-4d00-b561-b4e0808211f4/id-preview-69a0d5cc--486d62f8-a7de-4a81-9f59-fa6f1bde9cdb.lovable.app-1782999773792.png"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: ""
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "pt-BR",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$12.useRouteContext();
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((event) => {
			if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
				router.invalidate();
				if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
			}
		});
		return () => sub.subscription.unsubscribe();
	}, [router, queryClient]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
			richColors: true,
			theme: "dark"
		})] })
	});
}
var $$splitComponentImporter$11 = () => import("./auth-CcwEz5p5.mjs");
var Route$11 = createFileRoute("/auth")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./agendar-CHUHt6PQ.mjs");
var Route$10 = createFileRoute("/agendar")({
	head: () => ({ meta: [{ title: "Agendar horário — ShinyGest" }, {
		name: "description",
		content: "Escolha o serviço, dia e horário disponíveis para agendar seu detailing."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./route-BC4w4tA-.mjs");
var Route$9 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({ to: "/auth" });
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./routes-DTEZEvkE.mjs");
var Route$8 = createFileRoute("/")({
	ssr: false,
	beforeLoad: async () => {
		const { data } = await supabase.auth.getSession();
		if (data.session) throw redirect({ to: "/dashboard" });
		throw redirect({ to: "/auth" });
	},
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./veiculos-A-v4lNIZ.mjs");
var Route$7 = createFileRoute("/_authenticated/veiculos")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./servicos-CwDe3mFH.mjs");
var Route$6 = createFileRoute("/_authenticated/servicos")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./relatorios-CEg6sXSL.mjs");
var Route$5 = createFileRoute("/_authenticated/relatorios")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./ordens-BTv3vtEN.mjs");
var Route$4 = createFileRoute("/_authenticated/ordens")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./galeria-zhWbj_4D.mjs");
var Route$3 = createFileRoute("/_authenticated/galeria")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./financeiro-BcWcuxhW.mjs");
var Route$2 = createFileRoute("/_authenticated/financeiro")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./clientes-Dwuf09tN.mjs");
var Route$1 = createFileRoute("/_authenticated/clientes")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./agenda-sNTJd6gB.mjs");
var Route = createFileRoute("/_authenticated/agenda")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var AuthRoute = Route$11.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$12
});
var AgendarRoute = Route$10.update({
	id: "/agendar",
	path: "/agendar",
	getParentRoute: () => Route$12
});
var AuthenticatedRouteRoute = Route$9.update({
	id: "/_authenticated",
	getParentRoute: () => Route$12
});
var IndexRoute = Route$8.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$12
});
var AuthenticatedVeiculosRoute = Route$7.update({
	id: "/veiculos",
	path: "/veiculos",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedServicosRoute = Route$6.update({
	id: "/servicos",
	path: "/servicos",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedRelatoriosRoute = Route$5.update({
	id: "/relatorios",
	path: "/relatorios",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedOrdensRoute = Route$4.update({
	id: "/ordens",
	path: "/ordens",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedGaleriaRoute = Route$3.update({
	id: "/galeria",
	path: "/galeria",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedFinanceiroRoute = Route$2.update({
	id: "/financeiro",
	path: "/financeiro",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedDashboardRoute = Route$13.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedClientesRoute = Route$1.update({
	id: "/clientes",
	path: "/clientes",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedAgendaRoute: Route.update({
		id: "/agenda",
		path: "/agenda",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedClientesRoute,
	AuthenticatedDashboardRoute,
	AuthenticatedFinanceiroRoute,
	AuthenticatedGaleriaRoute,
	AuthenticatedOrdensRoute,
	AuthenticatedRelatoriosRoute,
	AuthenticatedServicosRoute,
	AuthenticatedVeiculosRoute
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AgendarRoute,
	AuthRoute
};
var routeTree = Route$12._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
