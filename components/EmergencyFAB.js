'use client';
import { Phone, AlertTriangle, Cross } from 'lucide-react';
import { useState, useEffect } from 'react';

import { getEmergencyNumbers } from '../constants/emergencyData';

export default function EmergencyFAB({ destination, isOpenProp, onClose, onShareLocation }) {
    const [isOpen, setIsOpen] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [shareStatus, setShareStatus] = useState(null);
    const [currentNumbers, setCurrentNumbers] = useState(getEmergencyNumbers("Global"));
    const [locationName, setLocationName] = useState("Global");

    const show = isOpenProp !== undefined ? isOpenProp : isOpen;
    const setShow = onClose || setIsOpen;

    // Resolve numbers based on Destination Prop
    useEffect(() => {
        if (destination) {
            const data = getEmergencyNumbers(destination);
            setCurrentNumbers(data);
            setLocationName(data.country);
        }
    }, [destination]);

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
        { name: "Police", number: currentNumbers.police, icon: "👮" },
        { name: "Ambulance", number: currentNumbers.ambulance, icon: "🚑" },
        { name: "Fire", number: currentNumbers.fire, icon: "🚒" },
    ];

    return (
        <div
            className="fixed bottom-4 right-4 z-[9999]"
            onMouseEnter={() => {
                // Check if device supports hover (desktop/laptop)
                if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
                    setShow(true);
                }
            }}
            onMouseLeave={() => {
                if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
                    setShow(false);
                }
            }}
        >
            {/* FAB Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShow(!show);
                }}
                className="w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl shadow-red-500/30 hover:shadow-red-600/50 hover:bg-red-700 transition-all duration-300 flex items-center justify-center active:scale-95 border-4 border-white/20 tap-highlight-transparent relative z-50 cursor-pointer"
                aria-label="Emergency Menu"
            >
                {show ? <Cross className="w-6 h-6 rotate-45" /> : <Phone className="w-6 h-6 animate-pulse" />}
            </button>

            {/* Floating Panel (Desktop Hover / Mobile Click) */}
            <div
                className={`absolute bottom-16 right-0 z-40 flex flex-col gap-3 items-end transition-all duration-300 origin-bottom-right
                ${show ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-90 translate-y-4 invisible pointer-events-none'}`}
                style={{ paddingBottom: '1rem' }} // Bridge gap for hover
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >

                {/* SOS Beacon Option */}
                <button
                    onClick={handleSOS}
                    disabled={sharing}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border w-max transition-all cursor-pointer
                        ${shareStatus === 'success' ? 'bg-emerald-500 text-white border-emerald-500' :
                            'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'}`}
                >
                    <span className="text-sm font-bold">
                        {sharing ? "Sharing Location..." : shareStatus === 'success' ? "Location Shared!" : "I'm Here / SOS"}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${shareStatus === 'success' ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
                        {sharing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                </button>

                {/* Emergency Contacts Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2 w-[220px] overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Emergency Call</span>
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{locationName}</span>
                    </div>
                    {contacts.map((contact, i) => (
                        <a
                            key={i}
                            href={`tel:${contact.number}`}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group active:bg-slate-100 cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg bg-slate-100 w-8 h-8 flex items-center justify-center rounded-lg group-hover:bg-red-50 group-hover:text-red-600 transition-colors">{contact.icon}</span>
                                <div>
                                    <span className="text-sm font-bold text-slate-700 block leading-tight group-hover:text-red-700 transition-colors">{contact.name}</span>
                                    <span className="text-[10px] font-mono text-slate-400">{contact.number}</span>
                                </div>
                            </div>
                            <Phone className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                        </a>
                    ))}
                </div>
            </div>

            {/* Backdrop (Mobile Only - Click outside behavior) */}
            {show && (
                <div
                    className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] lg:hidden"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShow(false);
                    }}
                ></div>
            )}
        </div>
    );
}
