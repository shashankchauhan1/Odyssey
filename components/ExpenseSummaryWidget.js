'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ExpenseSummaryWidget({ trip }) {
    const router = useRouter();

    if (!trip) return null;

    const budget = trip.budget_limit || 0;
    const spent = trip.total_actual_cost || 0;
    const remaining = budget - spent;
    const isOverBudget = remaining < 0;

    return (
        <section className="pt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">💰 Budget Overview</h2>
                <Link
                    href={`/trip/${trip._id}/expenses`}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                    Manage Expenses →
                </Link>
            </div>

            <div
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                onClick={() => router.push(`/trip/${trip._id}/expenses`)}
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                    {/* Stats */}
                    <div className="sm:col-span-2 grid grid-cols-3 gap-4 divide-x divide-slate-100">
                        <div className="px-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Budget</p>
                            <p className="text-xl font-extrabold text-slate-900">₹{budget.toLocaleString()}</p>
                        </div>
                        <div className="px-2 pl-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Spent</p>
                            <p className="text-xl font-extrabold text-indigo-600">₹{spent.toLocaleString()}</p>
                        </div>
                        <div className="px-2 pl-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Remaining</p>
                            <p className={`text-xl font-extrabold ${isOverBudget ? 'text-rose-500' : 'text-emerald-600'}`}>
                                ₹{Math.abs(remaining).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <span className="text-xl">➔</span>
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min((spent / (budget || 1)) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>
        </section>
    );
}
