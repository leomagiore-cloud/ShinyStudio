import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-eERwuxp7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as StatusPill } from "./dashboard-DF-HP2dR.mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { n as Label, t as Input } from "./label-DDmitfqC.mjs";
import { t as Textarea } from "./textarea-DjqHhWkA.mjs";
import { i as Upload, j as Camera, l as Plus, o as Trash2 } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DamjaduW.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-B_1MK0xI.mjs";
import { a as objectType, i as literalType, n as coerce, o as stringType, r as enumType } from "../_libs/zod.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { r as formatDateTime, t as formatBRL } from "./format-Cwm8imj1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ordens-BTv3vtEN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var schema = objectType({
	client_id: stringType().uuid(),
	vehicle_id: stringType().uuid().optional().or(literalType("")),
	service_id: stringType().uuid().optional().or(literalType("")),
	service_name: stringType().trim().min(2).max(120),
	amount: coerce.number().min(0),
	payment_method: enumType([
		"dinheiro",
		"pix",
		"cartao_credito",
		"cartao_debito",
		"transferencia",
		"pendente"
	]),
	status: enumType([
		"pendente",
		"confirmado",
		"em_andamento",
		"concluido",
		"cancelado"
	]),
	notes: stringType().trim().max(2e3).optional().or(literalType(""))
});
var CHECKLIST_KEYS = [
	"Pintura",
	"Motor",
	"Interno",
	"Rodas",
	"Vidros",
	"Faróis"
];
function OrdensPage() {
	const qc = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [detailOpen, setDetailOpen] = (0, import_react.useState)(null);
	const [clientId, setClientId] = (0, import_react.useState)("");
	const [vehicleId, setVehicleId] = (0, import_react.useState)("");
	const [serviceId, setServiceId] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("pendente");
	const [payment, setPayment] = (0, import_react.useState)("pendente");
	const [checklist, setChecklist] = (0, import_react.useState)({});
	const { data: orders } = useQuery({
		queryKey: ["orders"],
		queryFn: async () => {
			const { data } = await supabase.from("service_orders").select("*, clients(name, whatsapp), vehicles(plate, model, brand)").order("created_at", { ascending: false });
			return data ?? [];
		}
	});
	const { data: clients } = useQuery({
		queryKey: ["clients-list"],
		queryFn: async () => (await supabase.from("clients").select("id, name").order("name")).data ?? []
	});
	const { data: vehicles } = useQuery({
		queryKey: ["vehicles-list", clientId],
		queryFn: async () => clientId ? (await supabase.from("vehicles").select("id, plate, model").eq("client_id", clientId)).data ?? [] : [],
		enabled: !!clientId
	});
	const { data: services } = useQuery({
		queryKey: ["services-list"],
		queryFn: async () => (await supabase.from("service_catalog").select("id, name, price").eq("is_active", true)).data ?? []
	});
	const create = useMutation({
		mutationFn: async (input) => {
			const parsed = schema.parse(input);
			const { error } = await supabase.from("service_orders").insert({
				client_id: parsed.client_id,
				vehicle_id: parsed.vehicle_id || null,
				service_id: parsed.service_id || null,
				service_name: parsed.service_name,
				amount: parsed.amount,
				payment_method: parsed.payment_method,
				paid_at: parsed.payment_method !== "pendente" ? (/* @__PURE__ */ new Date()).toISOString() : null,
				status: parsed.status,
				notes: parsed.notes || null,
				checklist
			});
			if (error) throw error;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["orders"] });
			qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
			toast.success("OS criada");
			setOpen(false);
			setClientId("");
			setVehicleId("");
			setServiceId("");
			setStatus("pendente");
			setPayment("pendente");
			setChecklist({});
		},
		onError: (e) => toast.error(e.message ?? "Erro")
	});
	const updateStatus = useMutation({
		mutationFn: async ({ id, status }) => {
			const patch = { status };
			if (status === "concluido") patch.completed_at = (/* @__PURE__ */ new Date()).toISOString();
			if (status === "em_andamento") patch.started_at = (/* @__PURE__ */ new Date()).toISOString();
			const { error } = await supabase.from("service_orders").update(patch).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["orders"] });
			qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
			toast.success("Status atualizado");
		},
		onError: (e) => toast.error(e.message)
	});
	const submit = (e) => {
		e.preventDefault();
		const fd = Object.fromEntries(new FormData(e.currentTarget));
		create.mutate({
			...fd,
			client_id: clientId,
			vehicle_id: vehicleId,
			service_id: serviceId,
			status,
			payment_method: payment
		});
	};
	const selectedService = services?.find((s) => s.id === serviceId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-8 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex justify-between items-center mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-display font-bold",
					children: "Ordens de Serviço"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-muted-foreground mt-1",
					children: [orders?.length ?? 0, " OS no total"]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
					open,
					onOpenChange: setOpen,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4 mr-2" }), "Nova OS"] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
						className: "max-w-lg max-h-[90vh] overflow-y-auto",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Nova ordem de serviço" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: submit,
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Cliente *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: clientId,
										onValueChange: (v) => {
											setClientId(v);
											setVehicleId("");
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecione" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: clients?.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: c.id,
											children: c.name
										}, c.id)) })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Veículo" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: vehicleId,
										onValueChange: setVehicleId,
										disabled: !clientId,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: clientId ? "Selecione" : "Cliente primeiro" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: vehicles?.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: v.id,
											children: [v.model, v.plate].filter(Boolean).join(" · ")
										}, v.id)) })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Serviço do catálogo" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: serviceId,
										onValueChange: setServiceId,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecione (opcional)" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: services?.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
											value: s.id,
											children: [
												s.name,
												" — ",
												formatBRL(Number(s.price))
											]
										}, s.id)) })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "o-name",
											children: "Nome do serviço *"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "o-name",
											name: "service_name",
											defaultValue: selectedService?.name ?? "",
											required: true
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "o-amount",
											children: "Valor (R$) *"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "o-amount",
											name: "amount",
											type: "number",
											step: "0.01",
											defaultValue: selectedService?.price ?? "",
											required: true
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Pagamento" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: payment,
											onValueChange: setPayment,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "pendente",
													children: "Pendente"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "pix",
													children: "PIX"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "dinheiro",
													children: "Dinheiro"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "cartao_credito",
													children: "Cartão de crédito"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "cartao_debito",
													children: "Cartão de débito"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "transferencia",
													children: "Transferência"
												})
											] })]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Status" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: status,
											onValueChange: setStatus,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "pendente",
													children: "Pendente"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "confirmado",
													children: "Confirmado"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "em_andamento",
													children: "Em andamento"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "concluido",
													children: "Concluído"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "cancelado",
													children: "Cancelado"
												})
											] })]
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Checklist" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-3 gap-2",
										children: CHECKLIST_KEYS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md bg-secondary/40",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: !!checklist[k],
												onChange: (e) => setChecklist({
													...checklist,
													[k]: e.target.checked
												})
											}), k]
										}, k))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "o-notes",
										children: "Observações"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										id: "o-notes",
										name: "notes",
										rows: 2
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									disabled: create.isPending,
									children: "Criar OS"
								}) })
							]
						})]
					})]
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
								className: "text-left p-4",
								children: "OS"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left p-4",
								children: "Cliente / Veículo"
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
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-right p-4",
								children: "Ações"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y divide-border",
						children: [(!orders || orders.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 6,
							className: "p-10 text-center text-muted-foreground",
							children: "Nenhuma OS criada ainda."
						}) }), orders?.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-white/5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "p-4 font-mono text-xs",
									children: [
										"#",
										String(o.order_number).padStart(4, "0"),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] text-muted-foreground mt-0.5",
											children: formatDateTime(o.created_at)
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "p-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-medium",
										children: o.clients?.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted-foreground",
										children: o.vehicles ? `${o.vehicles.brand ?? ""} ${o.vehicles.model ?? ""} ${o.vehicles.plate ? "· " + o.vehicles.plate : ""}` : "—"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4",
									children: o.service_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: o.status })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4 text-right font-display font-semibold",
									children: formatBRL(Number(o.amount))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2 justify-end",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											size: "sm",
											onClick: () => setDetailOpen(o),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-3.5 mr-1" }), "Fotos"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: o.status,
											onValueChange: (v) => updateStatus.mutate({
												id: o.id,
												status: v
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "h-9 w-36 text-xs",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "pendente",
													children: "Pendente"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "confirmado",
													children: "Confirmado"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "em_andamento",
													children: "Em andamento"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "concluido",
													children: "Concluído"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "cancelado",
													children: "Cancelado"
												})
											] })]
										})]
									})
								})
							]
						}, o.id))]
					})]
				})
			}),
			detailOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotosDialog, {
				order: detailOpen,
				onClose: () => setDetailOpen(null)
			})
		]
	});
}
function PhotosDialog({ order, onClose }) {
	const qc = useQueryClient();
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const { data: photos } = useQuery({
		queryKey: ["photos", order.id],
		queryFn: async () => {
			const { data } = await supabase.from("service_photos").select("*").eq("order_id", order.id).order("created_at");
			return await Promise.all((data ?? []).map(async (p) => {
				const { data: signed } = await supabase.storage.from("service-photos").createSignedUrl(p.storage_path, 3600);
				return {
					...p,
					url: signed?.signedUrl
				};
			}));
		}
	});
	const upload = async (file, kind) => {
		setUploading(true);
		try {
			const path = `${order.id}/${kind}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
			const { error: upErr } = await supabase.storage.from("service-photos").upload(path, file);
			if (upErr) throw upErr;
			const { error } = await supabase.from("service_photos").insert({
				order_id: order.id,
				kind,
				storage_path: path
			});
			if (error) throw error;
			qc.invalidateQueries({ queryKey: ["photos", order.id] });
			qc.invalidateQueries({ queryKey: ["gallery"] });
			toast.success("Foto enviada");
		} catch (e) {
			toast.error(e.message);
		} finally {
			setUploading(false);
		}
	};
	const del = async (id, path) => {
		await supabase.storage.from("service-photos").remove([path]);
		await supabase.from("service_photos").delete().eq("id", id);
		qc.invalidateQueries({ queryKey: ["photos", order.id] });
		qc.invalidateQueries({ queryKey: ["gallery"] });
	};
	const antes = photos?.filter((p) => p.kind === "antes") ?? [];
	const depois = photos?.filter((p) => p.kind === "depois") ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: true,
		onOpenChange: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-3xl max-h-[90vh] overflow-y-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Fotos da OS #", String(order.order_number).padStart(4, "0")] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-6",
				children: ["antes", "depois"].map((kind) => {
					const list = kind === "antes" ? antes : depois;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "font-display font-bold capitalize",
							children: kind
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "cursor-pointer inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5" }),
								"Enviar",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "file",
									accept: "image/*",
									multiple: true,
									className: "hidden",
									disabled: uploading,
									onChange: async (e) => {
										const files = Array.from(e.target.files ?? []);
										for (const f of files) await upload(f, kind);
										e.target.value = "";
									}
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [list.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "col-span-2 aspect-square bg-secondary/30 rounded-lg border border-dashed border-border grid place-items-center text-xs text-muted-foreground",
							children: "Sem fotos"
						}), list.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative group aspect-square rounded-lg overflow-hidden bg-secondary border border-border",
							children: [p.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: p.url,
								alt: kind,
								className: "w-full h-full object-cover"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => del(p.id, p.storage_path),
								className: "absolute top-1 right-1 p-1 rounded-md bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3" })
							})]
						}, p.id))]
					})] }, kind);
				})
			})]
		})
	});
}
//#endregion
export { OrdensPage as component };
