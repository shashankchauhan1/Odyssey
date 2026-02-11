'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Phone, MapPin, Calendar, Globe, AlertTriangle, ShieldAlert,
  ChevronRight, Share2, Users, Info, Clock, Utensils,
  Landmark, BadgeCheck, Lightbulb, Wifi, Wallet, Compass, Plus, Plane, Download, Loader2, ArrowUp
} from 'lucide-react';

import WeatherWidget from '@/components/WeatherWidget';
import BookingCard from '@/components/BookingCard';
import DownloadPdfBtn from '@/components/DownloadPdfBtn';
import EventsList from '@/components/EventsList';
import ExpenseSummaryWidget from '@/components/ExpenseSummaryWidget';
import ShareTripModal from '@/components/ShareTripModal';
import SafetyWidget from '@/components/SafetyWidget';
import VideoGallery from '@/components/VideoGallery';
import LocalDiscovery from '@/components/LocalDiscovery';
import TravelAssistance from '@/components/TravelAssistance';
import EmergencyFAB from '@/components/EmergencyFAB';
import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import TransportTabs from '@/components/TransportTabs';
import QuickActions from '@/components/QuickActions';
import SmartTipsWidget from '@/components/SmartTipsWidget';
import TripSettingsModal from '@/components/TripSettingsModal';
import ItineraryTimeline from '@/components/ItineraryTimeline';
import { Settings } from 'lucide-react';

// Load the map ONLY on the client side
const TripMap = dynamic(() => import('@/components/TripMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-100 rounded-3xl animate-pulse"></div>
});

