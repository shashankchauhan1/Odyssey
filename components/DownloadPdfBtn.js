'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DownloadPdfBtn({ trip }) {
  
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

    // 2. Prepare Table Data
    const tableRows = [];
    
    trip.itinerary.forEach((dayItem) => {
      // Add a "Header" row for the Day
      tableRows.push([{ content: `Day ${dayItem.day}`, colSpan: 4, styles: { fillColor: [220, 220, 220], fontStyle: 'bold' } }]);

      // Add events for that day
      dayItem.events.forEach(event => {
        tableRows.push([
          event.startTime,
          event.title,
          event.type,
          `Rs.${event.cost}`
        ]);
      });
    });

    // 3. Draw Table (USING FUNCTIONAL APPROACH)
    autoTable(doc, {
      startY: 45,
      head: [['Time', 'Activity', 'Type', 'Cost']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    // 4. Expense Breakdown by Category
    let currentY = (doc.lastAutoTable?.finalY || 45) + 15;
    
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
    doc.save(`Trip_to_${trip.destination.name}.pdf`);
  };

  return (
    <button 
      onClick={generatePDF}
      className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 transition flex items-center gap-2"
    >
      <span>⬇️</span> Download PDF
    </button>
  );
}