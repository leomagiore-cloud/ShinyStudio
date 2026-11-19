import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-eERwuxp7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { n as Label, t as Input } from "./label-DDmitfqC.mjs";
import { t as Textarea } from "./textarea-DjqHhWkA.mjs";
import { A as Car, c as Search, l as Plus, o as Trash2, u as Pencil } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DamjaduW.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-B_1MK0xI.mjs";
import { a as objectType, i as literalType, n as coerce, o as stringType } from "../_libs/zod.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/veiculos-A-v4lNIZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var schema = objectType({
	client_id: stringType().uuid("Selecione um cliente"),
	plate: stringType().trim().max(10).optional().or(literalType("")),
	brand: stringType().trim().max(40).optional().or(literalType("")),
	model: stringType().trim().max(60).optional().or(literalType("")),
	year: coerce.number().int().min(1900).max(2100).optional().or(literalType("")),
	color: stringType().trim().max(40).optional().or(literalType("")),
	notes: stringType().trim().max(1e3).optional().or(literalType(""))
});
function VeiculosPage() {
	const qc = useQueryClient();
	const [search, setSearch] = (0, import_react.useState)("");
	const [open, setOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [clientId, setClientId] = (0, import_react.useState)("");
	const [lookupMsg, setLookupMsg] = (0, import_react.useState)("");
	const formRef = (0, import_react.useRef)(null);
	const searchRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const params = new URLSearchParams(window.location.search);
		const q = params.get("q");
		if (q) setSearch(q);
		if (params.get("focus") === "1" || q) setTimeout(() => searchRef.current?.focus(), 50);
		if (q || params.get("focus")) {
			const url = new URL(window.location.href);
			url.searchParams.delete("q");
			url.searchParams.delete("focus");
			window.history.replaceState({}, "", url.toString());
		}
	}, []);
	const lookupByPlate = async (raw) => {
		const plate = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
		setLookupMsg("");
		if (plate.length < 6 || editing) return;
		const { data } = await supabase.from("vehicles").select("*, clients(name)").eq("plate", plate).maybeSingle();
		if (!data || !formRef.current) return;
		const f = formRef.current;
		f.elements.namedItem("brand").value = data.brand ?? "";
		f.elements.namedItem("model").value = data.model ?? "";
		f.elements.namedItem("year").value = data.year ? String(data.year) : "";
		f.elements.namedItem("color").value = data.color ?? "";
		f.elements.namedItem("notes").value = data.notes ?? "";
		if (data.client_id) setClientId(data.client_id);
		setLookupMsg(`Veículo já cadastrado para ${data.clients?.name ?? "outro cliente"} — campos preenchidos`);
		toast.info("Veículo encontrado, dados preenchidos");
	};
	const { data: clients } = useQuery({
		queryKey: ["clients-list"],
		queryFn: async () => (await supabase.from("clients").select("id, name").order("name")).data ?? []
	});
	const { data: vehicles } = useQuery({
		queryKey: ["vehicles", search],
		queryFn: async () => {
			const { data } = await supabase.from("vehicles").select("*, clients(name)").order("created_at", { ascending: false });
			let rows = data ?? [];
			if (search.trim()) {
				const s = search.trim().toLowerCase();
				rows = rows.filter((v) => (v.plate ?? "").toLowerCase().includes(s) || (v.model ?? "").toLowerCase().includes(s) || (v.brand ?? "").toLowerCase().includes(s) || (v.clients?.name ?? "").toLowerCase().includes(s));
			}
			return rows;
		}
	});
	const upsert = useMutation({
		mutationFn: async (input) => {
			const parsed = schema.parse({
				...input,
				client_id: input.client_id || clientId
			});
			const payload = {
				client_id: parsed.client_id,
				plate: parsed.plate ? String(parsed.plate).toUpperCase() : null,
				brand: parsed.brand || null,
				model: parsed.model || null,
				year: parsed.year ? Number(parsed.year) : null,
				color: parsed.color || null,
				notes: parsed.notes || null
			};
			if (editing) {
				const { error } = await supabase.from("vehicles").update(payload).eq("id", editing.id);
				if (error) throw error;
			} else {
				const { error } = await supabase.from("vehicles").insert(payload);
				if (error) throw error;
			}
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["vehicles"] });
			toast.success(editing ? "Veículo atualizado" : "Veículo cadastrado");
			setOpen(false);
			setEditing(null);
			setClientId("");
		},
		onError: (e) => toast.error(e.message ?? "Erro")
	});
	const del = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("vehicles").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["vehicles"] });
			toast.success("Veículo removido");
		},
		onError: (e) => toast.error(e.message)
	});
	const submit = (e) => {
		e.preventDefault();
		upsert.mutate(Object.fromEntries(new FormData(e.currentTarget)));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-8 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex justify-between items-center mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-display font-bold",
					children: "Veículos"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-muted-foreground mt-1",
					children: [vehicles?.length ?? 0, " veículos cadastrados"]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
					open,
					onOpenChange: (o) => {
						setOpen(o);
						if (!o) {
							setEditing(null);
							setClientId("");
							setLookupMsg("");
						}
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4 mr-2" }), "Novo Veículo"] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: [editing ? "Editar" : "Novo", " veículo"] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						ref: formRef,
						onSubmit: submit,
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Cliente *" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: clientId || editing?.client_id,
										onValueChange: setClientId,
										name: "client_id",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecione um cliente" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: clients?.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: c.id,
											children: c.name
										}, c.id)) })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "hidden",
										name: "client_id",
										value: clientId || editing?.client_id || ""
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "v-plate",
											children: "Placa"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "v-plate",
											name: "plate",
											defaultValue: editing?.plate ?? "",
											className: "uppercase",
											onBlur: (e) => lookupByPlate(e.target.value),
											onChange: (e) => {
												e.target.value = e.target.value.toUpperCase();
											}
										}),
										lookupMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-primary",
											children: lookupMsg
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "v-year",
										children: "Ano"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "v-year",
										name: "year",
										type: "number",
										defaultValue: editing?.year ?? ""
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "v-brand",
										children: "Marca"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "v-brand",
										name: "brand",
										defaultValue: editing?.brand ?? ""
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "v-model",
										children: "Modelo"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "v-model",
										name: "model",
										defaultValue: editing?.model ?? ""
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "v-color",
									children: "Cor"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "v-color",
									name: "color",
									defaultValue: editing?.color ?? ""
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "v-notes",
									children: "Observações"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									id: "v-notes",
									name: "notes",
									defaultValue: editing?.notes ?? "",
									rows: 2
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
					ref: searchRef,
					className: "pl-9",
					placeholder: "Buscar por placa, modelo ou cliente...",
					value: search,
					onChange: (e) => setSearch(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
				children: [(!vehicles || vehicles.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "md:col-span-2 lg:col-span-3 bg-card/50 border border-border rounded-xl p-10 text-center text-muted-foreground",
					children: "Nenhum veículo. Cadastre o primeiro."
				}), vehicles?.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-colors",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between mb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "size-12 rounded-lg bg-secondary border border-border grid place-items-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Car, { className: "size-5 text-muted-foreground" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										setEditing(v);
										setClientId(v.client_id);
										setOpen(true);
									},
									className: "p-1.5 rounded-md hover:bg-white/5 text-muted-foreground",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => confirm("Excluir veículo?") && del.mutate(v.id),
									className: "p-1.5 rounded-md hover:bg-destructive/10 text-destructive",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display font-semibold text-lg leading-tight",
							children: [v.brand, v.model].filter(Boolean).join(" ") || "Veículo"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mt-1",
							children: [
								v.plate && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-mono px-2 py-0.5 rounded bg-secondary border border-border",
									children: v.plate
								}),
								v.year && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: v.year
								}),
								v.color && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted-foreground",
									children: ["· ", v.color]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground mt-3 pt-3 border-t border-border",
							children: v.clients?.name ?? "Cliente removido"
						})
					]
				}, v.id))]
			})
		]
	});
}
//#endregion
export { VeiculosPage as component };
