'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useState } from 'react';
import { Loader2, Download, FileText } from 'lucide-react';

export default function DownloadPdfBtn({ trip, variant = 'default' }) {
  const [generating, setGenerating] = useState(false);
  const isFull = variant === 'full';
  const isIcon = variant === 'icon';

  // --- IDENTITY HELPER (Local Copy for PDF) ---
  // Ensure we use the exact same logic as Dashboard for consistency
  const standardizeIdentity = (input) => {
    if (!input) return null;
    const rawId = typeof input === 'string' ? input : (input.userId || input.id);
    const rawName = typeof input === 'string' ? '' : (input.display_name || input.name || input.fullName || input.firstName || input.email || '');

    // 1. Owner
    if (rawId === trip.userId) {
      return { id: trip.userId, name: trip.owner_display_name || "Owner" };
    }
    // 2. Priyanshu (Hardcoded for this user context)
    if (rawName.toLowerCase().includes('priyanshu') || rawName === 'shardapriyanshu10@gmail.com') {
      return { id: 'canonical_priyanshu', name: "Priyanshu" };
    }
    // 3. Default
    return { id: rawId, name: rawName || 'Unknown' };
  };

  const generatePDF = () => {
    setGenerating(true);
    const doc = new jsPDF();

    // --- 0. PREPARE DATA ---
    const uniquePayersMap = new Map();
    // Add Owner
    const owner = standardizeIdentity({ userId: trip.userId, name: trip.owner_display_name });
    uniquePayersMap.set(owner.id, owner);
    // Add Collaborators
    (trip.collaborators || []).forEach(c => {
      const std = standardizeIdentity(c);
      if (std && std.id !== owner.id) uniquePayersMap.set(std.id, std);
    });
    const potentialPayers = Array.from(uniquePayersMap.values());

    // STATS AGGREGATION
    const statsMap = {}; // { id: { name, totalSpent, sharedContribution, netBalance } }
    potentialPayers.forEach(p => {
      statsMap[p.id] = { id: p.id, name: p.name, totalSpent: 0, sharedDebt: 0 };
    });

    (trip.expenses || []).forEach(exp => {
      const amount = Number(exp.amount) || 0;

      // Payer
      const payerStd = standardizeIdentity(exp.payer);
      if (payerStd) {
        if (!statsMap[payerStd.id]) statsMap[payerStd.id] = { id: payerStd.id, name: payerStd.name, totalSpent: 0, sharedDebt: 0 };
        statsMap[payerStd.id].totalSpent += amount;
      }

      // Participants
      let activeParticipants = [];
      if (exp.participants && exp.participants.length > 0) {
        activeParticipants = exp.participants.map(p => standardizeIdentity(p)).filter(Boolean);
      } else {
        activeParticipants = potentialPayers;
      }

      // Dedupe
      const uniqueParts = new Map();
      activeParticipants.forEach(p => uniqueParts.set(p.id, p));
      const finalParts = Array.from(uniqueParts.values());

      if (finalParts.length > 0) {
        const share = amount / finalParts.length;
        finalParts.forEach(p => {
          if (!statsMap[p.id]) statsMap[p.id] = { id: p.id, name: p.name, totalSpent: 0, sharedDebt: 0 };
          statsMap[p.id].sharedDebt += share;
        });
      }
    });

    // --- 1. HEADER ---
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text(`Trip to ${trip.destination.name}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Travelers: ${potentialPayers.map(p => p.name).join(', ')}`, 14, 28);
    doc.text(`Dates: ${new Date(trip.startDate).toDateString()}`, 14, 34);

    // --- 2. BUDGET VISUALS ---
    let currentY = 45;

    // Budget Bar Text
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Budget Overview", 14, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Budget: Rs.${trip.budget_limit.toLocaleString()}`, 14, currentY);

    // Spent Text (Colored)
    const totalSpent = trip.total_actual_cost || 0;
    const remaining = trip.budget_limit - totalSpent;
    const isOver = remaining < 0;

    doc.setTextColor(isOver ? 220 : 16, isOver ? 38 : 163, isOver ? 38 : 74); // Red or Green
    doc.text(`Spent: Rs.${totalSpent.toLocaleString()}`, 80, currentY);

    doc.setTextColor(isOver ? 220 : 100, isOver ? 38 : 100, isOver ? 38 : 100);
    doc.text(`Remaining: Rs.${remaining.toLocaleString()}`, 140, currentY);

    currentY += 10;

    // --- 3. INDIVIDUAL SPENDING BREAKDOWN (NEW) ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Individual Spending Breakdown", 14, currentY);
    currentY += 6;

    const spendingRows = Object.values(statsMap).map(stat => [
      stat.name,
      `Rs.${stat.totalSpent.toLocaleString()}`,
      `Rs.${Math.round(stat.sharedDebt).toLocaleString()}`, // Their fair share of group pool
      `Rs.${Math.round(stat.totalSpent - stat.sharedDebt).toLocaleString()}` // Net Balance
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Name', 'Total Spent (Gross)', 'Fair Share (Owed)', 'Net Balance (+Gets/-Pays)']],
      body: spendingRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    currentY = doc.lastAutoTable.finalY + 15;


    // --- 4. EXPENSE LOG ---
    doc.setFontSize(14);
    doc.text("Detailed Expense Log", 14, currentY);
    currentY += 6;

    const expenseRows = (trip.expenses || []).slice().reverse().map(exp => {
      const payer = standardizeIdentity(exp.payer)?.name || 'Unknown';
      // Participants String
      let partsStr = "Everyone";
      if (exp.participants && exp.participants.length > 0) {
        if (exp.participants.length === 1) partsStr = "Personal";
        else partsStr = `${exp.participants.length} People`;
      }

      return [
        new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        exp.description,
        exp.category,
        `Rs.${exp.amount.toLocaleString()}`,
        payer,
        partsStr
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Date', 'Description', 'Category', 'Cost', 'Paid By', 'Split']],
      body: expenseRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }, // Slate 900
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 50 },
        3: { halign: 'right' }
      }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // --- 5. SETTLEMENT PLAN (Simple English) ---
    doc.setFontSize(14);
    doc.text("Settlement Plan", 14, currentY);
    currentY += 8;

    // Calculate final net balances
    const netBalances = Object.values(statsMap).map(s => ({
      id: s.id,
      name: s.name,
      amount: s.totalSpent - s.sharedDebt
    }));

    const debtors = netBalances.filter(b => b.amount < -1).sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
    const creditors = netBalances.filter(b => b.amount > 1).sort((a, b) => b.amount - a.amount); // Descending (most positive first)

    let i = 0; let j = 0;
    let hasSettlements = false;
    doc.setFontSize(10);
    doc.setTextColor(50);

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

      // "Name owes Name Rs.X"
      doc.text(`• ${debtor.name} needs to pay ${creditor.name} Rs.${Math.round(amount).toLocaleString()}`, 14, currentY);
      currentY += 6;
      hasSettlements = true;

      debtor.amount += amount;
      creditor.amount -= amount;

      if (Math.abs(debtor.amount) < 1) i++;
      if (creditor.amount < 1) j++;
    }

    if (!hasSettlements) {
      doc.text("All settled up! No payments needed.", 14, currentY);
    }

    // --- 6. SAVE ---
    doc.save(`Trip_${trip.destination.name}_Expenses.pdf`);
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