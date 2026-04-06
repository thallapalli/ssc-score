'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase'; 
import { 
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { 
  LayoutDashboard, PlayCircle, History, Plus, Minus, Share2, 
  CheckCircle2, UserPlus, Save, X, AlertTriangle, Trophy, Scale
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

  // --- FIREBASE REAL-TIME SYNC ---
  useEffect(() => {
    const qRoster = query(collection(db, "roster"), orderBy("name", "asc"));
    const unsubscribeRoster = onSnapshot(qRoster, (snapshot) => {
      setRoster(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qHistory = query(collection(db, "sessions"), orderBy("timestamp", "desc"));
    const unsubscribeHistory = onSnapshot(qHistory, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeRoster();
      unsubscribeHistory();
    };
  }, []);

  // --- LEADERBOARD LOGIC ---
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

  const totalNet = activePlayers.reduce((acc, p) => acc + (Number(p.cashout || 0) - (p.buyins * BUY_IN)), 0);

  // --- HANDLERS ---
  const handleOnboard = async () => {
    if (!newPlayerName.trim()) return;
    try {
      await addDoc(collection(db, "roster"), {
        name: newPlayerName.trim(),
        createdAt: serverTimestamp()
      });
      setNewPlayerName('');
      setShowOnboardModal(false);
    } catch (e) { console.error(e); }
  };

  const handleSaveSession = async () => {
    if (Math.abs(totalNet) > 0.01) {
      alert("Balance mismatch! Net must be $0.");
      return;
    }
    const sessionData = {
      timestamp: serverTimestamp(),
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
    } catch (e) { alert("Save failed: " + e.message); }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32">
      {/* HEADER */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-black/90 backdrop-blur-xl z-[100]">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter">SSC SCORE</h1>
          <p className="text-[10px] text-blue-500 font-bold tracking-widest uppercase">Cloud V8.0</p>
        </div>
        <button onClick={() => setShowOnboardModal(true)} className="bg-white/5 p-2 px-4 rounded-2xl border border-white/10 active:scale-95 flex items-center gap-2">
          <UserPlus size={16} className="text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">Onboard</span>
        </button>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {/* STANDINGS TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-2 mb-2 px-2 text-zinc-500"><Trophy size={14}/><span className="text-[10px] font-black uppercase">Current Standings</span></div>
            <div className="bg-zinc-900/30 rounded-[2.5rem] border border-white/5 overflow-hidden">
              {getOverallStandings().map(([name, net], i) => (
                <div key={name} className="p-5 flex justify-between items-center border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-600 font-black text-xs">#{i+1}</span>
                    <span className="font-bold text-lg">{name}</span>
                  </div>
                  <span className={`font-black text-lg ${net >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                    {net >= 0 ? '+' : ''}{net.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE SESSION TAB */}
        {activeTab === 'live' && (
          <div className="animate-in fade-in">
            {!isLive ? (
              <div className="space-y-6 text-center">
                <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5">
                  <h2 className="text-zinc-500 text-[10px] font-black tracking-widest mb-6 uppercase">Squad Selection</h2>
                  <div className="grid grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto">
                    {roster.map(p => {
                      const selected = activePlayers.find(ap => ap.id === p.id);
                      return (
                        <button key={p.id} onClick={() => {
                          if (selected) setActivePlayers(activePlayers.filter(ap => ap.id !== p.id));
                          else setActivePlayers([...activePlayers, { ...p, buyins: 1, cashout: 0 }]);
                        }} className={`p-5 rounded-3xl font-black border-2 transition-all ${selected ? 'bg-white text-black border-white' : 'bg-zinc-900 border-transparent text-zinc-600'}`}>
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button onClick={() => setIsLive(true)} disabled={activePlayers.length === 0} className="w-full bg-green-500 text-black py-6 rounded-[2rem] font-black shadow-xl active:scale-95 disabled:opacity-20 uppercase tracking-widest">Start Game</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`sticky top-24 z-50 p-4 rounded-3xl border flex items-center justify-between shadow-2xl ${Math.abs(totalNet) < 0.1 ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                   <span className="font-black text-xs uppercase tracking-widest">Net Balance: ${totalNet.toFixed(2)}</span>
                   {Math.abs(totalNet) > 0.1 && <span className="text-[8px] font-bold">Fix Required</span>}
                </div>
                {activePlayers.map((p, i) => (
                  <div key={p.id} className="bg-zinc-900/80 p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-black">{p.name}</span>
                      <div className="flex items-center bg-black rounded-2xl p-1 border border-white/10">
                        <button onClick={() => {let a=[...activePlayers]; a[i].buyins=Math.max(1, a[i].buyins-1); setActivePlayers(a)}} className="p-3"><Minus/></button>
                        <span className="px-4 font-black text-yellow-500 text-xl">{p.buyins}</span>
                        <button onClick={() => {let a=[...activePlayers]; a[i].buyins++; setActivePlayers(a)}} className="p-3"><Plus/></button>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center">
                      <input type="number" value={p.cashout || ''} placeholder="Cash Out" className="flex-1 bg-black border border-white/10 p-5 rounded-2xl font-black text-xl outline-none focus:border-white" onChange={(e) => {let a=[...activePlayers]; a[i].cashout=e.target.value; setActivePlayers(a)}} />
                      <div className={`text-2xl font-black min-w-[70px] text-right ${p.cashout - (p.buyins*BUY_IN) >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                        ${(p.cashout - (p.buyins*BUY_IN)).toFixed(0)}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4 pt-6 pb-20">
                  <button onClick={handleSaveSession} className={`p-6 rounded-[2rem] font-black ${Math.abs(totalNet) < 0.1 ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}><Save/></button>
                  <button className="bg-green-600 p-6 rounded-[2rem] font-black"><Share2/></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in">
            {history.map(s => (
              <div key={s.id} className="bg-zinc-900/40 p-6 rounded-[2.5rem] border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-lg">{s.date}</h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{s.players?.length} Players • ${s.totalPot} Pot</p>
                  </div>
                  <div className="bg-green-500/10 text-green-500 text-[8px] px-3 py-1 rounded-full font-black">SETTLED</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.players?.map((p, idx) => (
                    <div key={idx} className="bg-black/40 px-3 py-1 rounded-xl border border-white/5 flex gap-2">
                      <span className="text-[10px] text-zinc-400">{p.name}</span>
                      <span className={`text-[10px] font-black ${p.net >= 0 ? 'text-green-400' : 'text-red-500'}`}>{p.net > 0 ? '+' : ''}{p.net}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-3xl border-t border-white/5 px-10 py-6 pb-12 flex justify-between items-center z-[150]">
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-blue-400' : 'text-zinc-600'}><LayoutDashboard size={24}/></button>
        <button onClick={() => setActiveTab('live')} className={`p-6 rounded-[2.5rem] -translate-y-8 ${activeTab === 'live' ? 'bg-green-500 text-black border-[6px] border-black' : 'bg-zinc-900 text-zinc-500'}`}><PlayCircle size={32}/></button>
        <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'text-blue-400' : 'text-zinc-600'}><History size={24}/></button>
      </nav>

      {/* ONBOARD MODAL */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-8">
          <div className="w-full bg-zinc-900 border border-white/10 p-10 rounded-[3.5rem] shadow-2xl">
            <h3 className="text-3xl font-black italic mb-2 tracking-tighter uppercase">New Member</h3>
            <input autoFocus value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Full Name" className="w-full bg-black border border-white/10 p-6 rounded-3xl font-black text-xl outline-none focus:border-blue-500 mb-6" />
            <div className="flex gap-3">
              <button onClick={() => setShowOnboardModal(false)} className="flex-1 bg-zinc-800 py-6 rounded-3xl font-black">Cancel</button>
              <button onClick={handleOnboard} className="flex-1 bg-blue-500 text-white py-6 rounded-3xl font-black">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
