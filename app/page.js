'use client';
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, PlayCircle, History, Plus, Minus, Share2, 
  CheckCircle2, UserPlus, Save, X, AlertTriangle, Scale, TrendingUp, Trophy
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

  // --- DATA HYDRATION ---
  useEffect(() => {
    const savedRoster = localStorage.getItem('ssc_roster');
    const savedHistory = localStorage.getItem('ssc_history');
    
    if (savedRoster) {
      setRoster(JSON.parse(savedRoster));
    } else {
      const initial = ['KT', 'Chaitanya', 'Prasad', 'Guru', 'Arveen', 'Mallela'].map(name => ({
        id: Math.random().toString(36).substr(2, 9), name
      }));
      setRoster(initial);
      localStorage.setItem('ssc_roster', JSON.stringify(initial));
    }

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // --- ANALYTICS LOGIC ---
  const getOverallStandings = () => {
    const standings = {};
    roster.forEach(p => standings[p.name] = 0);
    history.forEach(session => {
      session.players.forEach(p => {
        if (standings[p.name] !== undefined) standings[p.name] += p.net;
      });
    });
    return Object.entries(standings).sort((a, b) => b[1] - a[1]);
  };

  const calculateTotalNet = () => {
    return activePlayers.reduce((acc, p) => acc + (Number(p.cashout || 0) - (p.buyins * BUY_IN)), 0);
  };

  // --- ACTIONS ---
  const handleOnboard = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer = { id: Math.random().toString(36).substr(2, 9), name: newPlayerName.trim() };
    const updatedRoster = [...roster, newPlayer];
    setRoster(updatedRoster);
    localStorage.setItem('ssc_roster', JSON.stringify(updatedRoster));
    setNewPlayerName('');
    setShowOnboardModal(false);
  };

  const autoBalance = (mode) => {
    const diff = calculateTotalNet();
    if (diff === 0) return;
    let updated = [...activePlayers];

    if (mode === 'equal') {
      const adjustment = diff / updated.length;
      updated = updated.map(p => ({ ...p, cashout: (Number(p.cashout || 0) - adjustment).toFixed(2) }));
    } else if (mode === 'positive') {
      const winners = updated.filter(p => (Number(p.cashout || 0) - (p.buyins * BUY_IN)) > 0);
      if (winners.length === 0) return;
      const adjustment = diff / winners.length;
      updated = updated.map(p => winners.find(w => w.id === p.id) ? { ...p, cashout: (Number(p.cashout || 0) - adjustment).toFixed(2) } : p);
    }
    setActivePlayers(updated);
  };

  const handleSaveSession = () => {
    const net = calculateTotalNet();
    if (Math.abs(net) > 0.01) {
      alert(`Balance mismatch: $${net.toFixed(2)}. Please fix before saving.`);
      return;
    }

    const sessionData = {
      id: Date.now(),
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      players: activePlayers.map(p => ({ name: p.name, buyins: p.buyins, cashout: Number(p.cashout), net: Number(p.cashout) - (p.buyins * BUY_IN) })),
      totalPot: activePlayers.reduce((acc, p) => acc + (p.buyins * BUY_IN), 0)
    };

    const updatedHistory = [sessionData, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('ssc_history', JSON.stringify(updatedHistory));
    setIsLive(false);
    setActivePlayers([]);
    setActiveTab('history');
  };

  const totalNet = calculateTotalNet();
  const standings = getOverallStandings();

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32">
      {/* HEADER */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-black/90 backdrop-blur-xl z-[100]">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter">SSC SCORE</h1>
          <p className="text-[10px] text-green-500 font-bold tracking-widest uppercase">V7.0 PRO</p>
        </div>
        <button onClick={() => setShowOnboardModal(true)} className="bg-white/5 p-2 px-4 rounded-2xl border border-white/10 active:scale-95 transition-all flex items-center gap-2">
          <UserPlus size={16} className="text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">Onboard</span>
        </button>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {/* DASHBOARD: CURRENT STANDINGS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-2 px-2 text-zinc-500">
              <Trophy size={14}/>
              <span className="text-[10px] font-black uppercase tracking-widest">All-Time Standings</span>
            </div>
            <div className="bg-zinc-900/30 rounded-[2.5rem] border border-white/5 overflow-hidden">
              {standings.map(([name, net], i) => (
                <div key={name} className={`p-5 flex justify-between items-center ${i !== standings.length - 1 ? 'border-b border-white/5' : ''}`}>
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

        {/* LIVE SESSION */}
        {activeTab === 'live' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            {!isLive ? (
              <div className="space-y-6">
                <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5">
                  <h2 className="text-zinc-500 text-[10px] font-black tracking-widest mb-6 uppercase text-center">Assemble Squad</h2>
                  <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {roster.map(p => {
                      const isSelected = activePlayers.find(ap => ap.id === p.id);
                      return (
                        <button key={p.id} onClick={() => {
                          if (isSelected) setActivePlayers(activePlayers.filter(ap => ap.id !== p.id));
                          else setActivePlayers([...activePlayers, { ...p, buyins: 1, cashout: 0 }]);
                        }} className={`p-5 rounded-3xl font-black text-sm border-2 transition-all active:scale-95 ${isSelected ? 'bg-white text-black border-white shadow-xl' : 'bg-zinc-900 border-transparent text-zinc-500'}`}>
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button onClick={() => setIsLive(true)} disabled={activePlayers.length === 0} className="w-full bg-green-500 text-black py-6 rounded-[2rem] font-black shadow-xl shadow-green-500/20 active:scale-95 disabled:opacity-20 transition-all uppercase tracking-widest">Start Session</button>
              </div>
            ) : (
              <div className="space-y-4 pb-20">
                {/* VALIDATOR BAR */}
                <div className={`sticky top-24 z-50 p-4 rounded-3xl border backdrop-blur-md flex items-center justify-between transition-all shadow-2xl ${Math.abs(totalNet) < 0.01 ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                   <div className="flex items-center gap-3">
                     {Math.abs(totalNet) < 0.01 ? <CheckCircle2 size={20}/> : <AlertTriangle size={20}/>}
                     <span className="font-black text-xs uppercase tracking-widest">Net: ${totalNet.toFixed(2)}</span>
                   </div>
                   {Math.abs(totalNet) > 0.01 && (
                     <div className="flex gap-2">
                       <button onClick={() => autoBalance('equal')} className="text-[8px] bg-white text-black px-3 py-2 rounded-full font-black uppercase">Split All</button>
                     </div>
                   )}
                </div>

                {activePlayers.map((p, i) => (
                  <div key={p.id} className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 shadow-xl transition-all">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-2xl font-black tracking-tighter">{p.name}</span>
                      <div className="flex items-center bg-black rounded-2xl p-1 border border-white/10">
                        <button onClick={() => {let a=[...activePlayers]; a[i].buyins=Math.max(1, a[i].buyins-1); setActivePlayers(a)}} className="p-3 text-zinc-500"><Minus size={18}/></button>
                        <span className="px-5 font-black text-yellow-500 text-xl">{p.buyins}</span>
                        <button onClick={() => {let a=[...activePlayers]; a[i].buyins++; setActivePlayers(a)}} className="p-3 text-zinc-500"><Plus size={18}/></button>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="relative flex-1">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-black">$</span>
                        <input type="number" value={p.cashout || ''} placeholder="Cash out" className="w-full bg-black border border-white/10 p-5 pl-10 rounded-2xl font-black text-xl outline-none focus:border-white transition-all shadow-inner" onChange={(e) => {let a=[...activePlayers]; a[i].cashout=e.target.value; setActivePlayers(a)}} />
                      </div>
                      <div className={`text-2xl font-black min-w-[80px] text-right ${p.cashout - (p.buyins*BUY_IN) >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                        ${(p.cashout - (p.buyins*BUY_IN)).toFixed(0)}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="grid grid-cols-2 gap-4 pt-8">
                  <button onClick={handleSaveSession} className={`p-6 rounded-[2rem] font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl ${Math.abs(totalNet) < 0.01 ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}><Save size={20}/> SAVE</button>
                  <button className="bg-zinc-900 p-6 rounded-[2rem] font-black flex items-center justify-center gap-2 active:scale-95 shadow-lg border border-white/10"><Share2 size={20}/> SHARE</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY: ALL SESSIONS */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-2 px-2 text-zinc-500">
              <History size={14}/>
              <span className="text-[10px] font-black uppercase tracking-widest">Session Archive</span>
            </div>
            {history.length === 0 ? (
              <div className="py-20 text-center text-zinc-700 font-bold italic uppercase tracking-widest text-xs">No records found</div>
            ) : (
              history.map(s => (
                <div key={s.id} className="bg-zinc-900/40 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-lg">{s.date}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[2px]">{s.players.length} Players • ${s.totalPot} Pot</p>
                    </div>
                    <div className="bg-green-500/10 text-green-500 text-[8px] px-3 py-1.5 rounded-full font-black border border-green-500/20">SETTLED</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.players.map((p, idx) => (
                      <div key={idx} className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400">{p.name}</span>
                        <span className={`text-[10px] font-black ${p.net >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                          {p.net > 0 ? '+' : ''}{p.net}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-3xl border-t border-white/5 px-10 py-6 pb-12 flex justify-between items-center z-[150]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'dashboard' ? 'text-blue-400' : 'text-zinc-600'}`}>
          <LayoutDashboard size={24}/>
          <span className="text-[9px] font-black uppercase tracking-widest">Standings</span>
        </button>
        <button onClick={() => setActiveTab('live')} className={`p-6 rounded-[2.5rem] transition-all -translate-y-8 shadow-2xl ${activeTab === 'live' ? 'bg-green-500 text-black shadow-green-500/40 border-[6px] border-black' : 'bg-zinc-900 text-zinc-500'}`}>
          <PlayCircle size={32}/>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'history' ? 'text-blue-400' : 'text-zinc-600'}`}>
          <History size={24}/>
          <span className="text-[9px] font-black uppercase tracking-widest">History</span>
        </button>
      </nav>

      {/* ONBOARD MODAL */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-8 animate-in zoom-in-95">
          <div className="w-full bg-zinc-900 border border-white/10 p-10 rounded-[3.5rem] shadow-2xl">
            <h3 className="text-3xl font-black italic mb-2 tracking-tighter uppercase">New Member</h3>
            <p className="text-zinc-500 text-[10px] font-bold mb-8 uppercase tracking-[3px]">Add to permanent registry</p>
            <input autoFocus value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Full Name" className="w-full bg-black border border-white/10 p-6 rounded-3xl font-black text-xl outline-none focus:border-blue-500 transition-all mb-6" />
            <div className="flex gap-3">
              <button onClick={() => setShowOnboardModal(false)} className="flex-1 bg-zinc-800 py-6 rounded-3xl font-black uppercase text-xs">Cancel</button>
              <button onClick={handleOnboard} className="flex-1 bg-blue-500 text-white py-6 rounded-3xl font-black uppercase text-xs shadow-xl shadow-blue-500/20">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
