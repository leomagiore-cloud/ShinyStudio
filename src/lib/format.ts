export const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

export const formatDate = (iso: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));

export const formatDateTime = (iso: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export const formatTime = (iso: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
};

export const whatsappLink = (phone: string, msg?: string) => {
  let digits = onlyDigits(phone).replace(/^0+/, "");
  // Remove DDI 55 duplicado (ex.: 5555...)
  if (digits.startsWith("55") && digits.length > 13) digits = digits.slice(2);
  // Número BR sem DDI (10 fixo / 11 móvel) → adiciona 55
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return `https://wa.me/${digits}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;
};

