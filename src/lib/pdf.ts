"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfTable { title: string; columns: string[]; rows: (string | number)[][] }

export function exportPdf({ title, subtitle, tables, filename }: { title: string; subtitle?: string; tables: PdfTable[]; filename: string }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
  doc.setFontSize(18);
  doc.setTextColor(5, 150, 112);
  doc.text("SurjoSangstha", 40, 40);
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(title, 40, 62);
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(`${subtitle ?? ""}  •  Generated ${new Date().toLocaleString("en-GB")}`, 40, 78);
  let y = 95;
  for (const t of tables) {
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(t.title, 40, y);
    autoTable(doc, { startY: y + 8, head: [t.columns], body: t.rows, styles: { fontSize: 8, cellPadding: 4 }, headStyles: { fillColor: [5, 150, 112] }, alternateRowStyles: { fillColor: [246, 248, 251] }, margin: { left: 40, right: 40 } });
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 28;
    if (y > 480) { doc.addPage(); y = 50; }
  }
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

