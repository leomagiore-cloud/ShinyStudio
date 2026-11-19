import { jsPDF } from "jspdf";
import { formatBRL, formatDate, formatDateTime, formatDuration, onlyDigits } from "@/lib/format";

const BRAND = "Shiny Studio";
const PRIMARY: [number, number, number] = [225, 29, 72]; // rose/red do app
const INK: [number, number, number] = [30, 30, 35];
const MUTED: [number, number, number] = [110, 110, 120];
const STUDIO_IG = "https://www.instagram.com/esteticashiny/";
const DEVELOPER_IG = "https://www.instagram.com/magiore.br";

function drawHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(BRAND, 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Estética automotiva", 14, 19.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, pageWidth - 14, 13, { align: "right" });
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(subtitle, pageWidth - 14, 19.5, { align: "right" });
  }
  doc.setTextColor(...INK);
  return 38; // próximo Y livre
}

function sectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(text.toUpperCase(), 14, y);
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.3);
  doc.line(14, y + 1.5, doc.internal.pageSize.getWidth() - 14, y + 1.5);
  doc.setTextColor(...INK);
  return y + 7;
}

function drawFooter(doc: jsPDF, leftText: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(leftText, 14, pageH - 10);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.textWithLink("Desenvolvido por @magiore.br", pageWidth - 14, pageH - 10, {
    url: DEVELOPER_IG,
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK);
}

const paymentMethodLabel: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência",
  convenio: "Convênio",
  pendente: "Pendente",
};

async function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; format: string } | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const format = dataUrl.includes("image/png") ? "PNG" : "JPEG";
    return { dataUrl, format };
  } catch {
    return null;
  }
}

