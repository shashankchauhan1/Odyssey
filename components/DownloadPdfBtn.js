'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <--- CHANGED IMPORT

export default function DownloadPdfBtn({ trip }) {
  
  const generatePDF = () => {
    const doc = new jsPDF();

    // 1. Title & Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Blue color
    doc.text(`Trip to ${trip.destination.name}`, 14, 20);

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

    // 4. Footer (Expenses) - Use 'lastAutoTable.finalY' from the doc
    const finalY = (doc.lastAutoTable?.finalY || 45) + 10;
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Expense Summary", 14, finalY);
    
    doc.setFontSize(10);
    doc.text(`Total Budget: Rs.${trip.budget_limit}`, 14, finalY + 8);
    doc.text(`Actual Spent: Rs.${trip.total_actual_cost}`, 14, finalY + 14);
    
    const remaining = trip.budget_limit - trip.total_actual_cost;
    doc.setTextColor(remaining < 0 ? 200 : 0, 0, 0); // Red if over budget
    doc.text(`Remaining: Rs.${remaining}`, 14, finalY + 20);

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