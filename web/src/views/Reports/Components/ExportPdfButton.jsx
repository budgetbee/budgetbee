import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import numeral from "numeral";

// ─── colour palette ───────────────────────────────────────────────────────────
const C = {
    purple:     [109, 40,  217],
    purpleLight:[237, 233, 254],
    green:      [22,  163, 74],
    greenLight: [220, 252, 231],
    red:        [220, 38,  38],
    redLight:   [254, 226, 226],
    blue:       [37,  99,  235],
    blueLight:  [219, 234, 254],
    gray:       [107, 114, 128],
    grayLight:  [243, 244, 246],
    black:      [17,  24,  39],
    white:      [255, 255, 255],
    divider:    [229, 231, 235],
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const setFill  = (doc, rgb) => doc.setFillColor(...rgb);
const setTxt   = (doc, rgb) => doc.setTextColor(...rgb);
const setDraw  = (doc, rgb) => doc.setDrawColor(...rgb);

function sectionTitle(doc, text, y) {
    setTxt(doc, C.purple);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(text, 14, y);
    setDraw(doc, C.purple);
    doc.setLineWidth(0.4);
    doc.line(14, y + 1.5, 196, y + 1.5);
    return y + 8;
}

function metricBox(doc, x, y, w, h, label, value, color) {
    setFill(doc, C.grayLight);
    setDraw(doc, C.divider);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");
    // left accent bar
    setFill(doc, color);
    doc.roundedRect(x, y, 2.5, h, 1, 1, "F");
    // label
    setTxt(doc, C.gray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(label, x + 6, y + 7);
    // value
    setTxt(doc, color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(value, x + 6, y + 17);
}

function progressBar(doc, x, y, totalW, frac, color) {
    const h = 1.5;
    setFill(doc, C.divider);
    doc.roundedRect(x, y, totalW, h, 0.5, 0.5, "F");
    if (frac > 0) {
        setFill(doc, color);
        doc.roundedRect(x, y, Math.max(1, totalW * Math.min(frac, 1)), h, 0.5, 0.5, "F");
    }
}

function getChartImage(id) {
    const canvas = document.querySelector(`#${id} canvas`);
    if (!canvas) return null;
    try { return canvas.toDataURL("image/png"); } catch (e) { return null; }
}

// ─── main generator ───────────────────────────────────────────────────────────
async function generateReportPdf({ searchData, reportData }) {
    const { balance, topExpenses, expenseCategories, incomeCategories } = reportData;

    const currency = balance?.currency_symbol ?? "";
    const income   = balance?.incomes ?? 0;
    const expenses = Math.abs(balance?.expenses ?? 0);
    const net      = income - expenses;
    const savings  = income > 0 ? Math.max(0, (net / income) * 100) : 0;

    const fmt = (v) => `${currency} ${numeral(Math.abs(v)).format("0,0.00")}`;
    const pct = (v) => `${numeral(v).format("0.0")}%`;

    // capture chart images before PDF generation (canvases are already rendered)
    const imgTimeline = getChartImage("pdf-chart-timeline");
    const imgExpenses = getChartImage("pdf-chart-expenses");
    const imgIncome   = getChartImage("pdf-chart-income");

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();

    // ── HEADER ────────────────────────────────────────────────────────────────
    setFill(doc, C.black);
    doc.rect(0, 0, PW, 24, "F");
    // purple accent strip
    setFill(doc, C.purple);
    doc.rect(0, 0, 3, 24, "F");

    setTxt(doc, C.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("BudgetBee", 10, 12);

    setTxt(doc, [167, 139, 250]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Financial Report", 10, 20);

    setTxt(doc, [156, 163, 175]);
    doc.setFontSize(8);
    doc.text(`${searchData.from_date}  to  ${searchData.to_date}`, PW - 14, 12, { align: "right" });
    doc.text(
        `Generated on ${new Date().toLocaleDateString(undefined, { dateStyle: "medium" })}`,
        PW - 14, 20, { align: "right" }
    );

    let y = 32;

    // ── SUMMARY ───────────────────────────────────────────────────────────────
    y = sectionTitle(doc, "Summary", y);

    const boxW = (PW - 28 - 9) / 4;
    const boxH = 24;
    [
        { label: "Total Income",   value: fmt(income),   color: C.green  },
        { label: "Total Expenses", value: fmt(expenses), color: C.red    },
        { label: "Net Balance",    value: fmt(net),      color: net >= 0 ? C.blue : C.red },
        { label: "Savings Rate",   value: pct(savings),  color: C.purple },
    ].forEach((m, i) => {
        metricBox(doc, 14 + i * (boxW + 3), y, boxW, boxH, m.label, m.value, m.color);
    });

    y += boxH + 12;

    // ── TOP EXPENSES ──────────────────────────────────────────────────────────
    if (topExpenses.length > 0) {
        y = sectionTitle(doc, "Top Expense Categories", y);

        const colW = (PW - 28 - (topExpenses.length - 1) * 3) / topExpenses.length;
        const cH = 26;
        topExpenses.forEach((cat, i) => {
            const bx = 14 + i * (colW + 3);
            setFill(doc, C.grayLight);
            setDraw(doc, C.divider);
            doc.setLineWidth(0.3);
            doc.roundedRect(bx, y, colW, cH, 2, 2, "FD");

            const medals = ["#1", "#2", "#3"];
            setTxt(doc, C.purple);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.text(medals[i] ?? `#${i+1}`, bx + 4, y + 7);

            setTxt(doc, C.black);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            const name = cat.name.length > 22 ? cat.name.slice(0, 22) + "…" : cat.name;
            doc.text(name, bx + 4, y + 15);

            setTxt(doc, C.red);
            doc.setFontSize(8.5);
            doc.text(fmt(cat.amount), bx + 4, y + 22);

            const catPct = expenses > 0 ? Math.abs(cat.amount) / expenses : 0;
            progressBar(doc, bx + 4, y + 23.5, colW - 8, catPct, C.red);

            setTxt(doc, C.gray);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.text(pct(catPct * 100) + " of expenses", bx + colW - 5, y + 22, { align: "right" });
        });

        y += cH + 14;
    }

    // ── BALANCE OVER TIME ─────────────────────────────────────────────────────
    if (imgTimeline) {
        if (y > PH - 85) { doc.addPage(); y = 20; }
        y = sectionTitle(doc, "Balance Over Time", y);
        doc.addImage(imgTimeline, "PNG", 14, y, 182, 65);
        y += 65 + 12;
    }

    // ── category table helper ─────────────────────────────────────────────────
    const renderCategoryTable = (categories, totalAmt, accentColor, accentLight, startY) => {
        if (!categories || Object.keys(categories).length === 0) return startY;

        const rows = Object.entries(categories)
            .map(([key, cat]) => ({
                name:   cat.name || key,
                amount: cat.total || cat.amount || 0,
                share:  totalAmt > 0 ? (Math.abs(cat.total || cat.amount || 0) / Math.abs(totalAmt)) * 100 : 0,
            }))
            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

        autoTable(doc, {
            startY,
            margin: { left: 14, right: 14 },
            head: [["Category", "Amount", "Share"]],
            body: rows.map((r) => [r.name, fmt(r.amount), pct(r.share)]),
            headStyles: {
                fillColor: accentColor,
                textColor: C.white,
                fontStyle: "bold",
                fontSize: 8.5,
                cellPadding: 3,
            },
            bodyStyles: {
                fontSize: 8,
                textColor: C.black,
                cellPadding: 2.5,
            },
            alternateRowStyles: { fillColor: accentLight },
            columnStyles: {
                0: { cellWidth: "auto" },
                1: { halign: "right", cellWidth: 38, fontStyle: "bold", textColor: accentColor },
                2: { halign: "right", cellWidth: 22 },
            },
            tableLineColor: C.divider,
            tableLineWidth: 0.2,
        });

        return doc.lastAutoTable.finalY + 12;
    };

    // ── EXPENSES BY CATEGORY ──────────────────────────────────────────────────
    if (y > PH - 90) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, "Expenses by Category", y);
    if (imgExpenses) {
        doc.addImage(imgExpenses, "PNG", (PW - 70) / 2, y, 70, 70);
        y += 70 + 6;
    }
    y = renderCategoryTable(expenseCategories, expenses, C.red, C.redLight, y);

    // ── INCOME BY CATEGORY ────────────────────────────────────────────────────
    if (y > PH - 90) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, "Income by Category", y);
    if (imgIncome) {
        doc.addImage(imgIncome, "PNG", (PW - 70) / 2, y, 70, 70);
        y += 70 + 6;
    }
    y = renderCategoryTable(incomeCategories, income, C.green, C.greenLight, y);

    // ── FOOTER on every page ──────────────────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        setFill(doc, C.black);
        doc.rect(0, PH - 9, PW, 9, "F");
        setTxt(doc, [107, 114, 128]);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text("Generated by BudgetBee", 14, PH - 3.5);
        doc.text(`Page ${p} / ${totalPages}`, PW - 14, PH - 3.5, { align: "right" });
    }

    return doc;
}

// ─── React component ──────────────────────────────────────────────────────────
export default function ExportPdfButton({ searchData, reportData, filename = "financial-report" }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleExport = async () => {
        if (!reportData || reportData.isLoading) return;
        setIsGenerating(true);
        try {
            const doc = await generateReportPdf({ searchData, reportData });
            doc.save(`${filename}.pdf`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isGenerating || reportData?.isLoading}
            className={`flex items-center gap-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                isGenerating || reportData?.isLoading
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-900/40"
            }`}
        >
            <FontAwesomeIcon
                icon={isGenerating ? "fa-solid fa-spinner" : "fa-solid fa-file-pdf"}
                className={isGenerating ? "animate-spin" : ""}
            />
            {isGenerating ? "Generating…" : "Export PDF"}
        </button>
    );
}


