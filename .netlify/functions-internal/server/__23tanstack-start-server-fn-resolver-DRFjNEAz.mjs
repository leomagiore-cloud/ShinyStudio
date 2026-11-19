//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-DRFjNEAz.js
var manifest = {
	"52d4d1ac162e15d2faf7cfe6e2be577817ee020ff7b1c4c2d5e624ce9e9041cf": {
		functionName: "getBookedSlots_createServerFn_handler",
		importer: () => import("./_ssr/booking.functions-C9DRf5_q.mjs")
	},
	"a7a4f1db48be91055373e7006f2d7e6f0f7a3173698533b6bbd7b8ee4e522cad": {
		functionName: "createPublicBooking_createServerFn_handler",
		importer: () => import("./_ssr/booking.functions-C9DRf5_q.mjs")
	},
	"f54b4dd6943dade96b6ea7373765bf2c972f5c33c093fcd80e040c3a81018526": {
		functionName: "getPublicServices_createServerFn_handler",
		importer: () => import("./_ssr/booking.functions-C9DRf5_q.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