export default function TripPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentAttempted, setEnrichmentAttempted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // MOCK ROLE: Change this to 'editor' or 'viewer' to test permissions
  const [userRole, setUserRole] = useState('owner');

  // --- state for ai -> the card for info ---
  const [showGenModal, setShowGenModal] = useState(false);
  const [showTriggerSOS, setShowTriggerSOS] = useState(false);
  const [genOptions, setGenOptions] = useState({
    days: 3,
    pace: 'Moderate',
    interests: []
  });

  const fetchTrip = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/trips/${id}`);
      if (!res.ok) throw new Error("Network response was not ok");
      const json = await res.json();
      if (json.success) {
        let tripData = json.data;

        // PERSISTENCE FIX: Recover local safetyBeacon if server misses it (Mock Backend scenario)
        try {
          const localData = localStorage.getItem(`trip_data_${id}`);
          if (localData) {
            const parsedLocal = JSON.parse(localData);
            // If we have a local beacon but server has none, keep local
            if (parsedLocal.safetyBeacons && (!tripData.safetyBeacons || tripData.safetyBeacons.length === 0)) {
              tripData.safetyBeacons = parsedLocal.safetyBeacons;
            }
          }
        } catch (e) {
          console.error("Error restoring local state", e);
        }

        setTrip(tripData);
        setIsOffline(false);
        // Optional: Auto-cache on successful load? 
        // localStorage.setItem(`offline_trip_${id}`, JSON.stringify(json.data));
      }
    } catch (err) {
      console.error("Fetch failed, trying offline cache:", err);
      const cached = localStorage.getItem(`offline_trip_${id}`);
      if (cached) {
        setTrip(JSON.parse(cached));
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrip();
    const intervalId = setInterval(fetchTrip, 3000);
    return () => clearInterval(intervalId);
  }, [fetchTrip]);

  // Handle ESC key for modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowGenModal(false);
        setShowShareModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scroll Listener for "Scroll To Top" button
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-enrichment logic
  useEffect(() => {
    if (!trip || enrichmentAttempted) return;
    const dest = trip?.destination || {};
    // Check if new fields are missing to trigger re-enrichment if needed
    // (In a real app, you might want a more robust check)
    const hasNewFields = dest.cultural_highlights && dest.cultural_highlights.length > 0;

    if (hasNewFields) {
      // If we already have dense data, don't enrich again immediately
      return;
    }

    const needsEnrichment = !dest?.currency || !dest?.language || !dest?.cultural_highlights;

    if (!needsEnrichment || !dest?._id) return;

    setEnrichmentAttempted(true);
    setEnriching(true);
    fetch(`/api/destinations/${dest._id}/enrich`, { method: 'POST' })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) {
          setLoading(true);
          return fetchTrip();
        }
      })
      .catch(console.error)
      .finally(() => setEnriching(false));
  }, [trip, enrichmentAttempted, fetchTrip]);

  const submitGeneration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowGenModal(false);

    console.log("🚀 Starting generation for Trip:", trip._id);

    try {
      const res = await fetch('/api/trips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip._id,
          days: genOptions.days,
          pace: genOptions.pace,
          interests: genOptions.interests
        })
      });

      const json = await res.json();

      if (json.success) {
        // Performance: Prevent duplicate state updates
        if (JSON.stringify(json.data) !== JSON.stringify(trip)) {
          console.log("✅ Generation Successful:", json.data);
          setTrip(json.data);
        } else {
          console.log("✅ Generation Successful (Data Unchanged)");
        }
      } else {
        // This will catch the 500 error details from your route.js
        console.error("❌ Server Error Details:", json.error);
        alert(`Generation Error: ${json.error}`);
      }
    } catch (err) {
      console.error("🌐 Network/Frontend Error:", err);
      alert("Failed to connect to the generation service.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOffline = () => {
    if (trip) {
      localStorage.setItem(`offline_trip_${id}`, JSON.stringify(trip));
      alert("Trip saved for offline use! 📥");
    }
  };

  const [sharingLocation, setSharingLocation] = useState(false);

  // Persistent SOS State (Multi-user)
  const handleShareLocation = async (lat, lng) => {
    setSharingLocation(true);
    try {
      // NAME RESOLUTION LOGIC
      let resolvedName = "Traveler";
      if (userRole === 'owner') {
        const rawName = trip.owner_display_name || 'Owner';
        // If email, extract name
        if (rawName.includes('@')) {
          resolvedName = rawName.split('@')[0];
          // Capitalize
          resolvedName = resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1);
        } else {
          resolvedName = rawName;
        }
      }

      const beaconData = {
        userId: userRole === 'owner' ? 'owner_id' : 'traveler_id',
        userName: resolvedName,
        latitude: lat,
        longitude: lng,
        timestamp: Date.now()
      };

      // 1. Update Trip State (Append/Update to Array)
      const currentBeacons = Array.isArray(trip.safetyBeacons) ? trip.safetyBeacons : [];
      // Remove existing beacon for this user if any
      const otherBeacons = currentBeacons.filter(b => b.userId !== beaconData.userId);
      const updatedBeacons = [...otherBeacons, beaconData];

      const updatedTrip = { ...trip, safetyBeacons: updatedBeacons };
      setTrip(updatedTrip);

      // 2. Persist to LocalStorage
      localStorage.setItem(`trip_data_${id}`, JSON.stringify(updatedTrip));

      // 3. Persist to DB (Real)
      await fetch(`/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ safetyBeacons: updatedBeacons })
      });

      console.log("SOS Beacon Activated:", beaconData);

      // Simulate network delay
      await new Promise(r => setTimeout(r, 800));

    } catch (err) {
      console.error("Failed to activate beacon", err);
      alert("Failed to activate Safety Beacon.");
    } finally {
      setSharingLocation(false);
    }
  };

  const handleClearBeacon = async () => {
    try {
      const currentUserId = userRole === 'owner' ? 'owner_id' : 'traveler_id';

      // 1. Clear Trip State (Remove current user's beacon)
      const currentBeacons = Array.isArray(trip.safetyBeacons) ? trip.safetyBeacons : [];
      const updatedBeacons = currentBeacons.filter(b => b.userId !== currentUserId);

      const updatedTrip = { ...trip, safetyBeacons: updatedBeacons };
      setTrip(updatedTrip);

      // 2. Clear Persistence
      localStorage.setItem(`trip_data_${id}`, JSON.stringify(updatedTrip));

      // 3. Persist to DB (Real) - Clear from Backend
      await fetch(`/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ safetyBeacons: updatedBeacons })
      });

      console.log("SOS Beacon Cleared for user:", currentUserId);
    } catch (err) {
      console.error("Failed to clear beacon", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-slate-400 animate-pulse">
            {enriching ? 'Enriching destination details…' : 'Loading your Adventure...'}
          </p>
        </div>
      </div>
    );
  }

  if (!trip) return <div className="p-20 text-center text-slate-500">Trip not found.</div>;

  const destination = trip?.destination || {};
  const accessibility = destination?.accessibility && typeof destination.accessibility === 'object' ? destination.accessibility : {};
  const localRulesRaw = Array.isArray(destination?.local_rules) ? destination.local_rules : [];
  const localRules = localRulesRaw.filter((r) => r && (r.title || r.description)).slice(0, 5);
  const itinerary = Array.isArray(trip?.itinerary) ? trip.itinerary : [];
  const connectivity = destination?.connectivity && typeof destination.connectivity === 'object' ? destination.connectivity : {};
  const emergency = destination?.emergency && typeof destination.emergency === 'object' ? destination.emergency : {};

  // New fields
  // New fields - Filter duplicates
  const culturalHighlights = [...new Set(destination.cultural_highlights || [])];
  const famousPlaces = [...new Set(destination.famous_places || [])];
  const localFood = [...new Set(destination.local_food || [])];
  const safetyTips = destination.safety_tips || [];
  const travelTips = destination.travel_tips || [];

  return (
    <div className="min-h-screen bg-slate-50 relative pb-32 font-sans text-slate-900">

      {/* ... AI Modal (Same as before) ... */}
      {showGenModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setShowGenModal(false)}
        >
          <div
            className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200 relative"
            onClick={e => e.stopPropagation()} // Prevent close when clicking inside
          >
            <button
              onClick={() => setShowGenModal(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <span className="text-xl font-bold leading-none">&times;</span>
            </button>

            <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">Design Your Day ✨</h2>
            <p className="text-center text-slate-500 text-sm mb-8">Let AI craft the perfect itinerary for you.</p>

            <form onSubmit={submitGeneration} className="space-y-6">
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Duration (Days)</label>
                <div className="relative">
                  <input
                    type="number" min="1" max="10"
                    value={genOptions.days}
                    onChange={e => setGenOptions({ ...genOptions, days: e.target.value })}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-center"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Days</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Pace</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Relaxed', 'Moderate', 'Packed'].map(p => (
                    <button
                      key={p} type="button"
                      onClick={() => setGenOptions({ ...genOptions, pace: p })}
                      className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${genOptions.pace === p ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition shadow-xl shadow-slate-200 mt-2 flex items-center justify-center gap-2">
                <span>Generate Plan</span>
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                  <span className="text-[10px]">✨</span>
                </div>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 relative z-30 shadow-sm">
        {isOffline && (
          <div className="bg-slate-900 text-white text-xs font-bold text-center py-1 flex items-center justify-center gap-2">
            <Wifi className="w-3 h-3 text-rose-400" /> You are viewing an offline version of this trip.
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link href="/" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 mb-1 inline-flex items-center gap-1 group">
                <ChevronRight className="w-3 h-3 rotate-180 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
              </Link>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                Trip to {trip.destination.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-slate-500 font-medium mt-1">
                <span>{new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>{trip.travelers} Travelers</span>
              </div>
            </div>

            <div className="w-full sm:w-auto mt-6 sm:mt-0">
              {/* Mobile Actions: Scrollable Pill Style */}
              <div
                className="flex items-center gap-2.5 overflow-x-auto pb-2 mb-4 sm:mb-0 sm:overflow-visible sm:pb-0 hide-scrollbar"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {/* PLAN */}
                <button
                  onClick={() => setShowGenModal(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700 rounded-full px-4 py-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.08)] flex items-center gap-2 font-bold text-xs whitespace-nowrap shrink-0 scroll-snap-align-start"
                >
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Plan Trip</span>
                </button>

                {/* EXPENSE */}
                <Link
                  href={`/trip/${id}/expenses`}
                  className="bg-white hover:bg-slate-50 text-slate-700 rounded-full px-4 py-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.08)] flex items-center gap-2 font-bold text-xs whitespace-nowrap shrink-0 scroll-snap-align-start"
                >
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span>Expenses</span>
                </Link>

                {/* INVITE */}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700 rounded-full px-4 py-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.08)] flex items-center gap-2 font-bold text-xs whitespace-nowrap shrink-0 scroll-snap-align-start"
                >
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Invite</span>
                </button>

                {/* SHARE */}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Trip to ${trip.destination.name}`,
                        text: `Join my trip to ${trip.destination.name} on Odyssey!`,
                        url: window.location.href
                      }).catch(console.error);
                    } else {
                      setShowShareModal(true);
                    }
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 rounded-full px-4 py-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.08)] flex items-center gap-2 font-bold text-xs whitespace-nowrap shrink-0 scroll-snap-align-start"
                >
                  <Share2 className="w-4 h-4 text-indigo-500" />
                  <span>Share</span>
                </button>
              </div>

              {/* SAVE & PDF - Row below */}
              <div className="flex gap-3">
                <button onClick={handleSaveOffline} className="flex-1 bg-slate-100 rounded-[16px] p-[14px] flex items-center justify-center gap-2 hover:bg-slate-200 transition text-slate-600 font-bold text-xs">
                  <Download className="w-4 h-4" /> Save Offline
                </button>
                <div className="flex-1">
                  <DownloadPdfBtn trip={trip} variant="full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EMERGENCY FAB - Now positioned at root level (see bottom) */}

      <div className="fixed bottom-24 right-4 z-40 md:hidden">
        {/* Mobile visible Safety Widget Trigger */}
      </div>


      {showSettingsModal && (
        <TripSettingsModal
          trip={trip}
          onClose={() => setShowSettingsModal(false)}
          onUpdate={(updatedTrip) => setTrip(prev => ({ ...prev, ...updatedTrip }))}
        />
      )}



      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* 70/30 GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-8 items-start">

          {/* --- LEFT COLUMN (70%) --- */}
          <div className="space-y-8 min-w-0">

            {/* 1. HERO / DESTINATION SUMMARY (REFINED) */}
            <section className="relative mb-12">
              <div
                className="p-[28px] text-white overflow-hidden relative"
                style={{
                  background: 'linear-gradient(135deg, rgb(9 4 52) 0%, rgb(29 40 85) 45%, rgb(13 21 65) 100%)',
                  boxShadow: '0 20px 60px rgba(2,6,23,0.6)',
                  borderBottomLeftRadius: '24px',
                  borderBottomRightRadius: '24px',
                  borderTopLeftRadius: '2rem',
                  borderTopRightRadius: '2rem'
                }}
              >

                {/* Background decorative elements (Subtle) */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">

                  {/* Left: Destination Info & Status */}
                  <div className="flex-1 space-y-4">
                    <div>
                      {/* Status Badge */}
                      {(() => {
                        const now = new Date();
                        const start = new Date(trip.startDate);
                        const end = new Date(trip.endDate);
                        let statusText = "";
                        let statusColor = "bg-slate-700/50 text-slate-200 border-slate-600/30"; // default

                        if (now < start) {
                          const diffTime = Math.abs(start - now);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          statusText = `Trip starts in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                          statusColor = "bg-white/20 text-white border-white/30";
                        } else if (now >= start && now <= end) {
                          statusText = "Currently Traveling ✈️";
                          statusColor = "bg-amber-400/30 text-amber-50 border-amber-400/40 animate-pulse";
                        } else {
                          statusText = "🚗 🚌✈️🚅";
                          statusColor = "bg-slate-900/30 text-slate-200 border-slate-500/30";
                        }

                        return (
                          <div className="inline-flex items-center gap-2 mb-3">
                            <span className={`backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${statusColor} shadow-sm`}>
                              {statusText}
                            </span>
                            <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {trip.destination.country || "Destination"}
                            </span>
                          </div>
                        );
                      })()}

                      <h2
                        className="font-bold tracking-tight text-white leading-tight"
                        style={{ fontSize: 'clamp(22px, 6vw, 32px)' }}
                      >
                        {trip.destination.name}
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs sm:text-sm font-medium text-slate-300">
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Best Time: <span className="text-white font-semibold">{destination.best_time || "Check forecast"}</span></span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/5">
                        <Compass className="w-3.5 h-3.5 text-pink-300" />
                        <span>Known For: <span className="text-white font-semibold">{culturalHighlights.slice(0, 2).join(", ") || "Culture & Views"}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Weather Widget (Compact & Aligned) */}
                  <div className="w-full md:w-auto min-w-[240px]">
                    <div style={{ background: '#ffffff00', backdropFilter: 'blur(10px)', borderRadius: '16px' }} className="p-1 shadow-lg">
                      <WeatherWidget city={trip.destination.name} theme="dark" compact={true} />
                    </div>
                  </div>
                </div>
              </div>


            </section>



            {/* 2. ABOUT DESTINATION (RICH CONTENT - REFINED) */}
            <section className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-lg shadow-slate-900/5 border border-slate-100">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-3 tracking-tight flex items-center gap-2">
                  <span className="text-2xl">🌍</span> About {trip.destination.name}
                </h2>
                <p className="text-slate-600 text-base leading-relaxed">{trip.destination.description || "Discover the magic of this place."}</p>
              </div>

              {/* Highlights Grid */}
              <div className="grid md:grid-cols-2 gap-8">

                {/* Culture & Highlights */}
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-base">
                    <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><Landmark className="w-4 h-4" /></div>
                    Highlights
                  </h3>
                  <ul className="space-y-2">
                    {culturalHighlights.length > 0 ? culturalHighlights.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 group">
                        <BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    )) : (
                      <li className="text-sm text-slate-400 italic">Highlights details loading...</li>
                    )}
                    {famousPlaces.slice(0, 3).map((place, i) => (
                      <li key={`fp-${i}`} className="flex items-start gap-2.5 text-sm text-slate-600 group">
                        <MapPin className="w-4 h-4 text-rose-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="leading-relaxed">{place}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Best Time & Food */}
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-base">
                    <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><Clock className="w-4 h-4" /></div>
                    Best Time to Visit
                  </h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed bg-amber-50/30 p-3 rounded-xl border border-amber-100/50">
                    {destination.best_time_description || destination.best_time || "Check weather forecast."}
                  </p>

                  <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-base">
                    <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600"><Utensils className="w-4 h-4" /></div>
                    Must Try Food
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {localFood.length > 0 ? localFood.map((food, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white text-slate-600 text-[11px] font-semibold rounded-full border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 hover:text-orange-600 transition-all cursor-default">
                        {food}
                      </span>
                    )) : (
                      <span className="text-sm text-slate-400 italic">Local delicacies loading...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Travel & Safety Tips */}
              {(safetyTips.length > 0 || travelTips.length > 0) && (
                <div className="mt-8 pt-8 border-t border-slate-100 grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> Safety
                    </h4>
                    <ul className="space-y-2">
                      {safetyTips.map((tip, i) => (
                        <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                      <Lightbulb className="w-3.5 h-3.5 text-slate-400" /> Tips
                    </h4>
                    <ul className="space-y-2">
                      {travelTips.map((tip, i) => (
                        <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>

            {/* 3. How to Reach */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 px-1 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><Plane className="w-5 h-5" /></div>
                How to Reach
              </h2>
              <TransportTabs
                transportInfo={destination.transport_info}
                destinationName={trip.destination.name}
                nearestStation={accessibility?.nearest_railway?.name}
                units={trip.preferences?.units}
              />
            </section>

            {/* 4. Map Section */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 px-1 flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><MapPin className="w-5 h-5" /></div>
                Map View
              </h2>
              <div className="bg-white rounded-[2rem] overflow-hidden shadow-lg shadow-slate-900/5 border border-slate-100 h-[400px] relative z-0">
                <TripMap destinationName={trip.destination.name} />
              </div>
            </section>

            {/* 5. Itinerary Timeline (New Premium UI) */}
            <section className="space-y-6">

              <Accordion defaultOpen="schedule">
                <AccordionItem value="schedule" title="Trip Schedule" icon="📅">
                  <div className="pt-2">
                    <div className="flex items-center justify-between px-1 mb-4">
                      <span className="text-xs font-medium text-slate-400">Detailed Daily Itinerary</span>
                      {!itinerary || itinerary.length === 0 && (
                        <button onClick={() => setShowGenModal(true)} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full">
                          ✨ Generate Plan
                        </button>
                      )}
                    </div>

                    <ItineraryTimeline
                      key={trip.updatedAt || new Date().toISOString()}
                      itinerary={itinerary}
                      destinationName={trip.destination.name}
                    />
                  </div>
                </AccordionItem>
              </Accordion>

              {/* Events Fallback or Addition */}
              <Accordion defaultOpen="events">
                <AccordionItem value="events" title="Upcoming Events" icon="🎉">
                  <EventsList destinationName={trip.destination.name} />
                </AccordionItem>
              </Accordion>
            </section>

            {/* 6. Local Discovery */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 px-1 flex items-center gap-2">
                <div className="p-1.5 bg-pink-100 rounded-lg text-pink-600"><Compass className="w-5 h-5" /></div>
                Local Discovery
              </h2>
              <LocalDiscovery destinationName={trip.destination.name} />
            </section>
          </div>

          {/* --- RIGHT COLUMN (30%) --- */}
          <aside className="space-y-6 w-full shrink-0">

            {/* 1. Collaborators */}
            <div className="bg-white rounded-[2rem] p-5 shadow-lg shadow-slate-900/5 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-indigo-500" /> Trip Team
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-slate-200">
                    {(trip.owner_display_name || 'O').charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{trip.owner_display_name || 'Trip Owner'}</p>
                    <p className="text-[10px] text-slate-500">Owner</p>
                  </div>
                </div>
                {trip.collaborators?.map((c, i) => {
                  const displayName = c.display_name || c.fullName || c.name || c.firstName || 'Traveler';
                  const initial = displayName.charAt(0).toUpperCase();
                  return (
                    <div key={i} className="flex items-center gap-3 p-1.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] ring-2 ring-white shadow-sm">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                        <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider">Traveler</p>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => setShowShareModal(true)} className="w-full py-3 mt-2 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-3.5 h-3.5" /> Invite Friends
                </button>
              </div>
            </div>

            {/* 2. Insights */}
            <div className="bg-white rounded-[2rem] p-5 shadow-lg shadow-slate-900/5 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                <Info className="w-4 h-4 text-orange-500" /> Insights
              </h3>
              <div className="space-y-4">
                {localRules.length > 0 ? localRules.map((rule, i) => (
                  <div key={i} className="relative pl-3 pb-1 border-l-2 border-slate-100 last:border-0">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-orange-100 border-2 border-white ring-1 ring-orange-200"></div>
                    <h4 className="font-bold text-slate-800 text-xs mb-0.5">{rule.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{rule.description}</p>
                  </div>
                )) : <p className="text-xs text-slate-400 italic">No specific insights available.</p>}
              </div>
            </div>

            {/* 3. Travel Info (REFINED) */}
            <div className="bg-white rounded-[2rem] p-5 shadow-lg shadow-slate-900/5 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base">
                <Globe className="w-4 h-4 text-blue-600" /> Travel Info
              </h3>
              <div className="space-y-3">
                {/* Currency */}
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    <span className="text-base">💱</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Currency</span>
                    <p className="font-bold text-slate-900 text-xs">{destination.currency || 'N/A'}</p>
                  </div>
                </div>

                {/* Language */}
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                    <span className="text-base">🗣️</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Language</span>
                    <p className="font-bold text-slate-900 text-xs">{destination.language || 'N/A'}</p>
                  </div>
                </div>

                {/* Connectivity */}
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-cyan-50 group-hover:border-cyan-100 transition-colors">
                    <Wifi className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Connectivity</span>
                    <p className="font-bold text-slate-900 text-xs">{connectivity.sim || 'N/A'}</p>
                  </div>
                </div>

                {/* Timezone */}
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-violet-50 group-hover:border-violet-100 transition-colors">
                    <Clock className="w-4 h-4 text-violet-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Timezone</span>
                    <p className="font-bold text-slate-900 text-xs">{destination.timezone || 'Local Time'}</p>
                  </div>
                </div>

                {/* Emergency */}
                <div className="flex items-center gap-3 group pt-1">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 group-hover:scale-105 transition-transform">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-red-400 uppercase tracking-widest block mb-0.5">Emergency</span>
                    <p className="font-black text-red-900 text-sm">{emergency.number || '112'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SAFETY BEACON (Moved & Compact) */}
            <div
              className="p-4 relative overflow-hidden text-black shadow-lg shadow-orange-500/10 w-full lg:max-w-[330px] lg:mx-auto"
              style={{
                background: 'linear-gradient(135deg, rgb(255 124 0), #ff7d7d)',
                border: '1px solid #fed7aa',
                borderRadius: '24px'
              }}
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              <div className="flex flex-col gap-3 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📡</span>
                      <h3 className="text-sm font-black tracking-tight text-slate-800">Safety Beacon</h3>
                    </div>
                    <p className="text-white text-[10px] font-medium leading-tight opacity-90">
                      Share location instantly.
                    </p>
                  </div>
                </div>

                <button
                  disabled={sharingLocation}
                  onClick={() => {
                    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
                    setSharingLocation(true);
                    navigator.geolocation.getCurrentPosition(
                      (pos) => handleShareLocation(pos.coords.latitude, pos.coords.longitude),
                      (err) => {
                        alert("Location permission required");
                        setSharingLocation(false);
                      }
                    );
                  }}
                  style={{
                    background: sharingLocation ? '#9a3412' : 'linear-gradient(135deg, #ea580c, #dc2626)',
                    boxShadow: sharingLocation ? 'none' : '0 4px 12px rgba(220,38,38,0.3)',
                    height: '40px',
                    borderRadius: '12px'
                  }}
                  className={`w-full font-bold flex items-center justify-center gap-2 transition-transform hover:-translate-y-px active:scale-95 whitespace-nowrap text-white text-xs
                              ${sharingLocation ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  {sharingLocation ? <Loader2 className="w-3 h-3 animate-spin text-orange-200" /> : <MapPin className="w-3 h-3 text-[#ffcc00]" />}
                  {sharingLocation ? "Sharing..." : "SOS Alert"}
                </button>

                {/* Status / Alerts - Compact */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/80">Active Alerts</p>
                    {(trip.safetyBeacons?.length > 0) && (
                      <button onClick={handleClearBeacon} className="text-[10px] text-white hover:text-red-100 font-bold underline">
                        Clear Mine
                      </button>
                    )}
                  </div>

                  {(trip.safetyBeacons && trip.safetyBeacons.length > 0) ? (
                    <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                      {trip.safetyBeacons.map((beacon, idx) => {
                        // Resolve Name Dynamically from Clerk Data if possible
                        let displayName = beacon.userName;

                        // 1. Check if Owner
                        if (beacon.userId === 'owner_id' || beacon.userId === trip.userId) {
                          displayName = trip.owner_display_name || 'Owner';
                        }
                        // 2. Check Collaborators
                        else {
                          const collaborator = trip.collaborators?.find(c => c.userId === beacon.userId || c.userId === 'traveler_id'); // Mock check
                          if (collaborator?.display_name) {
                            displayName = collaborator.display_name;
                          }
                        }

                        // 3. Email Fallback Parsing (if it still looks like an email)
                        if (displayName && displayName.includes('@')) {
                          displayName = displayName.split('@')[0];
                          displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                        }

                        return (
                          <div key={idx} className="bg-white/10 border border-white/20 p-2.5 rounded-xl flex items-center gap-3 backdrop-blur-sm shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                              <span className="text-xs">🆘</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-xs max-w-[120px] truncate">{displayName} !</p>
                              <a
                                href={`https://www.google.com/maps?q=${beacon.latitude},${beacon.longitude}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-white/90 hover:text-white underline decoration-white/50 underline-offset-2 block truncate"
                              >
                                View Location &rarr;
                              </a>
                              <p className="text-[9px] text-white/60 mt-0.5">{new Date(beacon.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-white/80 flex items-center gap-1.5 italic">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400/80 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span> System Active
                    </p>
                  )}
                </div>
              </div>
            </div>

          </aside>
        </div>
      </div>

      <ShareTripModal
        tripId={trip._id}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShared={(updatedTrip) => {
          if (updatedTrip?._id) setTrip((prev) => ({ ...prev, ...updatedTrip }));
        }}
      />
      <EmergencyFAB
        destination={{
          name: trip.destination.name,
          country: trip.country,
          countryCode: trip.countryCode // New ISO code
        }}
        onShareLocation={handleShareLocation}
      />
      {/* SCROLL TO TOP BUTTON */}
      {/* Positioned above FAB (bottom-24) to avoid overlap */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          width: '44px',
          height: '44px',
          background: '#111827',
          boxShadow: '0 8px 20px rgba(0,0,0,0.25)'
        }}
        className={`fixed bottom-[90px] right-[18px] text-white rounded-full flex items-center justify-center z-40 transition-all duration-300 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

    </div>
  );
}
