'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useState } from 'react';
import { Loader2, Download, FileText } from 'lucide-react';

import { standardizeIdentity } from '@/lib/identityUtils';

export default function DownloadPdfBtn({ trip, variant = 'default' }) {
  const [generating, setGenerating] = useState(false);
  const isFull = variant === 'full';
  const isIcon = variant === 'icon';


  const generatePDF = () => {
    setGenerating(true);
    const doc = new jsPDF();

    // --- 0. PREPARE DATA ---
    const uniquePayersMap = new Map();
    // Add Owner
    // For PDF, we don't 'Me' anyone, we want real names. So we pass null as currentUserId.
    const owner = standardizeIdentity({ userId: trip.userId, name: trip.owner_display_name }, trip.userId, null);
    if (owner) uniquePayersMap.set(owner.id, owner);

    // Add Collaborators
    (trip.collaborators || []).forEach(c => {
      const std = standardizeIdentity(c, trip.userId, null);
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
      const payerStd = standardizeIdentity(exp.payer, trip.userId, null);
      if (payerStd) {
        if (!statsMap[payerStd.id]) statsMap[payerStd.id] = { id: payerStd.id, name: payerStd.name, totalSpent: 0, sharedDebt: 0 };
        statsMap[payerStd.id].totalSpent += amount;
      }

      // Participants
      let activeParticipants = [];
      if (exp.participants && exp.participants.length > 0) {
        activeParticipants = exp.participants.map(p => standardizeIdentity(p, trip.userId, null)).filter(Boolean);
      } else {
        activeParticipants = potentialPayers;
      }

      // Dedupe
      const uniqueParts = new Map();
      activeParticipants.forEach(p => uniqueParts.set(p.id, p));
      const finalParts = Array.from(uniqueParts.values());

      const isPersonal = finalParts.length === 1;

      if (finalParts.length > 0 && !isPersonal) {
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
      const payer = standardizeIdentity(exp.payer, trip.userId, null)?.name || 'Unknown';
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

    // --- 6. DETAILED ITINERARY (Bento Structure) ---
    if (trip.itinerary && trip.itinerary.length > 0) {
      doc.addPage();
      currentY = 20;

      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229);
      doc.text("Detailed Itinerary & AI Suggestions", 14, currentY);
      currentY += 10;

      trip.itinerary.forEach((day, index) => {
        // Page break check
        if (currentY > 250) { doc.addPage(); currentY = 20; }

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.setDrawColor(79, 70, 229);
        doc.line(14, currentY, 14, currentY + 6); // visual marker
        doc.text(`Day ${day.day}: ${day.theme || 'Exploration'}`, 18, currentY + 5);
        currentY += 12;

        const processSlot = (label, data) => {
          if (!data) return;
          if (currentY > 260) { doc.addPage(); currentY = 20; }

          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(`[${label}] ${data.title}`, 18, currentY);
          currentY += 5;

          doc.setFontSize(9);
          doc.setTextColor(150);
          const descLines = doc.splitTextToSize(data.description || '', 170);
          doc.text(descLines, 18, currentY);
          currentY += (descLines.length * 4) + 2;

          if (data.proTip || data.logistics_tip) {
            doc.setTextColor(79, 70, 229);
            doc.text(`Tip: ${data.proTip || data.logistics_tip}`, 18, currentY);
            currentY += 5;
          }

          if (data.cost > 0) {
            doc.setTextColor(34, 197, 94); // Green
            doc.text(`Est. Cost: ${data.currency} ${data.cost}`, 18, currentY);
            currentY += 6;
          } else {
            currentY += 2;
          }
        };

        const acts = day.activities || {};

        // 1. New Structure (Morning/Afternoon/Evening objects)
        if (acts.morning || acts.afternoon || acts.evening) {
          if (acts.morning) processSlot("Morning", acts.morning);
          if (acts.afternoon) processSlot("Afternoon", acts.afternoon);
          if (acts.evening) processSlot("Evening", acts.evening);
        }
        // 2. Fallback for Old Data (Array based or Events)
        else if (Array.isArray(acts)) {
          acts.forEach(activity => processSlot(activity.time || "Activity", activity));
        }
        else if (day.events) {
          day.events.forEach(e => processSlot(e.timeBlock || "Event", e));
        }

        currentY += 5; // Spacing between days
      });
    }

    // --- 7. SAVE ---
    doc.save(`Trip_${trip.destination.name}_Plan.pdf`);
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