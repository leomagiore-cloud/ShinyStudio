import { a as objectType, i as literalType, o as stringType } from "../_libs/zod.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-DRFjNEAz.mjs";
import { i as TSS_SERVER_FUNCTION, l as createServerFn } from "./esm-Dova13aH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/booking.functions-Bxkub8Fp.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var BOOKING_MARKER = "[Agendamento online]";
var getPublicServices = createServerFn({ method: "GET" }).handler(createSsrRpc("f54b4dd6943dade96b6ea7373765bf2c972f5c33c093fcd80e040c3a81018526"));
var getBookedSlots = createServerFn({ method: "POST" }).inputValidator((d) => objectType({
	from: stringType(),
	to: stringType()
}).parse(d)).handler(createSsrRpc("52d4d1ac162e15d2faf7cfe6e2be577817ee020ff7b1c4c2d5e624ce9e9041cf"));
var bookingSchema = objectType({
	name: stringType().trim().min(2).max(120),
	phone: stringType().trim().min(8).max(30),
	car_model: stringType().trim().min(1).max(80),
	plate: stringType().trim().min(4).max(12),
	service_id: stringType().uuid(),
	starts_at: stringType().min(10),
	notes: stringType().trim().max(500).optional().or(literalType(""))
});
var createPublicBooking = createServerFn({ method: "POST" }).inputValidator((d) => bookingSchema.parse(d)).handler(createSsrRpc("a7a4f1db48be91055373e7006f2d7e6f0f7a3173698533b6bbd7b8ee4e522cad"));
//#endregion
export { getPublicServices as i, createPublicBooking as n, getBookedSlots as r, BOOKING_MARKER as t };
