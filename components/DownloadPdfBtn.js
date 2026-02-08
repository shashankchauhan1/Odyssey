'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useState } from 'react';
import { Loader2, Download, FileText } from 'lucide-react';

export default function DownloadPdfBtn({ trip, variant = 'default' }) {
  const [generating, setGenerating] = useState(false);
  const isFull = variant === 'full';
  const isIcon = variant === 'icon';

  const generatePDF = () => {
    const doc = new jsPDF();  // it creates blank white page in screen

    // 1. Title & Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Blue color
    doc.text(`Trip to ${trip.destination.name}`, 14, 20); // (Text, X-coord, Y-coord)

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Travelers: ${trip.travelers} | Budget: Rs.${trip.budget_limit}`, 14, 30);
    doc.text(`Dates: ${new Date(trip.startDate).toDateString()}`, 14, 36);

    // Skip Itinerary Table as requested

    // 4. Expense Breakdown by Category
    let currentY = 45; // Start earlier

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Expense Summary", 14, currentY);

    // Calculate expenses by category
    const expensesByCategory = {};
    const expenses = trip.expenses || [];

    expenses.forEach(expense => {
      const category = expense.category || 'Misc';
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = { total: 0, count: 0, items: [] };
      }
      expensesByCategory[category].total += expense.amount;
      expensesByCategory[category].count += 1;
      expensesByCategory[category].items.push(expense);
    });

    currentY += 10;

    // Create expense breakdown table creating rows and column containing data
    const categoryRows = [];
    const categories = ['Food', 'Travel', 'Stay', 'Activities', 'Shopping', 'Misc'];

    categories.forEach(category => {
      if (expensesByCategory[category]) {
        const data = expensesByCategory[category];
        categoryRows.push([
          category,
          data.count.toString(),
          `Rs.${data.total.toLocaleString()}`
        ]);

        // Add individual items
        data.items.forEach(item => {
          categoryRows.push([
            `  - ${item.description}`,
            new Date(item.date).toLocaleDateString('en-IN'),
            `Rs.${item.amount}`
          ]);
        });
      }
    });

    if (categoryRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Category / Description', 'Date / Count', 'Amount']],
        body: categoryRows,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246] }, // Purple
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 50 },
          2: { cellWidth: 40, halign: 'right' }
        }
      });

      currentY = doc.lastAutoTable.finalY + 10;
    }

    // Budget Summary
    // The Financial Summary
    // Finally, at the bottom of the PDF, it prints the "Bottom Line":

    //Total Budget: (Black)
    //Total Spent: (Purple)
    //Remaining:
    // If Positive: Green text.
    // If Negative (Over budget): Red text.

    // --- SPLIT SUMMARY SECTION ---
    currentY += 10;
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Split Summary (Settlements)", 14, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setTextColor(80);

    // Re-calculate settlements (Duplicate logic from Dashboard for PDF)
    const balances = {};
    const potentialPayers = [
      { id: trip.userId, name: trip.owner_display_name || 'Owner' },
      ...(trip.collaborators || []).map(c => ({ id: c.userId, name: c.display_name || c.email || 'Partner' }))
    ];

    // Init
    potentialPayers.forEach(p => balances[p.id] = 0);

    (trip.expenses || []).forEach(exp => {
      const amount = exp.amount;
      const payerId = exp.payer?.userId;
      if (payerId) balances[payerId] = (balances[payerId] || 0) + amount;

      const splitCount = exp.participants?.length || 0;
      if (splitCount > 0) {
        const share = amount / splitCount;
        exp.participants.forEach(p => { balances[p.userId] = (balances[p.userId] || 0) - share; });
      } else {
        if (payerId) balances[payerId] -= amount;
      }
    });

    const debtors = [];
    const creditors = [];
    Object.entries(balances).forEach(([userId, amount]) => {
      if (amount < -0.01) debtors.push({ userId, amount });
      else if (amount > 0.01) creditors.push({ userId, amount });
    });

    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let i = 0; let j = 0;
    let settlementLines = [];

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
      const debtorName = potentialPayers.find(p => p.id === debtor.userId)?.name || 'Unknown';
      const creditorName = potentialPayers.find(p => p.id === creditor.userId)?.name || 'Unknown';

      settlementLines.push(`${debtorName} owes ${creditorName} Rs.${amount.toFixed(0)}`);

      debtor.amount += amount;
      creditor.amount -= amount;
      if (Math.abs(debtor.amount) < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    if (settlementLines.length > 0) {
      settlementLines.forEach(line => {
        doc.text(`• ${line}`, 14, currentY);
        currentY += 6;
      });
    } else {
      doc.text("No outstanding settlements.", 14, currentY);
      currentY += 6;
    }


    // --- BUDGET OVERVIEW ---
    currentY += 10;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Budget Overview", 14, currentY);

    currentY += 8;
    doc.setFontSize(11);
    doc.text(`Total Budget: Rs.${trip.budget_limit.toLocaleString()}`, 14, currentY);

    currentY += 6;
    doc.setTextColor(139, 92, 246); // Purple
    doc.text(`Total Spent: Rs.${trip.total_actual_cost.toLocaleString()}`, 14, currentY);

    currentY += 6;
    const remaining = trip.budget_limit - trip.total_actual_cost;
    doc.setTextColor(remaining < 0 ? 220 : 16, remaining < 0 ? 38 : 185, remaining < 0 ? 38 : 129); // Red or Green
    doc.text(`Remaining: ${remaining < 0 ? '-' : ''}Rs.${Math.abs(remaining).toLocaleString()}`, 14, currentY);

    // 5. Save
    doc.save(`Trip_to_${trip.destination.name}_Expenses.pdf`);
    setGenerating(false);
  };

  if (isFull) {
    return (
      <button
        onClick={generatePDF}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition font-bold text-sm min-h-[48px]"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {generating ? "Generating..." : "Download PDF"}
      </button>
    );
  }

  if (isIcon) {
    return (
      <button
        onClick={generatePDF}
        disabled={generating}
        className="flex items-center justify-center w-full h-full min-h-[48px] bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition"
        aria-label="Download PDF"
      >
        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <button
      onClick={generatePDF}
      disabled={generating}
      className="flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-900 transition shadow-sm w-full sm:w-auto min-h-[48px]"
    >
      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>⬇️</span>}
      <span>{generating ? "Generating..." : "Download PDF"}</span>
    </button>
  );
}