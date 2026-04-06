'use client';
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, PlayCircle, History, Plus, Minus, Share2, 
  CheckCircle2, UserPlus, Save, X, PlusCircle, TrendingUp, AlertTriangle, Scale
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

  // Load Data
  useEffect(() => {
    const savedRoster = localStorage.getItem('ssc_roster');
    const savedHistory = localStorage.getItem('ssc_history');
    if (savedRoster) setRoster(JSON.parse(savedRoster));
    else {
      const initial = ['KT', 'Chaitanya', 'Prasad', 'Guru', 'Arveen', 'Mallela'].map(name => ({
        id: Math.random().toString(36).substr(2, 9), name
      }));
      setRoster(initial);
      localStorage.setItem('ssc_roster', JSON.stringify(initial));
    }
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Validation Logic
  const calculateTotalNet = () => {
    return activePlayers.reduce((acc, p) => acc + (p.cashout - (p.buyins * BUY_IN)), 0);
  };

  const handleOnboard = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer = { id: Math.random().toString(36).substr(2, 9), name: newPlayerName.trim() };
    const updatedRoster = [...roster, newPlayer];
    setRoster(updatedRoster);
    localStorage.setItem('ssc_roster', JSON.stringify(updatedRoster));
    setNewPlayerName('');
    setShowOnboardModal(false);
  };

  const togglePlayer = (player) => {
    if (activePlayers.find(p => p.id === player.id)) {
      setActivePlayers(activePlayers.filter(p => p.id !== player.id));
    } else {
      setActivePlayers([...activePlayers, { ...player, buyins: 1, cashout: 0 }]);
    }
  };

  const adjustDifference = (type, targetId = null) => {
    const diff = calculateTotalNet();
    if (diff === 0) return;

    let updated = [...activePlayers];
    if (type === 'equal') {
      const perPlayer = diff / updated.length;
      updated = updated.map(p => ({ ...p, cashout: p.cashout - perPlayer }));
    } else if (type === 'single' && targetId) {
      updated = updated.map(p => p.id === targetId ? { ...p, cashout: p.cashout - diff } : p);
    }
    setActivePlayers(updated);
  };

  const handleSaveSession = () => {
    const net = calculateTotalNet();
    if (net !== 0) {
      alert(`Error: Session not balanced. Difference: $${net}. Please adjust before saving.`);
      return;
    }

    const sessionData = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      players: activePlayers.map(p => ({ ...p, net: p.cashout - (p.buyins * BUY_IN) })),
      totalPot: activePlayers.reduce((acc, p) => acc + (p.buyins * BUY_IN), 0),
      status: 'Unsettled'
    };

    const updatedHistory = [sessionData, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('ssc_history', JSON.stringify(updatedHistory));
    setIsLive(false);
    setActivePlayers([]);
    setActiveTab('history');
  };

  const totalNet = calculateTotalNet();

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans overflow-x-hidden">
      {/* HEADER */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-xl z-[100]">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter">SSC SCORE</h1>
          <p className="text-[8px] text-zinc-500 tracking-[4px]">V6.0 PRO VALIDATOR</p>
        </div>
        <button onClick={() => setShowOnboardModal(true)} className="bg-zinc-900 p-2 px-4 rounded-xl border border-white/10 active:scale-95 transition-all flex items-center gap-2">
          <UserPlus size={16} className="text-green-400" />
          <span className="text-[10px] font-black uppercase">Onboard</span>
        </button>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/50 p-10 rounded-[3rem] border border-white/10 text-center shadow-2xl">
              <Scale size={40} className="mx-auto mb-4 text-green-500/50" />
              <h3 className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">Roster Size</h3>
              <p className="text-5xl font-black">{roster.length}</p>
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            {!isLive ? (
              <div className="space-y-6">
                <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5">
                  <h2 className="text-zinc-500 text-[10px] font-black tracking-widest mb-4 uppercase">Select Players</h2>
                  <div className="grid grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1">
                    {roster.map(p => (
                      <button key={p.id} onClick={() => togglePlayer(p)} className={`p-5 rounded-2xl font-bold border-2 transition-all active:scale-95 ${activePlayers.find(ap => ap.id === p.id) ? 'bg-white text-black border-white shadow-lg' : 'bg-zinc-900 border-transparent text-zinc-600'}`}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setIsLive(true)} disabled={activePlayers.length === 0} className="w-full bg-[#22C55E] text-black py-5 rounded-2xl font-black shadow-xl active:scale-95 disabled:opacity-20">START SESSION</button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* VALIDATION ALERT */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${totalNet === 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                   <div className="flex items-center gap-3">
                     {totalNet === 0 ? <CheckCircle2 size={20}/> : <AlertTriangle size={20}/>}
                     <span className="font-black text-xs uppercase tracking-tighter">Net Balance: ${totalNet}</span>
                   </div>
                   {totalNet !== 0 && (
                     <button onClick={() => adjustDifference('equal')} className="text-[10px] bg-red-500 text-white px-3 py-1 rounded-full font-bold">Auto-Fix</button>
                   )}
                </div>

                {activePlayers.map((p, i) => (
                  <div key={p.id} className="bg-zinc-900/80 p-5 rounded-[2.5rem] border border-white/5 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-black">{p.name}</span>
                      <div className="flex items-center bg-black rounded-2xl p-1 border border-white/10">
                        <button onClick={() => {let a=[...activePlayers]; a[i].buyins=Math.max(1, a[i].buyins-1); setActivePlayers(a)}} className="p-3 text-zinc-500"><Minus/></button>
                        <span className="px-4 font-black text-yellow-500 text-lg">{p.buyins}</span>
                        <button onClick={() => {let a=[...activePlayers]; a[i].buyins++; setActivePlayers(a)}} className="p-3 text-zinc-500"><Plus/></button>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">$</span>
                        <input type="number" value={p.cashout || ''} placeholder="Cash out" className="w-full bg-black border border-white/10 p-4 pl-8 rounded-2xl font-bold outline-none" onChange={(e) => {let a=[...activePlayers]; a[i].cashout=Number(e.target.value); setActivePlayers(a)}} />
                      </div>
                      <div className={`text-xl font-black min-w-[70px] text-right ${p.cashout - (p.buyins*BUY_IN) >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                        ${p.cashout - (p.buyins*BUY_IN)}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="grid grid-cols-2 gap-3 pt-6 pb-10">
                  <button onClick={handleSaveSession} className={`p-5 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl ${totalNet === 0 ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}><Save size={18}/> SAVE SESSION</button>
                  <button className="bg-green-600 p-5 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-green-600/20"><Share2 size={18}/> SHARE</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3 animate-in fade-in duration-500">
            {history.map(s => (
              <div key={s.id} className="bg-zinc-900/40 p-5 rounded-[2rem] border border-white/5 flex justify-between items-center backdrop-blur-sm">
                <div>
                  <div className="text-[10px] text-zinc-500 font-black mb-1 uppercase tracking-widest">{s.date}</div>
                  <div className="text-xs font-bold text-zinc-200">{s.players.length} Players • Volume: ${s.totalPot}</div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] font-black bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/20">UNSETTLED</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ONBOARD MODAL */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
          <div className="w-full bg-zinc-900 border border-white/10 p-8 rounded-[3rem] shadow-2xl">
            <h3 className="text-2xl font-black italic mb-6 tracking-tighter">ONBOARD PLAYER</h3>
            <input autoFocus value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Name" className="w-full bg-black border border-white/10 p-5 rounded-2xl font-bold outline-none mb-4 focus:border-green-500" />
            <div className="flex gap-2">
              <button onClick={() => setShowOnboardModal(false)} className="flex-1 bg-zinc-800 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
              <button onClick={handleOnboard} className="flex-1 bg-green-500 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-2xl border-t border-white/5 px-8 py-4 pb-10 flex justify-between items-center z-[150]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-green-400' : 'text-zinc-600'}`}><LayoutDashboard size={20}/><span className="text-[8px] font-black uppercase tracking-widest">Dash</span></button>
        <button onClick={() => setActiveTab('live')} className={`p-5 rounded-[2rem] transition-all -translate-y-6 shadow-2xl ${activeTab === 'live' ? 'bg-green-500 text-black shadow-green-500/40 border-4 border-black' : 'bg-zinc-800 text-zinc-500'}`}><PlayCircle size={28}/></button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-green-400' : 'text-zinc-600'}`}><History size={20}/><span className="text-[8px] font-black uppercase tracking-widest">Hist</span></button>
      </nav>
    </div>
  );
}