export async function generateOsPdf(
  order: {
    order_number: number;
    service_name: string;
    amount: number;
    payment_method: string;
    installments?: number;
    status: string;
    notes?: string | null;
    created_at: string;
    completed_at?: string | null;
    clients?: { name?: string | null; whatsapp?: string | null } | null;
    vehicles?: { brand?: string | null; model?: string | null; plate?: string | null } | null;
  },
  items: { service_name: string; price: number }[] = [],
  photos: { kind: "antes" | "depois"; url: string }[] = [],
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = drawHeader(doc, "Ordem de Serviço", `#${String(order.order_number).padStart(4, "0")}`);

  y = sectionTitle(doc, "Cliente e veículo", y + 4);
  doc.setFontSize(10);
  doc.text(`Cliente: ${order.clients?.name ?? "—"}`, 14, y);
  y += 6;
  const vehicle = [order.vehicles?.brand, order.vehicles?.model].filter(Boolean).join(" ");
  doc.text(
    `Veículo: ${vehicle || "—"}${order.vehicles?.plate ? `  ·  Placa: ${order.vehicles.plate}` : ""}`,
    14,
    y,
  );
  y += 10;

  y = sectionTitle(doc, items.length > 1 ? "Serviços realizados" : "Serviço realizado", y);
  doc.setFontSize(10);
  if (items.length > 1) {
    for (const item of items) {
      doc.text(item.service_name, 14, y);
      doc.text(formatBRL(Number(item.price)), doc.internal.pageSize.getWidth() - 14, y, {
        align: "right",
      });
      y += 6;
    }
  } else {
    doc.text(order.service_name, 14, y);
    y += 6;
  }
  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.text(`Aberta em ${formatDateTime(order.created_at)}`, 14, y);
  if (order.completed_at) {
    y += 5;
    doc.text(`Concluída em ${formatDateTime(order.completed_at)}`, 14, y);
  }
  doc.setTextColor(...INK);
  y += 10;

  if (order.notes) {
    y = sectionTitle(doc, "Observações", y);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(order.notes, doc.internal.pageSize.getWidth() - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 6;
  }

  y = sectionTitle(doc, "Pagamento", y);
  doc.setFontSize(10);
  const methodLabel = paymentMethodLabel[order.payment_method] ?? order.payment_method;
  const installmentsText =
    order.payment_method === "cartao_credito" && (order.installments ?? 1) > 1
      ? ` em ${order.installments}x`
      : "";
  doc.text(`Forma de pagamento: ${methodLabel}${installmentsText}`, 14, y);
  y += 10;

  doc.setFillColor(245, 245, 247);
  doc.roundedRect(14, y - 6, doc.internal.pageSize.getWidth() - 28, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Valor total", 20, y + 2);
  doc.text(formatBRL(Number(order.amount)), doc.internal.pageSize.getWidth() - 20, y + 2, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");

  const antesPhotos = photos.filter((p) => p.kind === "antes");
  const depoisPhotos = photos.filter((p) => p.kind === "depois");
  const pairCount = Math.max(antesPhotos.length, depoisPhotos.length);

  if (pairCount > 0) {
    doc.addPage();
    y = drawHeader(doc, "Antes & Depois", `OS #${String(order.order_number).padStart(4, "0")}`);
    y += 6;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const colWidth = (pageWidth - 14 * 2 - 6) / 2;
    const rowHeight = 60;

    for (let i = 0; i < pairCount; i++) {
      if (y + rowHeight + 8 > pageHeight - 14) {
        drawFooter(doc, `Documento gerado em ${formatDate(new Date())} · ${BRAND}`);
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text("Antes", 14, y);
      doc.text("Depois", 14 + colWidth + 6, y);
      doc.setTextColor(...INK);
      y += 4;

      const a = antesPhotos[i];
      const d = depoisPhotos[i];
      if (a) {
        const img = await loadImageAsDataUrl(a.url);
        if (img) doc.addImage(img.dataUrl, img.format, 14, y, colWidth, rowHeight, undefined, "FAST");
      }
      if (d) {
        const img = await loadImageAsDataUrl(d.url);
        if (img)
          doc.addImage(img.dataUrl, img.format, 14 + colWidth + 6, y, colWidth, rowHeight, undefined, "FAST");
      }
      y += rowHeight + 10;
    }
  }

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, `Documento gerado em ${formatDate(new Date())} · ${BRAND}`);
  }

  return doc.output("blob");
}

export function generateCatalogPdf(
  services: {
    name: string;
    description?: string | null;
    price: number;
    duration_minutes: number;
  }[],
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = drawHeader(doc, "Catálogo de Serviços");
  y = sectionTitle(doc, "Serviços disponíveis", y + 4);

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (const s of services) {
    if (y > pageHeight - 30) {
      drawFooter(doc, `Gerado em ${formatDate(new Date())} · ${BRAND}`);
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(s.name, 14, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text(formatBRL(Number(s.price)), pageWidth - 14, y, { align: "right" });
    doc.setTextColor(...INK);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(`Duração aproximada: ${formatDuration(s.duration_minutes)}`, 14, y);
    doc.setTextColor(...INK);
    y += 5;

    if (s.description) {
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(s.description, pageWidth - 28);
      doc.text(lines, 14, y);
      y += lines.length * 4.5 + 3;
    }
    doc.setDrawColor(230, 230, 232);
    doc.line(14, y, pageWidth - 14, y);
    y += 7;
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, `Gerado em ${formatDate(new Date())} · ${BRAND}`);
  }

  return doc.output("blob");
}

/**
 * Tenta compartilhar o PDF pelo seletor nativo (WhatsApp no celular).
 * Se não suportar, baixa o arquivo e abre o WhatsApp com mensagem.
 */
export async function sharePdfToWhatsapp(
  blob: Blob,
  filename: string,
  phone?: string,
  text?: string,
) {
  const file = new File([blob], filename, { type: "application/pdf" });

  if (typeof navigator !== "undefined" && (navigator as any).canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename, text });
      return "shared" as const;
    } catch {
      return "cancelled" as const;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);

  const digits = phone ? onlyDigits(phone) : "";
  const waText = `${text ?? ""}\n\n(Segue o PDF ${filename} que acabei de baixar — anexe aqui no WhatsApp)`;
  const waUrl = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(waText)}`
    : `https://wa.me/?text=${encodeURIComponent(waText)}`;
  window.open(waUrl, "_blank");
  return "downloaded" as const;
}