'use client';
import { Lightbulb, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

export default function SmartTipsWidget({ tips }) {
    const [isVisible, setIsVisible] = useState(true);

    if (!tips || tips.length === 0 || !isVisible) return null;

    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border border-orange-100 shadow-lg shadow-orange-100/50 p-6 mb-8 group">
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 p-1.5 bg-white/50 hover:bg-white rounded-full text-orange-300 hover:text-orange-500 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Background Decor */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-200/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-start gap-4 relative">
                <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl shadow-lg shadow-orange-200 text-white shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-6 h-6" />
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
                        Smart Travel Tips
                        <span className="px-2 py-0.5 bg-white/60 border border-orange-100 rounded-full text-[10px] uppercase font-bold text-orange-600 tracking-wider">AI Powered</span>
                    </h3>
                    <p className="text-sm font-medium text-slate-600 mb-4">Curated advice for a smoother trip.</p>

                    <div className="space-y-3">
                        {tips.map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-3 bg-white/60 p-3 rounded-xl border border-orange-100/50 hover:bg-white transition-colors">
                                <div className="mt-0.5 text-orange-500">
                                    <Lightbulb className="w-4 h-4 fill-orange-500/20" />
                                </div>
                                <p className="text-sm font-bold text-slate-700 leading-snug">{tip}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
