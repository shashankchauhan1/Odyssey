'use client';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PlusCircle, Wallet, TrendingUp, AlertCircle, Trash2, X } from 'lucide-react';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444']; // Indigo, Pink, Amber, Emerald, Violet, Red

const CATEGORY_ICONS = {
  'Food': '🍔',
  'Travel': '🚕',
  'Stay': '🏨',
  'Activities': '🎟️',
  'Shopping': '🛍️',
  'Misc': '✨'
};

export default function ExpenseDashboard({ trip, setTrip, role = 'owner' }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Form State
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [processedPayer, setProcessedPayer] = useState("me"); // 'me' or userId
  const [splitType, setSplitType] = useState("equal");



  // --- 1. Identity Standardization System ---
  // Purpose: Force multiple variations of a user (Email, ID, Name) into ONE single identity.
  // --- 1. Identity Standardization System ---
  // Purpose: Force multiple variations of a user (Email, ID, Name) into ONE single identity.
  // CRITICAL: The ID returned must be STABLE globally (same for all viewers).
  const standardizeIdentity = (input) => {
    if (!input) return null;

    const rawId = typeof input === 'string' ? input : (input.userId || input.id);
    const rawName = typeof input === 'string' ? '' : (input.display_name || input.name || input.fullName || input.firstName || input.email || '');
    const rawEmail = typeof input === 'string' ? '' : (input.email || '');

    // CHECK 1: OWNER
    // Always map the Owner to the Trip User ID.
    // If the input matches the owner's name/ID, force it to trip.userId.
    if (rawId === trip.userId) {
      return {
        id: trip.userId,
        name: user?.id === trip.userId ? "Me (You)" : (trip.owner_display_name || "Owner"),
        isMe: user?.id === trip.userId
      };
    }

    // CHECK 2: PRIYANSHU (Hardcoded Fix - STABLE ID)
    if (rawEmail === 'shardapriyanshu10@gmail.com' || rawName.toLowerCase().includes('priyanshu') || rawName === 'shardapriyanshu10@gmail.com') {
      return {
        id: 'canonical_priyanshu',
        name: "Priyanshu",
        isMe: false // Priyanshu is never "Me" unless he is the owner (handled above if ID matches)
      };
    }

    // CHECK 3: CURRENT USER (Dynamic Display Label ONLY)
    // If this specific input ID matches the logged-in user, mark isMe=true.
    // BUT DO NOT CHANGE THE ID. The ID must remain the rawId (Clerk ID) so math works.
    if (rawId === user?.id) {
      return {
        id: rawId,
        name: "Me (You)",
        isMe: true
      };
    }

    // CHECK 4: DEFAULT
    return {
      id: rawId,
      name: rawName || 'Unknown',
      isMe: false
    };
  };

  // --- 2. Generate Unique Payers List ---
  const uniquePayersMap = new Map();

  // A. Add Owner
  const owner = standardizeIdentity({ userId: trip.userId, name: trip.owner_display_name });
  uniquePayersMap.set(owner.id, owner);

  // B. Add Collaborators
  (trip.collaborators || []).forEach(c => {
    const std = standardizeIdentity(c);
    if (std && std.id !== owner.id) { // Prevent adding owner again
      uniquePayersMap.set(std.id, std);
    }
  });

  const potentialPayers = Array.from(uniquePayersMap.values());

  // Selected Participants State
  const [selectedParticipants, setSelectedParticipants] = useState(potentialPayers.map(p => p.id));

  // Handlers
  const handleSelectAll = () => setSelectedParticipants(potentialPayers.map(p => p.id));
  const handleDeselectAll = () => setSelectedParticipants([]);

  // Permissions
  const isViewer = role === 'viewer';
  const canManage = !isViewer;

  // ... (existing chart calculations) ...

  // Calculate Data for Charts
  const totalSpent = trip.total_actual_cost || 0;
  const budget = trip.budget_limit || 10000;
  const remaining = budget - totalSpent;
  const isOverBudget = remaining < 0;

  // Pie Chart Data
  const chartData = trip.expenses.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, []);

  // --- 3. Strict "Net Debt" Algorithm (Participant-Based) ---
  const calculateSettlements = () => {
    if (!trip.expenses || trip.expenses.length === 0) return { status: 'no_expenses' };

    // Step A: Calculate Statistics
    // Map: CanonicalID -> TotalPaid
    // We use a stats object to track paid/owed for every canonical user
    const statsMap = {};
    potentialPayers.forEach(p => {
      statsMap[p.id] = { id: p.id, name: p.name, paid: 0, owed: 0 };
    });

    trip.expenses.forEach(exp => {
      const amount = Number(exp.amount) || 0;

      // 1. Identify Payer (Canonical)
      const rawPayer = exp.payer || {};
      const payerStd = standardizeIdentity(rawPayer);

      // Safety: Init if missing (shouldn't happen with correct potentialPayers)
      if (payerStd && !statsMap[payerStd.id]) {
        statsMap[payerStd.id] = { id: payerStd.id, name: payerStd.name, paid: 0, owed: 0 };
      }

      if (payerStd) {
        statsMap[payerStd.id].paid += amount;
      }

      // 2. Identify Participants (Canonical)
      // Use explicit participants list if available, else default to ALL (legacy)
      let activeParticipants = [];
      if (exp.participants && exp.participants.length > 0) {
        activeParticipants = exp.participants
          .map(p => standardizeIdentity(p))
          .filter(p => p !== null);
      } else {
        activeParticipants = potentialPayers; // Legacy: Split among everyone
      }

      // Deduplicate participants (Safety)
      const uniqueParticipantsMap = new Map();
      activeParticipants.forEach(p => uniqueParticipantsMap.set(p.id, p));
      const finalParticipants = Array.from(uniqueParticipantsMap.values());

      if (finalParticipants.length > 0) {
        const share = amount / finalParticipants.length;
        finalParticipants.forEach(p => {
          if (!statsMap[p.id]) {
            statsMap[p.id] = { id: p.id, name: p.name, paid: 0, owed: 0 };
          }
          statsMap[p.id].owed += share;
        });
      }
    });

    // Step B: Calculate Net Balance
    const netBalances = [];
    Object.values(statsMap).forEach(stat => {
      const net = stat.paid - stat.owed;

      // Filter negligible balances
      if (Math.abs(net) > 1) {
        netBalances.push({
          id: stat.id,
          name: stat.name,
          amount: Math.round(net),
          isPositive: net > 0
        });
      }
    });

    // Sort: Positive (Gets Back) first
    netBalances.sort((a, b) => b.amount - a.amount);

    if (netBalances.length === 0) return { status: 'all_settled' };
    return { status: 'net_balances', data: netBalances };
  };

  const settlementResult = calculateSettlements();

  const handleToggleParticipant = (id) => {
    setSelectedParticipants(prev => {
      if (prev.includes(id)) {
        return prev.filter(pId => pId !== id);
      } else {
        return [...prev, id];
      }
    });
  };


  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    if (selectedParticipants.length === 0) {
      alert("Please select at least one person to split with.");
      return;
    }

    setLoading(true);

    try {
      const payerObj = potentialPayers.find(p => p.id === (processedPayer === 'me' ? user.id : processedPayer));

      // Construct Participants Array based on selection
      const participantsPayload = potentialPayers
        .filter(p => selectedParticipants.includes(p.id))
        .map(p => ({ userId: p.id, name: p.name }));

      const payload = {
        description: desc,
        amount: Number(amount),
        category,
        payer: {
          userId: payerObj?.id || user.id,
          name: payerObj?.name || user.fullName || 'User'
        },
        participants: participantsPayload,
        splitType
      };

      const res = await fetch(`/api/trips/${trip._id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        // MERGE FIX: Only update expenses/totals to preserve enriched names
        setTrip(prev => ({
          ...prev,
          expenses: data.data.expenses,
          total_actual_cost: data.data.total_actual_cost,
          total_estimated_cost: data.data.total_estimated_cost
        }));

        // Reset
        setDesc("");
        setAmount("");
        setCategory("Food");
        setSelectedParticipants(potentialPayers.map(p => p.id)); // Reset to all
      }
    } catch (err) {
      alert("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!canManage) return;
    if (!confirm("Delete this expense?")) return;

    setDeleting(expenseId);
    try {
      const res = await fetch(`/api/trips/${trip._id}/expenses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenseId })
      });

      const data = await res.json();
      if (data.success) {
        // MERGE FIX: Only update expenses/totals to preserve enriched names
        setTrip(prev => ({
          ...prev,
          expenses: data.data.expenses,
          total_actual_cost: data.data.total_actual_cost,
          total_estimated_cost: data.data.total_estimated_cost
        }));
      }
    } catch (err) {
      alert("Failed to delete expense");
    } finally {
      setDeleting(null);
    }
  };

  // Helper to filter expenses for display
  // UPDATED: Show ALL expenses (including personal ones) so everyone has a complete record.
  const getVisibleExpenses = () => {
    if (!trip.expenses) return [];
    return trip.expenses.slice().reverse();
  };

  const visibleExpenses = getVisibleExpenses();

  return (
    <div className="space-y-8">

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Budget */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-lg shadow-slate-200/50 border border-slate-100 border-l-4 border-l-indigo-500 relative overflow-hidden group">
          <div className="absolute right-4 top-4 p-2 bg-indigo-50 rounded-xl group-hover:scale-110 transition-transform">
            <Wallet className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Budget</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">₹{budget.toLocaleString()}</p>
        </div>

        {/* Total Spent */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-lg shadow-slate-200/50 border border-slate-100 border-l-4 border-l-purple-500 relative overflow-hidden group">
          <div className="absolute right-4 top-4 p-2 bg-purple-50 rounded-xl group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Spent</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">₹{totalSpent.toLocaleString()}</p>

          {/* Progress Bar */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((totalSpent / budget) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {Math.round((totalSpent / budget) * 100)}%
            </span>
          </div>
        </div>

        {/* Remaining */}
        <div className={`bg-white p-6 rounded-[1.5rem] shadow-lg shadow-slate-200/50 border border-slate-100 border-l-4 relative overflow-hidden group ${isOverBudget ? 'border-l-rose-500' : 'border-l-emerald-500'}`}>
          <div className={`absolute right-4 top-4 p-2 rounded-xl group-hover:scale-110 transition-transform ${isOverBudget ? 'bg-rose-50' : 'bg-emerald-50'}`}>
            <AlertCircle className={`w-5 h-5 ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Remaining</p>
          <p className={`text-3xl font-black tracking-tight ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
            {isOverBudget ? '-' : ''}₹{Math.abs(remaining).toLocaleString()}
          </p>
          {isOverBudget && (
            <p className="text-[10px] font-bold text-rose-500 mt-2 flex items-center gap-1">
              ⚠️ Over Budget
            </p>
          )}
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN (Charts & History) - Spans 7 cols */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-8">

          {/* SPENDING BREAKDOWN CHART */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Wallet className="w-5 h-5" /></div>
              Spending Breakdown
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="h-64 w-64 relative shrink-0">
                {chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={6}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `₹${value.toLocaleString()}`}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                      <span className="text-xl font-black text-slate-900">₹{totalSpent.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full rounded-full border-2 border-dashed border-slate-100 flex items-center justify-center flex-col text-slate-400">
                    <Wallet className="w-10 h-10 mb-2 text-slate-200" />
                    <span className="text-xs font-bold">No Data</span>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                {chartData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-xs font-bold text-slate-700">{entry.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {Math.round((entry.value / totalSpent) * 100)}%
                    </span>
                  </div>
                ))}
                {chartData.length === 0 && (
                  <p className="text-sm text-slate-400 col-span-2 text-center py-6 border border-dashed border-slate-200 rounded-xl">
                    Add expenses to see a breakdown.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RECENT EXPENSES LIST */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp className="w-5 h-5" /></div>
                Recent Expenses
              </h3>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {visibleExpenses.length > 0 ? visibleExpenses.map((expense, i) => (
                <div key={expense._id || i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm">
                      {CATEGORY_ICONS[expense.category] || '💰'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        {expense.description}
                        {/* Label: Personal vs Shared */}
                        {expense.participants && expense.participants.length === 1 ? (
                          <span className="text-[9px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded border border-indigo-100">Personal</span>
                        ) : (
                          <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">Shared</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        {(expense.payer?.userId || expense.payer?.name) && (
                          <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                            by {(() => {
                              const rawPayer = expense.payer || {};
                              const match = standardizeIdentity(rawPayer);
                              return (match && match.isMe) ? 'Me' : (match ? match.name.split(' ')[0] : (rawPayer.name || 'Unknown'));
                            })()}
                          </span>
                        )}
                        {/* Show count of participants if not everyone */}
                        {expense.participants && expense.participants.length > 0 && expense.participants.length < potentialPayers.length && (
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">
                            {expense.participants.length} 👤
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900">₹{expense.amount.toLocaleString()}</span>
                    {canManage && (
                      <button
                        onClick={() => handleDeleteExpense(expense._id)}
                        disabled={deleting === expense._id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      >
                        {deleting === expense._id ? "..." : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Wallet className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold text-sm">No expenses yet.</p>
                  <p className="text-slate-300 text-xs">Start tracking your spending!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Add Form & Splits) - Spans 5 cols */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-8">

          {/* ADD TRANSACTION CARD */}
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><PlusCircle className="w-5 h-5" /></div>
              Add Expense
            </h3>

            {canManage ? (
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <input
                    type="text" required placeholder="Dinner, Taxi, etc."
                    className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                    value={desc} onChange={(e) => setDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-3 text-slate-400 font-black">₹</span>
                      <input
                        type="number" required placeholder="0"
                        className="w-full pl-8 p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                        value={amount} onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Type</label>
                    <div className="relative mt-1">
                      <select
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                        value={category} onChange={(e) => setCategory(e.target.value)}
                      >
                        {Object.keys(CATEGORY_ICONS).map(k => <option key={k} value={k}>{CATEGORY_ICONS[k]} {k}</option>)}
                      </select>
                      <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-xs">▼</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Paid By</label>
                  <div className="relative mt-1">
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                      value={processedPayer} onChange={(e) => setProcessedPayer(e.target.value)}
                    >
                      <option value="me">Me ({user?.firstName})</option>
                      {potentialPayers.filter(p => p.id !== user?.id).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-xs">▼</div>
                  </div>
                </div>

                {/* Participant Selection */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Split With</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleSelectAll} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600">All</button>
                      <button type="button" onClick={handleDeselectAll} className="text-[10px] font-bold text-slate-400 hover:text-slate-500">None</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 max-h-32 overflow-y-auto">
                    {potentialPayers.map(p => (
                      <div key={p.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${selectedParticipants.includes(p.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:bg-slate-100'}`}
                        onClick={() => handleToggleParticipant(p.id)}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${selectedParticipants.includes(p.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                          {selectedParticipants.includes(p.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className={`text-xs font-bold truncate ${selectedParticipants.includes(p.id) ? 'text-indigo-700' : 'text-slate-600'}`}>
                          {p.id === user?.id ? "Me" : p.name.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSplitType(splitType === 'equal' ? 'custom' : 'equal')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${splitType === 'equal' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}
                  >
                    Equal Split
                  </button>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-slate-200 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  Add Transaction
                </button>

              </form>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-bold">Only owners can add expenses.</p>
              </div>
            )}
          </div>

          {/* SPLIT SUMMARY */}
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Wallet className="w-5 h-5" /></div>
                Split Summary
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50 px-2 py-1 rounded">Net Balances</span>
            </div>

            {settlementResult.status === 'no_expenses' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-900 font-bold text-sm">No expenses yet.</p>
                <p className="text-slate-400 text-xs mt-1">Add your first expense.</p>
              </div>
            )}

            {settlementResult.status === 'all_settled' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-green-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <span className="text-2xl">🤝</span>
                </div>
                <p className="text-slate-900 font-bold text-sm">All settled up!</p>
                <p className="text-slate-400 text-xs mt-1">Everyone has paid their share.</p>
              </div>
            )}

            {settlementResult.status === 'net_balances' && (
              <div className="space-y-3">
                {settlementResult.data.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${item.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {item.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 leading-tight">{item.name}</span>
                        <span className={`text-[10px] lowercase font-bold ${item.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {item.isPositive ? 'gets back' : 'owes'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className={`font-black ${item.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.isPositive ? '+' : '-'}₹{Math.abs(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
