import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-eERwuxp7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as StatusPill } from "./dashboard-DF-HP2dR.mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { n as Label, t as Input } from "./label-DDmitfqC.mjs";
import { t as Textarea } from "./textarea-DjqHhWkA.mjs";
import { E as ChevronLeft, T as ChevronRight, l as Plus, o as Trash2 } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DamjaduW.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-B_1MK0xI.mjs";
import { a as objectType, i as literalType, n as coerce, o as stringType, r as enumType } from "../_libs/zod.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as endOfWeek, c as isSameDay, d as startOfWeek, f as addDays, i as format, l as addWeeks, n as subWeeks, r as parseISO, t as ptBR } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agenda-sNTJd6gB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var schema = objectType({
	client_id: stringType().uuid(),
	vehicle_id: stringType().uuid().optional().or(literalType("")),
	service_id: stringType().uuid().optional().or(literalType("")),
	title: stringType().trim().min(2).max(120),
	starts_at: stringType().min(10),
	duration_minutes: coerce.number().int().min(15).max(1440),
	status: enumType([
		"pendente",
		"confirmado",
		"em_andamento",
		"concluido",
		"cancelado"
	]),
	notes: stringType().trim().max(1e3).optional().or(literalType(""))
});
function AgendaPage() {
	const qc = useQueryClient();
	const [weekStart, setWeekStart] = (0, import_react.useState)(startOfWeek(/* @__PURE__ */ new Date(), { weekStartsOn: 1 }));
	const [open, setOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [defaultDate, setDefaultDate] = (0, import_react.useState)(null);
	const [clientId, setClientId] = (0, import_react.useState)("");
	const [vehicleId, setVehicleId] = (0, import_react.useState)("");
	const [serviceId, setServiceId] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("pendente");
	const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
	const days = (0, import_react.useMemo)(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
	(0, import_react.useEffect)(() => {
		if (new URLSearchParams(window.location.search).get("new") === "1") {
			setEditing(null);
			setClientId("");
			setVehicleId("");
			setServiceId("");
			setStatus("pendente");
			setDefaultDate(/* @__PURE__ */ new Date());
			setOpen(true);
			const url = new URL(window.location.href);
			url.searchParams.delete("new");
			window.history.replaceState({}, "", url.toString());
		}
	}, []);
	const { data: appointments } = useQuery({
		queryKey: ["appointments", weekStart.toISOString()],
		queryFn: async () => {
			const { data } = await supabase.from("appointments").select("*, clients(name), vehicles(plate, model), service_catalog(name, duration_minutes)").gte("starts_at", weekStart.toISOString()).lte("starts_at", weekEnd.toISOString()).order("starts_at");
			return data ?? [];
		}
	});
	const { data: clients } = useQuery({
		queryKey: ["clients-list"],
		queryFn: async () => (await supabase.from("clients").select("id, name").order("name")).data ?? []
	});
	const { data: vehicles } = useQuery({
		queryKey: ["vehicles-list", clientId],
		queryFn: async () => {
			if (!clientId) return [];
			return (await supabase.from("vehicles").select("id, plate, model").eq("client_id", clientId)).data ?? [];
		},
		enabled: !!clientId
	});
	const { data: services } = useQuery({
		queryKey: ["services-list"],
		queryFn: async () => (await supabase.from("service_catalog").select("id, name, duration_minutes").eq("is_active", true)).data ?? []
	});
	const resetForm = () => {
		setEditing(null);
		setClientId("");
		setVehicleId("");
		setServiceId("");
		setStatus("pendente");
		setDefaultDate(null);
	};
	const upsert = useMutation({
		mutationFn: async (input) => {
			const parsed = schema.parse(input);
			const starts = new Date(parsed.starts_at);
			const ends = new Date(starts.getTime() + parsed.duration_minutes * 6e4);
			const payload = {
				client_id: parsed.client_id,
				vehicle_id: parsed.vehicle_id || null,
				service_id: parsed.service_id || null,
				title: parsed.title,
				starts_at: starts.toISOString(),
				ends_at: ends.toISOString(),
				status: parsed.status,
				notes: parsed.notes || null
			};
			if (editing) {
				const { error } = await supabase.from("appointments").update(payload).eq("id", editing.id);
				if (error) throw error;
			} else {
				const { error } = await supabase.from("appointments").insert(payload);
				if (error) throw error;
			}
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["appointments"] });
			toast.success(editing ? "Agendamento atualizado" : "Agendamento criado");
			setOpen(false);
			resetForm();
		},
		onError: (e) => toast.error(e.message ?? "Erro ao salvar")
	});
	const del = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("appointments").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["appointments"] });
			toast.success("Agendamento excluído");
			setOpen(false);
			resetForm();
		},
		onError: (e) => toast.error(e.message)
	});
	const submit = (e) => {
		e.preventDefault();
		const fd = Object.fromEntries(new FormData(e.currentTarget));
		upsert.mutate({
			...fd,
			client_id: clientId,
			vehicle_id: vehicleId,
			service_id: serviceId,
			status
		});
	};
	const openForDay = (d) => {
		resetForm();
		setDefaultDate(d);
		setOpen(true);
	};
	const openForEdit = (a) => {
		setEditing(a);
		setClientId(a.client_id ?? "");
		setVehicleId(a.vehicle_id ?? "");
		setServiceId(a.service_id ?? "");
		setStatus(a.status ?? "pendente");
		setDefaultDate(null);
		setOpen(true);
	};
	const selectedService = services?.find((s) => s.id === serviceId);
	const editStartsAt = editing ? format(parseISO(editing.starts_at), "yyyy-MM-dd'T'HH:mm") : "";
	const editDuration = editing ? Math.round((new Date(editing.ends_at).getTime() - new Date(editing.starts_at).getTime()) / 6e4) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-8 max-w-[1600px] mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex justify-between items-center mb-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-3xl font-display font-bold",
				children: "Agenda"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-muted-foreground mt-1 capitalize",
				children: [
					format(weekStart, "d 'de' MMM", { locale: ptBR }),
					" – ",
					format(weekEnd, "d 'de' MMM, yyyy", { locale: ptBR })
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "icon",
						onClick: () => setWeekStart(subWeeks(weekStart, 1)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setWeekStart(startOfWeek(/* @__PURE__ */ new Date(), { weekStartsOn: 1 })),
						children: "Hoje"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "icon",
						onClick: () => setWeekStart(addWeeks(weekStart, 1)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
						open,
						onOpenChange: (o) => {
							setOpen(o);
							if (!o) resetForm();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: resetForm,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4 mr-2" }), "Novo Agendamento"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
							className: "max-w-lg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: editing ? "Editar agendamento" : "Novo agendamento" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
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
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: clientId ? "Selecione" : "Selecione um cliente primeiro" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: vehicles?.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: v.id,
												children: [v.model, v.plate].filter(Boolean).join(" · ")
											}, v.id)) })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Serviço" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: serviceId,
											onValueChange: setServiceId,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecione" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: services?.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
												value: s.id,
												children: [
													s.name,
													" (",
													s.duration_minutes,
													"min)"
												]
											}, s.id)) })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "a-title",
											children: "Título *"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "a-title",
											name: "title",
											defaultValue: editing?.title ?? selectedService?.name ?? "",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "a-start",
												children: "Início *"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "a-start",
												name: "starts_at",
												type: "datetime-local",
												defaultValue: editing ? editStartsAt : defaultDate ? format(defaultDate, "yyyy-MM-dd'T'09:00") : "",
												required: true
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "a-dur",
												children: "Duração (min) *"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "a-dur",
												name: "duration_minutes",
												type: "number",
												defaultValue: editDuration ?? selectedService?.duration_minutes ?? 120,
												required: true
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "a-notes",
											children: "Observações"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
											id: "a-notes",
											name: "notes",
											defaultValue: editing?.notes ?? "",
											rows: 2
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
										className: "sm:justify-between gap-2",
										children: [editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: "destructive",
											onClick: () => confirm("Excluir agendamento?") && del.mutate(editing.id),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4 mr-2" }), "Excluir"]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											disabled: upsert.isPending,
											children: editing ? "Salvar" : "Agendar"
										})]
									})
								]
							})]
						})]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-card border border-border rounded-2xl overflow-hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-7 border-b border-border bg-secondary/30",
				children: days.map((d) => {
					const isToday = isSameDay(d, /* @__PURE__ */ new Date());
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `p-3 text-center border-r border-border last:border-r-0 ${isToday ? "bg-primary/5" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold",
							children: format(d, "EEE", { locale: ptBR })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `text-2xl font-display font-bold mt-1 ${isToday ? "text-primary" : ""}`,
							children: format(d, "d")
						})]
					}, d.toISOString());
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-7 min-h-[500px]",
				children: days.map((d) => {
					const dayApts = appointments?.filter((a) => isSameDay(parseISO(a.starts_at), d)) ?? [];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						onClick: (e) => {
							if (e.target === e.currentTarget) openForDay(d);
						},
						className: "border-r border-border last:border-r-0 p-2 space-y-1.5 text-left hover:bg-white/[0.02] transition-colors min-h-[500px] cursor-pointer",
						children: [dayApts.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-[10px] text-muted-foreground/40 text-center mt-4 pointer-events-none",
							children: "+ agendar"
						}), dayApts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: (e) => {
								e.stopPropagation();
								openForEdit(a);
							},
							className: "w-full p-2 rounded-md bg-primary/10 border-l-2 border-primary text-xs text-left hover:bg-primary/20 transition-colors",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-mono text-[10px] text-primary",
									children: format(parseISO(a.starts_at), "HH:mm")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold mt-0.5 truncate",
									children: a.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted-foreground truncate text-[11px]",
									children: a.clients?.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: a.status })
								})
							]
						}, a.id))]
					}, d.toISOString());
				})
			})]
		})]
	});
}
//#endregion
export { AgendaPage as component };
