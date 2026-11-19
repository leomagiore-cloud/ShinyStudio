import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { n as Label, t as Input } from "./label-DDmitfqC.mjs";
import { t as Textarea } from "./textarea-DjqHhWkA.mjs";
import { C as CircleCheck, M as Calendar, m as LoaderCircle, x as Clock } from "../_libs/lucide-react.mjs";
import { n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as isSameDay, f as addDays, i as format, r as parseISO, t as ptBR, u as startOfDay } from "../_libs/date-fns.mjs";
import { t as formatBRL } from "./format-Cwm8imj1.mjs";
import { i as getPublicServices, n as createPublicBooking, r as getBookedSlots } from "./booking.functions-Bxkub8Fp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agendar-CHUHt6PQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var OPEN_HOUR = 9;
var CLOSE_HOUR = 18;
var SLOT_MINUTES = 30;
function BookingPage() {
	const [serviceId, setServiceId] = (0, import_react.useState)("");
	const [selectedDay, setSelectedDay] = (0, import_react.useState)(null);
	const [selectedTime, setSelectedTime] = (0, import_react.useState)("");
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		phone: "",
		car_model: "",
		plate: "",
		notes: ""
	});
	const [success, setSuccess] = (0, import_react.useState)(null);
	const { data: services } = useQuery({
		queryKey: ["public-services"],
		queryFn: () => getPublicServices()
	});
	const days = (0, import_react.useMemo)(() => {
		const today = startOfDay(/* @__PURE__ */ new Date());
		return Array.from({ length: 14 }, (_, i) => addDays(today, i));
	}, []);
	const rangeFrom = days[0].toISOString();
	const rangeTo = addDays(days[days.length - 1], 1).toISOString();
	const { data: booked } = useQuery({
		queryKey: [
			"booked-slots",
			rangeFrom,
			rangeTo
		],
		queryFn: () => getBookedSlots({ data: {
			from: rangeFrom,
			to: rangeTo
		} })
	});
	const service = services?.find((s) => s.id === serviceId);
	const durationMin = service?.duration_minutes ?? 60;
	const slotsForDay = (0, import_react.useMemo)(() => {
		if (!selectedDay || !service) return [];
		const now = /* @__PURE__ */ new Date();
		const slots = [];
		for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) for (let m = 0; m < 60; m += SLOT_MINUTES) {
			const start = new Date(selectedDay);
			start.setHours(h, m, 0, 0);
			const end = new Date(start.getTime() + durationMin * 6e4);
			if (end.getHours() > CLOSE_HOUR || end.getHours() === CLOSE_HOUR && end.getMinutes() > 0) continue;
			if (start < now) continue;
			const overlaps = (booked ?? []).some((b) => {
				const bs = parseISO(b.starts_at).getTime();
				const be = parseISO(b.ends_at).getTime();
				return start.getTime() < be && end.getTime() > bs;
			});
			slots.push({
				time: format(start, "HH:mm"),
				available: !overlaps
			});
		}
		return slots;
	}, [
		selectedDay,
		service,
		booked,
		durationMin
	]);
	const dayHasAvailability = (d) => {
		if (!service) return true;
		const now = /* @__PURE__ */ new Date();
		if (d < startOfDay(now)) return false;
		for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) for (let m = 0; m < 60; m += SLOT_MINUTES) {
			const start = new Date(d);
			start.setHours(h, m, 0, 0);
			const end = new Date(start.getTime() + durationMin * 6e4);
			if (end.getHours() > CLOSE_HOUR || end.getHours() === CLOSE_HOUR && end.getMinutes() > 0) continue;
			if (start < now) continue;
			if (!(booked ?? []).some((b) => {
				const bs = parseISO(b.starts_at).getTime();
				const be = parseISO(b.ends_at).getTime();
				return start.getTime() < be && end.getTime() > bs;
			})) return true;
		}
		return false;
	};
	(0, import_react.useEffect)(() => {
		setSelectedTime("");
	}, [selectedDay, serviceId]);
	const submit = useMutation({
		mutationFn: async () => {
			if (!service || !selectedDay || !selectedTime) throw new Error("Selecione serviço, dia e horário");
			const [hh, mm] = selectedTime.split(":").map(Number);
			const start = new Date(selectedDay);
			start.setHours(hh, mm, 0, 0);
			await createPublicBooking({ data: {
				name: form.name,
				phone: form.phone,
				car_model: form.car_model,
				plate: form.plate,
				service_id: service.id,
				starts_at: start.toISOString(),
				notes: form.notes
			} });
			return start.toISOString();
		},
		onSuccess: (starts_at) => setSuccess({ starts_at }),
		onError: (e) => toast.error(e.message ?? "Erro ao agendar")
	});
	if (success) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-background text-foreground grid place-items-center p-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto size-14 rounded-full bg-primary/10 border border-primary/30 grid place-items-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-7 text-primary" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-bold",
					children: "Agendamento solicitado!"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-muted-foreground text-sm",
					children: [
						"Recebemos seu pedido para",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-foreground font-semibold",
							children: format(parseISO(success.starts_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })
						}),
						". Em breve enviaremos a confirmação pelo WhatsApp."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => {
						setSuccess(null);
						setSelectedTime("");
						setForm({
							name: "",
							phone: "",
							car_model: "",
							plate: "",
							notes: ""
						});
					},
					className: "w-full",
					children: "Fazer outro agendamento"
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-w-4xl mx-auto px-6 py-5 flex items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-9 bg-primary rounded-lg grid place-items-center font-display font-bold text-white italic shadow-lg shadow-primary/30",
						children: "S"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display font-bold tracking-tight",
						children: "ShinyGest"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] text-muted-foreground uppercase tracking-widest",
						children: "Agendamento online"
					})] })]
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "max-w-4xl mx-auto px-6 py-8 space-y-8 pb-24",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "size-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold",
							children: "1"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold",
							children: "Escolha o serviço"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid sm:grid-cols-2 gap-3",
						children: [services?.map((s) => {
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setServiceId(s.id),
								className: `text-left p-4 rounded-xl border transition-all ${serviceId === s.id ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-card hover:border-primary/40"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-semibold",
										children: s.name
									}),
									s.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground mt-1 line-clamp-2",
										children: s.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3 mt-2 text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-primary font-semibold",
											children: formatBRL(Number(s.price))
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted-foreground inline-flex items-center gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3" }),
												s.duration_minutes,
												"min"
											]
										})]
									})
								]
							}, s.id);
						}), !services?.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Carregando serviços..."
						})]
					})]
				}),
				service && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "size-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold",
							children: "2"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold",
							children: "Escolha o dia"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-4 sm:grid-cols-7 gap-2",
						children: days.map((d) => {
							const active = selectedDay && isSameDay(selectedDay, d);
							const avail = dayHasAvailability(d);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: !avail,
								onClick: () => setSelectedDay(d),
								className: `p-3 rounded-lg border text-center transition-all ${active ? "border-primary bg-primary/10" : avail ? "border-border bg-card hover:border-primary/40" : "border-border/50 bg-secondary/30 opacity-40 cursor-not-allowed"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] uppercase tracking-wider text-muted-foreground",
										children: format(d, "EEE", { locale: ptBR })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: `font-display text-lg font-bold mt-0.5 ${active ? "text-primary" : ""}`,
										children: format(d, "d")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-muted-foreground",
										children: format(d, "MMM", { locale: ptBR })
									})
								]
							}, d.toISOString());
						})
					})]
				}),
				service && selectedDay && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "size-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold",
							children: "3"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold",
							children: "Escolha o horário"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 sm:grid-cols-6 gap-2",
						children: [slotsForDay.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: !s.available,
							onClick: () => setSelectedTime(s.time),
							className: `p-2.5 rounded-lg border text-sm font-mono transition-all ${selectedTime === s.time ? "border-primary bg-primary/10 text-primary" : s.available ? "border-border bg-card hover:border-primary/40" : "border-border/50 bg-secondary/30 opacity-40 cursor-not-allowed line-through"}`,
							children: s.time
						}, s.time)), slotsForDay.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "col-span-full text-sm text-muted-foreground",
							children: "Sem horários disponíveis nesse dia."
						})]
					})]
				}),
				service && selectedDay && selectedTime && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "size-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold",
							children: "4"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold",
							children: "Seus dados"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: (e) => {
							e.preventDefault();
							submit.mutate();
						},
						className: "grid sm:grid-cols-2 gap-4 bg-card border border-border rounded-2xl p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2 sm:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "name",
									children: "Nome completo *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "name",
									required: true,
									value: form.name,
									onChange: (e) => setForm({
										...form,
										name: e.target.value
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "phone",
									children: "WhatsApp *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "phone",
									required: true,
									placeholder: "(11) 99999-9999",
									value: form.phone,
									onChange: (e) => setForm({
										...form,
										phone: e.target.value
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "plate",
									children: "Placa *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "plate",
									required: true,
									placeholder: "ABC1D23",
									className: "uppercase",
									value: form.plate,
									onChange: (e) => setForm({
										...form,
										plate: e.target.value.toUpperCase()
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2 sm:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "car_model",
									children: "Modelo do carro *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "car_model",
									required: true,
									placeholder: "Ex.: Honda Civic Preto",
									value: form.car_model,
									onChange: (e) => setForm({
										...form,
										car_model: e.target.value
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2 sm:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "notes",
									children: "Observações"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									id: "notes",
									rows: 2,
									value: form.notes,
									onChange: (e) => setForm({
										...form,
										notes: e.target.value
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sm:col-span-2 flex items-center justify-between gap-4 pt-2 border-t border-border",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground",
										children: "Resumo"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-semibold flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "size-4 text-primary" }),
											service.name,
											" — ",
											format(selectedDay, "d/MM", { locale: ptBR }),
											" às ",
											selectedTime
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "submit",
									disabled: submit.isPending,
									size: "lg",
									children: [submit.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin mr-2" }), "Confirmar agendamento"]
								})]
							})
						]
					})]
				})
			]
		})]
	});
}
//#endregion
export { BookingPage as component };
