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

  // Permissions: Allow if passed role is owner/editor OR if real user checks pass
  const isViewer = role === 'viewer';
  const canManage = !isViewer;

  // Potential Payers: Owner + Collaborators
  const potentialPayers = [
    { id: trip.userId, name: trip.owner_display_name || 'Owner' },
    ...(trip.collaborators || []).map(c => ({ id: c.userId, name: c.display_name || c.email || 'Partner' }))
  ];

  // ... (existing chart calculations) ...

  // Calculate Data for Charts
  const totalSpent = trip.total_actual_cost || 0;
  const budget = trip.budget_limit || 10000; // Default budget if 0
  const remaining = budget - totalSpent;
  const isOverBudget = remaining < 0;

  // Group expenses by category for the Pie Chart
  const chartData = trip.expenses.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, []);

  // Split Logic
  const calculateSettlements = () => {
    if (!trip.expenses || trip.expenses.length === 0) return { status: 'no_expenses' };

    const balances = {};
    potentialPayers.forEach(p => balances[p.id] = 0);

    trip.expenses.forEach(exp => {
      const pid = exp.payer?.userId;
      const amount = exp.amount;
      // Payer paid (+)
      if (pid) balances[pid] = (balances[pid] || 0) + amount;

      // Participants owe (-)
      const participants = exp.participants && exp.participants.length > 0 ? exp.participants : potentialPayers.map(p => ({ userId: p.id })); // Default to all if empty?
      const count = participants.length;
      if (count > 0) {
        const share = amount / count;
        participants.forEach(p => {
          balances[p.userId] = (balances[p.userId] || 0) - share;
        });
      }
    });

    const debtors = [];
    const creditors = [];
    Object.entries(balances).forEach(([id, amt]) => {
      if (amt < -0.1) debtors.push({ id, amt });
      else if (amt > 0.1) creditors.push({ id, amt });
    });

    // If no significant debts
    // Only return 'all_settled' if we actually processed expenses but everyone is square.
    // If balances are empty, it's 'no_expenses' (handled above)
    if (debtors.length === 0 && creditors.length === 0) return { status: 'all_settled' };

    debtors.sort((a, b) => a.amt - b.amt);
    creditors.sort((a, b) => b.amt - a.amt);

    const settlements = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const deb = debtors[i];
      const cred = creditors[j];
      const val = Math.min(Math.abs(deb.amt), cred.amt);

      // Find names
      const dName = potentialPayers.find(p => p.id === deb.id)?.name || 'Unknown';
      const cName = potentialPayers.find(p => p.id === cred.id)?.name || 'Unknown';

      if (val > 0) {
        settlements.push({ from: dName, to: cName, val: Math.round(val) });
      }

      deb.amt += val;
      cred.amt -= val;
      if (Math.abs(deb.amt) < 0.1) i++;
      if (cred.amt < 0.1) j++;
    }

    return { status: 'settlements', data: settlements };
  };

  const settlementResult = calculateSettlements();

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    setLoading(true);

    try {
      const payerObj = potentialPayers.find(p => p.id === (processedPayer === 'me' ? user.id : processedPayer));

      const payload = {
        description: desc,
        amount: Number(amount),
        category,
        payer: {
          userId: payerObj?.id || user.id,
          name: payerObj?.name || user.fullName || 'User'
        },
        participants: potentialPayers.map(p => ({ userId: p.id, name: p.name })), // Split with everyone for now
        splitType
      };

      const res = await fetch(`/api/trips/${trip._id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setTrip(data.data); // Update the parent state instantly
        // Reset
        setDesc("");
        setAmount("");
        setCategory("Food");
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
        setTrip(data.data); // Update the parent state instantly
      }
    } catch (err) {
      alert("Failed to delete expense");
    } finally {
      setDeleting(null);
    }
  };

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
              {trip.expenses?.length > 0 ? trip.expenses.slice().reverse().map((expense, i) => (
                <div key={expense._id || i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm">
                      {CATEGORY_ICONS[expense.category] || '💰'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{expense.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        {expense.payer?.name && (
                          <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                            by {expense.payer.name.split(' ')[0]}
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
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
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

            {settlementResult.status === 'settlements' && (
              <div className="space-y-3">
                {settlementResult.data.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {s.from.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 leading-tight">{s.from}</span>
                        <span className="text-slate-400 text-[10px] lowercase">owes</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-black text-slate-900">₹{s.val}</span>
                      <span className="text-[10px] text-slate-400">to {s.to}</span>
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
