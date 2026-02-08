'use client';
import { Phone, AlertTriangle, Cross } from 'lucide-react';
import { useState } from 'react';

export default function EmergencyFAB({ number = "112", isOpenProp, onClose, onShareLocation }) {
    const [isOpen, setIsOpen] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [shareStatus, setShareStatus] = useState(null); // 'success' | 'error' | null

    const show = isOpenProp !== undefined ? isOpenProp : isOpen;
    const setShow = onClose || setIsOpen;

    const handleSOS = () => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported");
            return;
        }

        setSharing(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                if (onShareLocation) {
                    onShareLocation(latitude, longitude);
                    setShareStatus('success');
                    setTimeout(() => {
                        setSharing(false);
                        setShareStatus(null);
                        setShow(false);
                    }, 1500);
                }
            },
            (error) => {
                console.error(error);
                alert("Location permission required");
                setSharing(false);
            }
        );
    };

    const contacts = [
        { name: "Police", number: "100", icon: "👮" },
        { name: "Ambulance", number: "108", icon: "🚑" },
        { name: "Fire", number: "101", icon: "🚒" },
    ];

    return (
        <>
            {/* FAB Button - SAFE POSITION (Above Footer) */}
            <button
                onClick={() => setShow(!show)}
                className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-red-600 text-white rounded-full shadow-xl shadow-red-200 hover:shadow-2xl hover:bg-red-700 transition-all duration-300 flex items-center justify-center active:scale-95 border-4 border-white/20"
                aria-label="Emergency Menu"
            >
                {show ? <Cross className="w-6 h-6 rotate-45" /> : <Phone className="w-6 h-6 animate-pulse" />}
            </button>

            {/* Menu */}
            {show && (
                <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-200 items-end">

                    {/* SOS Beacon Option */}
                    <button
                        onClick={handleSOS}
                        disabled={sharing}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border transition-all w-max
                            ${shareStatus === 'success' ? 'bg-emerald-500 text-white border-emerald-500' :
                                'bg-white text-slate-800 border-slate-100 hover:bg-slate-50'}`}
                    >
                        <span className="text-sm font-bold">
                            {sharing ? "Sharing Location..." : shareStatus === 'success' ? "Location Shared!" : "I'm Here / SOS"}
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${shareStatus === 'success' ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
                            {sharing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <AlertTriangle className="w-4 h-4" />}
                        </div>
                    </button>

                    {/* Emergency Contacts */}
                    {contacts.map((contact, i) => (
                        <a
                            key={i}
                            href={`tel:${contact.number}`}
                            className="flex items-center gap-3 px-4 py-3 bg-white text-slate-800 rounded-2xl shadow-lg border border-slate-100 hover:bg-slate-50 transition w-full justify-end group active:scale-95"
                        >
                            <span className="text-sm font-bold group-hover:text-red-600 transition-colors">{contact.name}</span>
                            <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{contact.number}</span>
                            <span className="text-lg">{contact.icon}</span>
                        </a>
                    ))}
                </div>
            )}

            {/* Backdrop */}
            {show && (
                <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={() => setShow(false)}></div>
            )}
        </>
    );
}
