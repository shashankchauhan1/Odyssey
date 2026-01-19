"use client";
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PlusCircle, Wallet, TrendingUp, AlertCircle, Trash2, X } from 'lucide-react';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];

const CATEGORY_ICONS = {
  'Food': '🍔',
  'Travel': '🚕',
  'Stay': '🏨',
  'Activities': '🎟️',
  'Shopping': '🛍️',
  'Misc': '✨'
};

export default function ExpenseDashboard({ trip, setTrip }) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Food' });
  const conversionRate = 0.8; // 1 local unit = 0.8 home unit (mock)

  const convertAmount = (amount) => {
    const num = Number(amount);
    if (Number.isNaN(num)) return null;
    return Math.round(num * conversionRate);
  };

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

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/trips/${trip._id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });

      const data = await res.json();
      if (data.success) {
        setTrip(data.data); // Update the parent state instantly
        setNewExpense({ description: '', amount: '', category: 'Food' }); // Reset form
      }
    } catch (err) {
      alert("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
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
    <div className="space-y-6">
      
      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 sm:p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-indigo-100 text-xs sm:text-sm font-semibold uppercase tracking-wide">Total Budget</p>
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-200" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold">₹{budget.toLocaleString()}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 sm:p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-100 text-xs sm:text-sm font-semibold uppercase tracking-wide">Total Spent</p>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-200" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold">₹{totalSpent.toLocaleString()}</p>
          <div className="mt-2 w-full bg-purple-700/30 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${Math.min((totalSpent / budget) * 100, 100)}%` }}
            />
          </div>
        </div>
        
        <div className={`bg-gradient-to-br p-4 sm:p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-200 ${isOverBudget ? 'from-red-500 to-red-600' : 'from-emerald-500 to-emerald-600'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs sm:text-sm font-semibold uppercase tracking-wide ${isOverBudget ? 'text-red-100' : 'text-emerald-100'}`}>
              {isOverBudget ? 'Over Budget!' : 'Remaining'}
            </p>
            <AlertCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${isOverBudget ? 'text-red-200' : 'text-emerald-200'}`} />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold">
            {isOverBudget && '-'}₹{Math.abs(remaining).toLocaleString()}
          </p>
          {isOverBudget && (
            <p className="text-[10px] sm:text-xs text-red-100 mt-2">Consider adjusting your spending</p>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
        {/* LEFT: Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 text-gray-800">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-sm sm:text-base lg:text-xl">Spending Breakdown</span>
          </h3>

          {/* Pie Chart */}
          <div className="h-64 sm:h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Wallet className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-sm font-medium">No expenses tracked yet</p>
                <p className="text-xs text-gray-400 mt-1">Start adding expenses to see insights</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Add Expense Form & Recent List */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 text-gray-800">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shrink-0">
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-sm sm:text-base lg:text-xl">Add New Expense</span>
          </h3>

          <form onSubmit={handleAddExpense} className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Dinner at Cafe"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
                <input 
                  type="number" 
                  required
                  placeholder="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white transition-all text-gray-800"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                >
                  <option value="Food">🍔 Food</option>
                  <option value="Travel">🚕 Travel</option>
                  <option value="Stay">🏨 Stay</option>
                  <option value="Activities">🎟️ Activities</option>
                  <option value="Shopping">🛍️ Shopping</option>
                  <option value="Misc">✨ Misc</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  Add Expense
                </span>
              )}
            </button>
          </form>

          <div className="border-t pt-6">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Recent Transactions
            </h4>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {trip.expenses?.slice().reverse().map((expense, i) => (
                <div 
                  key={expense._id || i} 
                  className="group flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all border border-gray-200 hover:border-gray-300"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
                      {CATEGORY_ICONS[expense.category] || '💰'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{expense.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-white rounded-full font-medium text-gray-600 border border-gray-200">
                          {expense.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(expense.date).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 text-lg">
                      -₹{expense.amount.toLocaleString()}
                      {convertAmount(expense.amount) !== null && (
                        <span className="ml-2 text-xs text-gray-500">
                          (≈ ₹{convertAmount(expense.amount).toLocaleString()} home)
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(expense._id)}
                      disabled={deleting === expense._id}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title="Delete expense"
                    >
                      {deleting === expense._id ? (
                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {trip.expenses?.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <PlusCircle className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No expenses yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add your first expense above</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
