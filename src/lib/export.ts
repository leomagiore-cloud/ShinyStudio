import { jsPDF } from "jspdf";

const PRIMARY: [number, number, number] = [225, 29, 72];
const INK: [number, number, number] = [30, 30, 35];
const MUTED: [number, number, number] = [110, 110, 120];
const BRAND = "Shiny Studio";
const DEVELOPER_IG = "https://www.instagram.com/magiore.br";

/** Nome padrão: ShinyStudio-NomeDaAba.pdf / .csv */
export function shinyFileName(tabName: string, ext: "pdf" | "csv" = "pdf") {
  const clean = tabName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `ShinyStudio-${clean}.${ext}`;
}

export function downloadCsv(tabName: string, headers: string[], rows: (string | number)[][]) {
  const filename = shinyFileName(tabName, "csv");
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadTablePdf(
  tabName: string,
  headers: string[],
  rows: (string | number)[][],
  subtitle?: string,
) {
  const title = tabName;
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: headers.length > 5 ? "landscape" : "portrait",
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;
  const usableWidth = pageWidth - marginX * 2;
  const colWidth = usableWidth / headers.length;

  function drawPageHeader() {
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, pageWidth, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(BRAND, marginX, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(title + (subtitle ? ` — ${subtitle}` : ""), marginX, 17);
    doc.setTextColor(...INK);
  }

  function drawPageFooter() {
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} · ${rows.length} registro(s)`,
      marginX,
      pageHeight - 6,
    );
    doc.setTextColor(...PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.textWithLink("Desenvolvido por @magiore.br", pageWidth - marginX, pageHeight - 6, {
      url: DEVELOPER_IG,
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
  }

  function drawTableHeader(y: number) {
    doc.setFillColor(245, 245, 247);
    doc.rect(marginX, y - 4.5, usableWidth, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    headers.forEach((h, i) => doc.text(String(h), marginX + i * colWidth + 1.5, y));
    return y + 6;
  }

  drawPageHeader();
  let y = 32;
  y = drawTableHeader(y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  rows.forEach((row, idx) => {
    if (y > pageHeight - 16) {
      drawPageFooter();
      doc.addPage();
      drawPageHeader();
      y = 32;
      y = drawTableHeader(y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    }
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 251);
      doc.rect(marginX, y - 4, usableWidth, 5.5, "F");
    }
    row.forEach((cell, i) => {
      const text = doc.splitTextToSize(String(cell ?? ""), colWidth - 3)[0] ?? "";
      doc.text(text, marginX + i * colWidth + 1.5, y);
    });
    y += 5.5;
  });

  drawPageFooter();
  doc.save(shinyFileName(tabName, "pdf"));
}