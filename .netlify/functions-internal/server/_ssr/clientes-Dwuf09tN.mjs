import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-eERwuxp7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { n as Label, t as Input } from "./label-DDmitfqC.mjs";
import { t as Textarea } from "./textarea-DjqHhWkA.mjs";
import { c as Search, d as MessageCircle, l as Plus, o as Trash2, u as Pencil } from "../_libs/lucide-react.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-B_1MK0xI.mjs";
import { a as objectType, i as literalType, o as stringType } from "../_libs/zod.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as whatsappLink } from "./format-Cwm8imj1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clientes-Dwuf09tN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var schema = objectType({
	name: stringType().trim().min(2, "Nome muito curto").max(120),
	phone: stringType().trim().max(30).optional().or(literalType("")),
	whatsapp: stringType().trim().max(30).optional().or(literalType("")),
	email: stringType().trim().email("E-mail inválido").max(255).optional().or(literalType("")),
	notes: stringType().trim().max(1e3).optional().or(literalType(""))
});
function ClientesPage() {
	const qc = useQueryClient();
	const [search, setSearch] = (0, import_react.useState)("");
	const [open, setOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const { data: clients } = useQuery({
		queryKey: ["clients", search],
		queryFn: async () => {
			let q = supabase.from("clients").select("*, vehicles(id, plate, model)").order("created_at", { ascending: false });
			if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
			const { data, error } = await q;
			if (error) throw error;
			return data ?? [];
		}
	});
	const upsert = useMutation({
		mutationFn: async (input) => {
			const parsed = schema.parse(input);
			const payload = {
				name: parsed.name,
				phone: parsed.phone || null,
				whatsapp: parsed.whatsapp || null,
				email: parsed.email || null,
				notes: parsed.notes || null
			};
			if (editing) {
				const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
				if (error) throw error;
			} else {
				const { error } = await supabase.from("clients").insert(payload);
				if (error) throw error;
			}
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["clients"] });
			toast.success(editing ? "Cliente atualizado" : "Cliente cadastrado");
			setOpen(false);
			setEditing(null);
		},
		onError: (e) => toast.error(e.message ?? "Erro ao salvar")
	});
	const del = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("clients").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["clients"] });
			toast.success("Cliente removido");
		},
		onError: (e) => toast.error(e.message)
	});
	const handleSubmit = (e) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		upsert.mutate(Object.fromEntries(fd));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-8 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex justify-between items-center mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-display font-bold",
					children: "Clientes"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-muted-foreground mt-1",
					children: [clients?.length ?? 0, " clientes cadastrados"]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
					open,
					onOpenChange: (o) => {
						setOpen(o);
						if (!o) setEditing(null);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4 mr-2" }), "Novo Cliente"] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: [editing ? "Editar" : "Novo", " cliente"] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSubmit,
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "c-name",
									children: "Nome *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "c-name",
									name: "name",
									defaultValue: editing?.name,
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "c-phone",
										children: "Telefone"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "c-phone",
										name: "phone",
										defaultValue: editing?.phone ?? "",
										placeholder: "(11) 9999-9999"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "c-wa",
										children: "WhatsApp"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "c-wa",
										name: "whatsapp",
										defaultValue: editing?.whatsapp ?? "",
										placeholder: "(11) 99999-9999"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "c-email",
									children: "E-mail"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "c-email",
									name: "email",
									type: "email",
									defaultValue: editing?.email ?? ""
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "c-notes",
									children: "Observações"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									id: "c-notes",
									name: "notes",
									defaultValue: editing?.notes ?? "",
									rows: 3
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: upsert.isPending,
								children: "Salvar"
							}) })
						]
					})] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mb-6 max-w-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "pl-9",
					placeholder: "Buscar por nome...",
					value: search,
					onChange: (e) => setSearch(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-card border border-border rounded-xl overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left p-4 font-semibold",
								children: "Nome"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left p-4 font-semibold",
								children: "Contato"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left p-4 font-semibold",
								children: "Veículos"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-right p-4 font-semibold",
								children: "Ações"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y divide-border",
						children: [(!clients || clients.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 4,
							className: "p-10 text-center text-muted-foreground",
							children: "Nenhum cliente ainda. Cadastre o primeiro."
						}) }), clients?.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-white/5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "p-4 font-medium",
									children: [c.name, c.email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted-foreground",
										children: c.email
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4 text-muted-foreground",
									children: c.phone ?? c.whatsapp ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4 text-muted-foreground",
									children: c.vehicles?.length ? c.vehicles.map((v) => v.model || v.plate).filter(Boolean).join(", ") : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs italic",
										children: "Sem veículos"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2 justify-end",
										children: [
											c.whatsapp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												href: whatsappLink(c.whatsapp, `Olá ${c.name}, aqui é da Shiny Studio!`),
												target: "_blank",
												rel: "noreferrer",
												className: "p-2 rounded-md hover:bg-success/10 text-success transition-colors",
												"aria-label": "WhatsApp",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-4" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => {
													setEditing(c);
													setOpen(true);
												},
												className: "p-2 rounded-md hover:bg-white/5 text-muted-foreground transition-colors",
												"aria-label": "Editar",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => confirm(`Excluir ${c.name}?`) && del.mutate(c.id),
												className: "p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors",
												"aria-label": "Excluir",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
											})
										]
									})
								})
							]
						}, c.id))]
					})]
				})
			})
		]
	});
}
//#endregion
export { ClientesPage as component };
