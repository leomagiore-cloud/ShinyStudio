import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-eERwuxp7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { r as cn, t as Button } from "./button-PwNqyxv_.mjs";
import { n as Label, t as Input } from "./label-DDmitfqC.mjs";
import { m as LoaderCircle } from "../_libs/lucide-react.mjs";
import { a as objectType, o as stringType } from "../_libs/zod.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-CcwEz5p5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content.displayName;
var credSchema = objectType({
	email: stringType().email("E-mail inválido").max(255),
	password: stringType().min(6, "Mínimo de 6 caracteres").max(72)
});
var signupSchema = credSchema.extend({ fullName: stringType().trim().min(2, "Informe seu nome").max(80) });
function AuthPage() {
	const navigate = useNavigate();
	const [loading, setLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => {
			if (data.session) navigate({
				to: "/dashboard",
				replace: true
			});
		});
	}, [navigate]);
	const handleSignIn = async (e) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const parsed = credSchema.safeParse({
			email: fd.get("email"),
			password: fd.get("password")
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0].message);
			return;
		}
		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword(parsed.data);
		setLoading(false);
		if (error) {
			toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message);
			return;
		}
		toast.success("Bem-vindo de volta!");
		navigate({
			to: "/dashboard",
			replace: true
		});
	};
	const handleSignUp = async (e) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const parsed = signupSchema.safeParse({
			email: fd.get("email"),
			password: fd.get("password"),
			fullName: fd.get("fullName")
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0].message);
			return;
		}
		setLoading(true);
		const { error } = await supabase.auth.signUp({
			email: parsed.data.email,
			password: parsed.data.password,
			options: {
				emailRedirectTo: window.location.origin,
				data: { full_name: parsed.data.fullName }
			}
		});
		setLoading(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Conta criada! Verifique seu e-mail caso a confirmação esteja ativa.");
		navigate({
			to: "/dashboard",
			replace: true
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,oklch(0.585_0.222_277/0.15),transparent_50%),radial-gradient(circle_at_80%_70%,oklch(0.585_0.222_277/0.08),transparent_50%)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 mb-8 justify-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-10 bg-primary rounded-lg flex items-center justify-center font-display font-bold text-white tracking-tighter italic text-xl shadow-lg shadow-primary/30",
						children: "S"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display font-bold text-2xl tracking-tight",
						children: "ShinyGest"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Gestão para estúdios de detailing"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-card border border-border rounded-2xl p-6 shadow-2xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
						defaultValue: "signin",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
								className: "grid grid-cols-2 w-full mb-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "signin",
									children: "Entrar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "signup",
									children: "Criar conta"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "signin",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: handleSignIn,
									className: "space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "si-email",
												children: "E-mail"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "si-email",
												name: "email",
												type: "email",
												placeholder: "voce@estudio.com",
												required: true
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "si-password",
												children: "Senha"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "si-password",
												name: "password",
												type: "password",
												placeholder: "••••••••",
												required: true
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											className: "w-full",
											disabled: loading,
											children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : "Entrar"
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "signup",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: handleSignUp,
									className: "space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "su-name",
												children: "Nome completo"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "su-name",
												name: "fullName",
												placeholder: "Seu nome",
												required: true
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "su-email",
												children: "E-mail"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "su-email",
												name: "email",
												type: "email",
												placeholder: "voce@estudio.com",
												required: true
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "su-password",
												children: "Senha"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "su-password",
												name: "password",
												type: "password",
												placeholder: "Mínimo 6 caracteres",
												required: true
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											className: "w-full",
											disabled: loading,
											children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : "Criar conta"
										})
									]
								})
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-xs text-muted-foreground mt-6",
					children: "O primeiro usuário cadastrado vira Admin do estúdio."
				})
			]
		})]
	});
}
//#endregion
export { AuthPage as component };
