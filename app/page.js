'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase'; // ఇక్కడ నీ ఫైల్ పాత్ కరెక్ట్ గా ఇవ్వు
import { 
  collection, addDoc, getDocs, onSnapshot, query, orderBy 
} from 'firebase/firestore';
import { 
  LayoutDashboard, PlayCircle, History, Plus, Minus, Share2, 
  CheckCircle2, UserPlus, Save, X, AlertTriangle, Scale, Trophy
} from 'lucide-react';

export default function SSCOmniApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLive, setIsLive] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [history, setHistory] = useState([]);
  const [roster, setRoster] = useState([]);
  const [activePlayers, setActivePlayers] = useState([]);
  const BUY_IN = 20;

  // --- 1. FIREBASE DATA SYNC ---
  useEffect(() => {
    // Real-time Roster Sync
    const qRoster = query(collection(db, "roster"), orderBy("name", "asc"));
    const unsubscribeRoster = onSnapshot(qRoster, (snapshot) => {
      setRoster(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time History Sync
    const qHistory = query(collection(db, "sessions"), orderBy("timestamp", "desc"));
    const unsubscribeHistory = onSnapshot(qHistory, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeRoster();
      unsubscribeHistory();
    };
  }, []);

  // --- 2. ANALYTICS ---
  const getOverallStandings = () => {
    const standings = {};
    roster.forEach(p => standings[p.name] = 0);
    history.forEach(session => {
      session.players?.forEach(p => {
        if (standings[p.name] !== undefined) standings[p.name] += p.net;
      });
    });
    return Object.entries(standings).sort((a, b) => b[1] - a[1]);
  };

  // --- 3. ACTIONS ---
  const handleOnboard = async () => {
    if (!newPlayerName.trim()) return;
    try {
      await addDoc(collection(db, "roster"), {
        name: newPlayerName.trim(),
        createdAt: new Date()
      });
      setNewPlayerName('');
      setShowOnboardModal(false);
    } catch (e) { alert("Error onboarding: " + e.message); }
  };

  const handleSaveSession = async () => {
    const net = activePlayers.reduce((acc, p) => acc + (Number(p.cashout || 0) - (p.buyins * BUY_IN)), 0);
    if (Math.abs(net) > 0.01) {
      alert(`Mismatch: $${net.toFixed(2)}. Fix before saving.`);
      return;
    }

    const sessionData = {
      timestamp: new Date(),
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      players: activePlayers.map(p => ({
        name: p.name,
        buyins: p.buyins,
        cashout: Number(p.cashout),
        net: Number(p.cashout) - (p.buyins * BUY_IN)
      })),
      totalPot: activePlayers.reduce((acc, p) => acc + (p.buyins * BUY_IN), 0)
    };

    try {
      await addDoc(collection(db, "sessions"), sessionData);
      setIsLive(false);
      setActivePlayers([]);
      setActiveTab('history');
    } catch (e) { alert("Error saving session: " + e.message); }
  };

  const totalNet = activePlayers.reduce((acc, p) => acc + (Number(p.cashout || 0) - (p.buyins * BUY_IN)), 0);

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32">
      {/* HEADER & UI REMAINS SAME AS V7.0 */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-black/90 backdrop-blur-xl z-[100]">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">SSC SCORE</h1>
          <p className="text-[10px] text-blue-500 font-bold tracking-widest">CLOUD SYNC V8.0</p>
        </div>
        <button onClick={() => setShowOnboardModal(true)} className="bg-white/5 p-2 px-4 rounded-2xl border border-white/10 flex items-center gap-2">
          <UserPlus size={16} className="text-blue-400" />
          <span className="text-[10px] font-black uppercase">Onboard</span>
        </button>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {/* STANDINGS (DASHBOARD) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2 px-2 text-zinc-500"><Trophy size={14}/><span className="text-[10px] font-black uppercase">Leaderboard</span></div>
            <div className="bg-zinc-900/30 rounded-[2.5rem] border border-white/5 overflow-hidden">
              {getOverallStandings().map(([name, net], i) => (
                <div key={name} className="p-5 flex justify-between items-center border-b border-white/5">
                  <div className="flex items-center gap-4"><span className="text-zinc-600 font-black text-xs">#{i+1}</span><span className="font-bold text-lg">{name}</span></div>
                  <span className={`font-black text-lg ${net >= 0 ? 'text-green-400' : 'text-red-500'}`}>{net >= 0 ? '+' : ''}{net.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE SESSION & HISTORY UI (Keep from V7.0) */}
        {/* ... Include the Live Session logic and History mapping here ... */}
        {/* (Simplified for brevity, use previous V7 formatting) */}
      </main>

      {/* FOOTER NAV (Keep from V7.0) */}
    </div>
  );
}
