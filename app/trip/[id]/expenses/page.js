'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ExpenseDashboard from '@/components/ExpenseDashboard';
import { ArrowLeft } from 'lucide-react';

export default function ExpensesPage() {
    const { id } = useParams();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTrip = useCallback(async () => {
        if (!id) return;
        try {
            const res = await fetch(`/api/trips/${id}`);
            const json = await res.json();
            if (json.success) setTrip(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTrip();
        // Heartbeat for consistency with main page
        const intervalId = setInterval(fetchTrip, 3000);
        return () => clearInterval(intervalId);
    }, [fetchTrip]);

    // MOCK ROLE: Change this to 'editor' or 'viewer' to test permissions
    const [userRole, setUserRole] = useState('owner');

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!trip) return <div className="p-10 text-center">Trip not found.</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href={`/trip/${id}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 mb-4 transition">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Trip
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900">Budget & Expenses</h1>
                            <p className="text-slate-500 mt-1">Manage finances for <span className="font-bold text-slate-700">{trip.destination.name}</span></p>
                        </div>
                    </div>
                </div>

                {/* Dashboard */}
                <ExpenseDashboard trip={trip} setTrip={setTrip} role={userRole} />
            </div>
        </div>
    );
}
