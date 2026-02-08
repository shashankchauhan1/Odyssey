'use client';

import React, { useState, createContext, useContext } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const AccordionContext = createContext({});

export function Accordion({ children, defaultOpen = '', className = '' }) {
    const [openItem, setOpenItem] = useState(defaultOpen);

    const toggle = (value) => {
        setOpenItem((prev) => (prev === value ? '' : value));
    };

    return (
        <AccordionContext.Provider value={{ openItem, toggle }}>
            <div className={`space-y-4 ${className}`}>
                {children}
            </div>
        </AccordionContext.Provider>
    );
}

export function AccordionItem({ value, title, icon, children, className = '' }) {
    const { openItem, toggle } = useContext(AccordionContext);
    const isOpen = openItem === value;

    return (
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 ${isOpen ? 'ring-2 ring-indigo-50 shadow-md' : 'hover:shadow-md'} ${className}`}>
            <button
                onClick={() => toggle(value)}
                className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    {icon && <span className="text-xl p-2 bg-slate-50 rounded-lg">{icon}</span>}
                    <span className={`font-bold text-slate-900 text-lg ${isOpen ? 'text-indigo-700' : ''}`}>{title}</span>
                </div>
                <div className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'bg-indigo-50 rotate-180 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                    <ChevronDown className="w-5 h-5" />
                </div>
            </button>

            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden`}
            >
                <div className="p-5 pt-0 border-t border-slate-50">
                    {children}
                </div>
            </div>
        </div>
    );
}
