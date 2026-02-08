'use client';
import { useState } from 'react';
import { X, Globe, Ruler, Coins, Check } from 'lucide-react';

export default function TripSettingsModal({ trip, onClose, onUpdate }) {
    const [currency, setCurrency] = useState(trip?.preferences?.currency || 'INR');
    const [units, setUnits] = useState(trip?.preferences?.units || 'metric');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/trips/${trip._id}/preferences`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currency, units })
            });
            const data = await res.json();
            if (data.success) {
                onUpdate(data.data); // Update parent trip state
                onClose();
            }
        } catch (err) {
            alert('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 relative" onClick={e => e.stopPropagation()}>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-indigo-500" /> Trip Settings
                    </h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Currency Selection */}
                    <div>
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 block">Currency</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['INR', 'USD', 'EUR', 'GBP', 'JPY'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCurrency(c)}
                                    className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${currency === c ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Units Selection */}
                    <div>
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 block">Distance Units</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setUnits('metric')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 transition-all ${units === 'metric' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                            >
                                <Ruler className="w-4 h-4" /> Metric (km)
                            </button>
                            <button
                                onClick={() => setUnits('imperial')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 transition-all ${units === 'imperial' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                            >
                                <Ruler className="w-4 h-4" /> Imperial (mi)
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full mt-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {loading ? 'Saving...' : 'Save Preferences'}
                </button>

            </div>
        </div>
    );
}
