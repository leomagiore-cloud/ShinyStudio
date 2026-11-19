//#region node_modules/.nitro/vite/services/ssr/assets/format-Cwm8imj1.js
var formatBRL = (n) => new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL"
}).format(n);
var formatDate = (iso) => new Intl.DateTimeFormat("pt-BR", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric"
}).format(new Date(iso));
var formatDateTime = (iso) => new Intl.DateTimeFormat("pt-BR", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit"
}).format(new Date(iso));
var formatTime = (iso) => new Intl.DateTimeFormat("pt-BR", {
	hour: "2-digit",
	minute: "2-digit"
}).format(new Date(iso));
var onlyDigits = (s) => s.replace(/\D/g, "");
var whatsappLink = (phone, msg) => {
	let digits = onlyDigits(phone).replace(/^0+/, "");
	if (digits.startsWith("55") && digits.length > 13) digits = digits.slice(2);
	if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
	return `https://wa.me/${digits}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;
};
//#endregion
export { whatsappLink as a, formatTime as i, formatDate as n, formatDateTime as r, formatBRL as t };
