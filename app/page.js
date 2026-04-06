'use client';
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, PlayCircle, History, 
  Plus, Minus, Share2, CheckCircle2, 
  UserPlus, Save, X, PlusCircle, TrendingUp
} from 'lucide-react';

export default function SSCOmniApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLive, setIsLive] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const BUY_IN = 20;

  // 1. Dynamic Roster with LocalStorage
  const [roster, setRoster] = useState([]);
  const [activePlayers, setActivePlayers] = useState([]);

  // Load roster from LocalStorage on mount
  useEffect(() => {
    const savedRoster = localStorage.getItem('ssc_roster');
    if (savedRoster) {
      setRoster(JSON.parse(savedRoster));
    } else {
      // Default initial users if none exist
      const initial = ['KT', 'Chaitanya', 'Prasad', 'Guru', 'Arveen', 'Mallela'].map(name => ({
        id: Math.random().toString(36).substr(2, 9),
        name: name
      }));
      setRoster(initial);
      localStorage.setItem('ssc_roster', JSON.stringify(initial));
    }
  }, []);

  // Onboard New Player and Save to Roster
  const handleOnboard = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlayerName.trim()
    };
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

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 font-sans selection:bg-green-500/30 overflow-x-hidden">
      {/* --- HEADER --- */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-xl z-[100]">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter">SSC SCORE</h1>
          <p className="text-[8px] text-zinc-500 tracking-[4px]">V5.1 PRODUCTION</p>
        </div>
        <button 
          onClick={() => setShowOnboardModal(true)}
          className="bg-zinc-900 p-2 rounded-xl border border-white/10 active:scale-95 transition-all flex items-center gap-2 px-3"
        >
          <UserPlus size={18} className="text-green-400" />
          <span className="text-[10px] font-black uppercase">Onboard</span>
        </button>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {/* --- DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-zinc-900 to-black p-6 rounded-[2.5rem] border border-white/10 shadow-2xl text-center py-12">
              <TrendingUp size={40} className="mx-auto mb-4 text-green-500/50" />
              <h3 className="text-zinc-500 text-[10px] font-black tracking-widest uppercase mb-2">Total Group Strength</h3>
              <p className="text-4xl font-black">{roster.length} Players</p>
            </div>
            <div className="bg-zinc-900/40 p-4 rounded-3xl border border-white/5 italic text-center text-xs text-zinc-500">
              Go to Session tab to start a game
            </div>
          </div>
        )}

        {/* --- LIVE SESSION --- */}
        {activeTab === 'live' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!isLive ? (
              <div className="space-y-6">
                <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5">
                  <div className="flex justify-between items-center mb-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                    <span>Select Today's Squad</span>
                    <span>{activePlayers.length} Selected</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-1">
                    {roster.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => togglePlayer(p)} 
                        className={`p-5 rounded-2xl font-bold border-2 transition-all active:scale-95 ${
                          activePlayers.find(ap => ap.id === p.id) 
                          ? 'bg-white text-black border-white shadow-lg shadow-white/10' 
                          : 'bg-zinc-900 border-transparent text-zinc-600'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => setIsLive(true)} 
                  disabled={activePlayers.length === 0}
                  className="w-full bg-[#22C55E] text-black py-5 rounded-2xl font-black shadow-xl shadow-green-500/20 active:scale-95 disabled:opacity-20 transition-all"
                >
                  START SESSION
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activePlayers.map((p, i) => (
                  <div key={p.id} className="bg-zinc-900/80 p-5 rounded-[2.5rem] border border-white/5 backdrop-blur-sm shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-black tracking-tight">{p.name}</span>
                      <div className="flex items-center bg-black rounded-2xl p-1 border border-white/10">
                        <button onClick={() => {let a=[...activePlayers]; a[i].buyins=Math.max(1, a[i].buyins-1); setActivePlayers(a)}} className="p-3 text-zinc-500"><Minus size={18}/></button>
                        <span className="px-4 font-black text-yellow-500 text-lg">{p.buyins}</span>
                        <button onClick={() => {let a=[...activePlayers]; a[i].buyins++; setActivePlayers(a)}} className="p-3 text-zinc-500"><Plus size={18}/></button>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">$</span>
                        <input 
                          type="number" 
                          placeholder="Cash out" 
                          className="w-full bg-black border border-white/10 p-4 pl-8 rounded-2xl font-bold focus:border-white outline-none transition-all" 
                          onChange={(e) => {let a=[...activePlayers]; a[i].cashout=Number(e.target.value); setActivePlayers(a)}} 
                        />
                      </div>
                      <div className={`text-xl font-black min-w-[70px] text-right ${p.cashout - (p.buyins*BUY_IN) >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                        {p.cashout - (p.buyins*BUY_IN) >= 0 ? '+' : ''}{p.cashout - (p.buyins*BUY_IN)}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="grid grid-cols-2 gap-3 pt-6 pb-10">
                  <button className="bg-zinc-800 p-5 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all"><Save size={18}/> SAVE</button>
                  <button className="bg-green-600 p-5 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-green-600/20"><Share2 size={18}/> SHARE</button>
                  <button onClick={() => {setIsLive(false); setActivePlayers([])}} className="col-span-2 bg-red-900/10 text-red-500 p-4 rounded-2xl font-bold text-xs mt-4">ABORT SESSION</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- HISTORY --- */}
        {activeTab === 'history' && (
          <div className="py-20 text-center text-zinc-600 font-bold italic animate-in fade-in">
            History feature coming soon...
          </div>
        )}
      </main>

      {/* --- ONBOARDING MODAL --- */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full bg-zinc-900 border border-white/10 p-8 rounded-[3rem] shadow-2xl">
            <h3 className="text-2xl font-black italic mb-2 tracking-tighter">ONBOARD PLAYER</h3>
            <p className="text-zinc-500 text-[10px] mb-6 uppercase tracking-widest">Adding to permanent roster...</p>
            <input 
              autoFocus
              type="text" 
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Enter Player Name" 
              className="w-full bg-black border border-white/10 p-5 rounded-2xl font-bold focus:border-green-500 outline-none mb-4 transition-all"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowOnboardModal(false)} className="flex-1 bg-zinc-800 py-5 rounded-2xl font-black active:scale-95">CANCEL</button>
              <button onClick={handleOnboard} className="flex-1 bg-green-500 text-black py-5 rounded-2xl font-black active:scale-95 shadow-lg shadow-green-500/20">CONFIRM</button>
            </div>
          </div>
        </div>
      )}

      {/* --- BOTTOM NAV --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-2xl border-t border-white/5 px-8 py-4 pb-10 flex justify-between items-center z-[150]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-green-400' : 'text-zinc-600'}`}>
          <LayoutDashboard size={20}/>
          <span className="text-[8px] font-black tracking-[2px]">DASH</span>
        </button>
        <button onClick={() => setActiveTab('live')} className={`p-5 rounded-[2rem] transition-all -translate-y-6 shadow-2xl ${activeTab === 'live' ? 'bg-green-500 text-black shadow-green-500/40 border-4 border-black' : 'bg-zinc-800 text-zinc-500'}`}>
          <PlayCircle size={28}/>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-green-400' : 'text-zinc-600'}`}>
          <History size={20}/>
          <span className="text-[8px] font-black tracking-[2px]">HIST</span>
        </button>
      </nav>
    </div>
  );
}
