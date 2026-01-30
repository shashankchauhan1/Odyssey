'use client';

import { useState } from 'react';

export default function ExpenseTracker({ tripId, budget, expenses = [], onExpenseUpdate }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // calculate stats
  const totalSpent = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const remaining = budget - totalSpent;
  const progress = Math.min((totalSpent / budget) * 100, 100);

  //color: green -> yellow (>50%) -> red (>90%)
  let progressColor = "bg-green-500";
  if (progress > 50) progressColor = "bg-yellow-500";
  if (progress > 90) progressColor = "bg-red-500";

  // add expense handler
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!desc || !amount) return;
    
    setIsAdding(true);
    try {
      // Note: We send 'description' to match the API
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: desc, 
          amount: amount, 
          category: 'Misc' 
        })
      });

      const json = await res.json();
      if (json.success) {
        onExpenseUpdate(json.data.expenses); // Update parent UI immediately
        setDesc("");
        setAmount("");
      } else {
        alert("Error: " + json.error);
      }
    } catch (err) {
      alert("Failed to add expense");
    } finally {
      setIsAdding(false);
    }
  };

  // Delete Expense Handler
  const handleDelete = async (expenseId) => {
    if(!confirm("Delete this expense?")) return;

    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenseId })
      });

      const json = await res.json();
      if (json.success) {
        onExpenseUpdate(json.data.expenses); 
      }
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">💰 Wallet & Budget</h3>
      
      {/* progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2 font-medium">
          <span className="text-slate-600">Spent: {totalSpent.toLocaleString()}</span>
          <span className={remaining < 0 ? "text-red-500 font-bold" : "text-slate-600"}>
            Left: {remaining.toLocaleString()}
          </span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${progressColor}`} 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* add expense */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input 
          type="text" 
          placeholder="Lunch, Taxi..." 
          className="flex-1 p-2 bg-gray-50 border rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-black"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <input 
          type="number" 
          placeholder="¤" 
          className="w-20 p-2 bg-gray-50 border rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-black"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button 
          disabled={isAdding}
          className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition"
        >
          {isAdding ? "..." : "+"}
        </button>
      </form>

      {/* scrollable expense list */}
      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {expenses.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No expenses yet.</p>
        )}
        
        {/* reverse to show the newest item at the top */}
        {[...expenses].reverse().map((exp, i) => (
          <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 group">
            
            <div className="flex items-center gap-2">
              {/* delete button visible only on hover */}
              <button 
                onClick={() => handleDelete(exp._id)} 
                className="text-gray-400 hover:text-red-500 font-bold px-1 transition text-lg leading-none"
                title="Delete"
              >
                ×
              </button>
              
              <span className="text-slate-700 font-medium">
                {exp.description || exp.title}
              </span>
            </div>

            <span className="font-bold text-slate-900">
              - {exp.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}