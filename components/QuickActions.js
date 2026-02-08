"use client";

import { useState } from 'react';
import { Wallet, Map, UserPlus, Share2, Download, CheckCircle } from 'lucide-react';

export default function QuickActions({ onAddExpense, onAddItinerary, onInvite, onShare, onSaveOffline, role = 'owner' }) {
    const isViewer = role === 'viewer';
    const isEditor = role === 'editor';
    const canEdit = !isViewer;
    const canInvite = role === 'owner';
    const [isOpen, setIsOpen] = useState(false);

    // Desktop: Horizontal Bar
    // Mobile: Floating Action Button (FAB) or Bottom Bar?
    // Let's go with a sleek consistent bar for now, maybe sticky at bottom on mobile, inline on desktop.

    return (
        <>
            {/* Mobile Floating Button (if we wanted a menu, but user asked for a bar) 
          Let's make a sticky bottom bar for mobile and a relative bar for desktop.
      */}

            <div className="w-full sm:hidden mb-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 grid grid-cols-5 gap-2">
                    <button
                        onClick={onAddExpense}
                        disabled={!canEdit}
                        className="flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform disabled:opacity-30 disabled:pointer-events-none rounded-xl hover:bg-slate-50"
                    >
                        <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl"><Wallet className="w-5 h-5" /></div>
                        <span className="text-[10px] font-bold text-slate-600">Expense</span>
                    </button>
                    <button
                        onClick={onAddItinerary}
                        disabled={!canEdit}
                        className="flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform disabled:opacity-30 disabled:pointer-events-none rounded-xl hover:bg-slate-50"
                    >
                        <div className="bg-purple-50 text-purple-600 p-2 rounded-xl"><Map className="w-5 h-5" /></div>
                        <span className="text-[10px] font-bold text-slate-600">Plan</span>
                    </button>
                    <button
                        onClick={onInvite}
                        disabled={!canInvite}
                        className="flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform disabled:opacity-30 disabled:pointer-events-none rounded-xl hover:bg-slate-50"
                    >
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-xl"><UserPlus className="w-5 h-5" /></div>
                        <span className="text-[10px] font-bold text-slate-600">Invite</span>
                    </button>
                    <button onClick={onShare} className="flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform rounded-xl hover:bg-slate-50">
                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl"><Share2 className="w-5 h-5" /></div>
                        <span className="text-[10px] font-bold text-slate-600">Share</span>
                    </button>
                    <button onClick={onSaveOffline} className="flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform rounded-xl hover:bg-slate-50">
                        <div className="bg-slate-100 text-slate-600 p-2 rounded-xl"><Download className="w-5 h-5" /></div>
                        <span className="text-[10px] font-bold text-slate-600">Save</span>
                    </button>
                </div>
            </div>

            {/* Desktop Inline Actions (Usually placed in Hero or Sidebar) */}
            <div className="hidden sm:flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit">
                <button
                    onClick={onAddExpense}
                    disabled={!canEdit}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-sm transition-all border border-slate-200 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Wallet className="w-4 h-4" /> Add Expense
                </button>
                <button
                    onClick={onAddItinerary}
                    disabled={!canEdit}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-sm transition-all border border-slate-200 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Map className="w-4 h-4" /> Add Plan
                </button>
                <button
                    onClick={onInvite}
                    disabled={!canInvite}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-sm transition-all border border-slate-200 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <UserPlus className="w-4 h-4" /> Invite
                </button>
                <button
                    onClick={onShare}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-sm transition-all border border-slate-200 hover:border-slate-300"
                >
                    <Share2 className="w-4 h-4" /> Share
                </button>
                <button
                    onClick={onSaveOffline}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-sm transition-all border border-slate-200 hover:border-slate-300"
                >
                    <Download className="w-4 h-4" /> Save
                </button>
            </div>
        </>
    );
}
