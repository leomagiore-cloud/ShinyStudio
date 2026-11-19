import { a as objectType, i as literalType, o as stringType } from "../_libs/zod.mjs";
import { i as TSS_SERVER_FUNCTION, l as createServerFn } from "./esm-Dova13aH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/booking.functions-C9DRf5_q.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var BOOKING_MARKER = "[Agendamento online]";
var getPublicServices_createServerFn_handler = createServerRpc({
	id: "f54b4dd6943dade96b6ea7373765bf2c972f5c33c093fcd80e040c3a81018526",
	name: "getPublicServices",
	filename: "src/lib/booking.functions.ts"
}, (opts) => getPublicServices.__executeServer(opts));
var getPublicServices = createServerFn({ method: "GET" }).handler(getPublicServices_createServerFn_handler, async () => {
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data, error } = await supabaseAdmin.from("service_catalog").select("id, name, description, duration_minutes, price").eq("is_active", true).order("name");
	if (error) throw new Error(error.message);
	return data ?? [];
});
var getBookedSlots_createServerFn_handler = createServerRpc({
	id: "52d4d1ac162e15d2faf7cfe6e2be577817ee020ff7b1c4c2d5e624ce9e9041cf",
	name: "getBookedSlots",
	filename: "src/lib/booking.functions.ts"
}, (opts) => getBookedSlots.__executeServer(opts));
var getBookedSlots = createServerFn({ method: "POST" }).inputValidator((d) => objectType({
	from: stringType(),
	to: stringType()
}).parse(d)).handler(getBookedSlots_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: rows, error } = await supabaseAdmin.from("appointments").select("starts_at, ends_at, status").gte("starts_at", data.from).lte("starts_at", data.to).not("status", "in", "(cancelado)");
	if (error) throw new Error(error.message);
	return (rows ?? []).map((r) => ({
		starts_at: r.starts_at,
		ends_at: r.ends_at
	}));
});
var bookingSchema = objectType({
	name: stringType().trim().min(2).max(120),
	phone: stringType().trim().min(8).max(30),
	car_model: stringType().trim().min(1).max(80),
	plate: stringType().trim().min(4).max(12),
	service_id: stringType().uuid(),
	starts_at: stringType().min(10),
	notes: stringType().trim().max(500).optional().or(literalType(""))
});
var createPublicBooking_createServerFn_handler = createServerRpc({
	id: "a7a4f1db48be91055373e7006f2d7e6f0f7a3173698533b6bbd7b8ee4e522cad",
	name: "createPublicBooking",
	filename: "src/lib/booking.functions.ts"
}, (opts) => createPublicBooking.__executeServer(opts));
var createPublicBooking = createServerFn({ method: "POST" }).inputValidator((d) => bookingSchema.parse(d)).handler(createPublicBooking_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: svc, error: svcErr } = await supabaseAdmin.from("service_catalog").select("id, name, duration_minutes, is_active").eq("id", data.service_id).maybeSingle();
	if (svcErr) throw new Error(svcErr.message);
	if (!svc || !svc.is_active) throw new Error("Serviço indisponível");
	const starts = new Date(data.starts_at);
	const ends = new Date(starts.getTime() + svc.duration_minutes * 6e4);
	const { data: conflicts, error: cErr } = await supabaseAdmin.from("appointments").select("id").not("status", "in", "(cancelado)").lt("starts_at", ends.toISOString()).gt("ends_at", starts.toISOString()).limit(1);
	if (cErr) throw new Error(cErr.message);
	if (conflicts && conflicts.length > 0) throw new Error("Este horário acabou de ser ocupado. Escolha outro.");
	const phoneDigits = data.phone.replace(/\D/g, "");
	let clientId = null;
	if (phoneDigits) {
		const { data: existing } = await supabaseAdmin.from("clients").select("id").or(`phone.eq.${phoneDigits},whatsapp.eq.${phoneDigits}`).limit(1).maybeSingle();
		clientId = existing?.id ?? null;
	}
	if (!clientId) {
		const { data: newClient, error: nErr } = await supabaseAdmin.from("clients").insert({
			name: data.name,
			phone: phoneDigits,
			whatsapp: phoneDigits
		}).select("id").single();
		if (nErr) throw new Error(nErr.message);
		clientId = newClient.id;
	}
	const plate = data.plate.toUpperCase().replace(/\s|-/g, "");
	let vehicleId = null;
	const { data: exVeh } = await supabaseAdmin.from("vehicles").select("id").eq("plate", plate).limit(1).maybeSingle();
	if (exVeh) vehicleId = exVeh.id;
	else {
		const { data: newV, error: vErr } = await supabaseAdmin.from("vehicles").insert({
			client_id: clientId,
			plate,
			model: data.car_model
		}).select("id").single();
		if (vErr) throw new Error(vErr.message);
		vehicleId = newV.id;
	}
	const note = `${BOOKING_MARKER}${data.notes ? ` — ${data.notes}` : ""}`;
	const { error: aErr } = await supabaseAdmin.from("appointments").insert({
		client_id: clientId,
		vehicle_id: vehicleId,
		service_id: svc.id,
		title: svc.name,
		starts_at: starts.toISOString(),
		ends_at: ends.toISOString(),
		status: "pendente",
		notes: note
	});
	if (aErr) throw new Error(aErr.message);
	return { ok: true };
});
//#endregion
export { createPublicBooking_createServerFn_handler, getBookedSlots_createServerFn_handler, getPublicServices_createServerFn_handler };
