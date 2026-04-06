'use client';
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, PlayCircle, History, 
  Plus, Minus, Share2, CheckCircle2, 
  UserPlus, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Save, X
} from 'lucide-react';

export default function SSCOmniApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLive, setIsLive] = useState(false);
  const BUY_IN = 20;

  // Roster - Persistent List
  const roster = ['KT', 'Chaitanya', 'Prasad', 'Guru', 'Arveen', 'Mallela'];
  const [activePlayers, setActivePlayers] = useState([]);

  // Logic to toggle players for a session
  const togglePlayer = (name) => {
    if (activePlayers.find(p => p.name === name)) {
      setActivePlayers(activePlayers.filter(p => p.name !== name));
    } else {
      setActivePlayers([...activePlayers, { name, buyins: 1, cashout: 0 }]);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-28 selection:bg-green-500/30 font-sans">
      {/* --- HEADER --- */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-xl z-[100]">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter">SSC SCORE</h1>
          <p className="text-[8px] text-zinc-500 tracking-[4px]">V4.0 PRO SYSTEM</p>
        </div>
        <div className="bg-zinc-900 px-3 py-1 rounded-full flex items-center gap-2 border border-white/5">
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
          <span className="text-[10px] font-bold text-zinc-400">{isLive ? 'LIVE' : 'IDLE'}</span>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto overflow-x-hidden">
        {/* --- 1. DASHBOARD VIEW --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-zinc-900 to-black p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <h3 className="text-zinc-500 text-[10px] font-black tracking-widest mb-4">CURRENT STANDINGS (UNSETTLED)</h3>
              <div className="space-y-3">
                {/* Static Summary Example */}
                {['KT', 'Guru', 'Arveen'].map(name => (
                  <div key={name} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="font-bold text-lg">{name}</span>
                    <div className="text-right">
                      <div className={`text-xl font-black ${name === 'KT' ? 'text-green-400' : 'text-red-500'}`}>
                        {name === 'KT' ? '+$140' : '-$20'}
                      </div>
                      <div className="text-[10px] text-zinc-600">3 Sessions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full bg-white text-black py-5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
              <CheckCircle2 size={20}/> SETTLE ALL ACCOUNTS
            </button>
          </div>
        )}

        {/* --- 2. LIVE SESSION VIEW --- */}
        {activeTab === 'live' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!isLive ? (
              <div className="py-2 space-y-6">
                <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5">
                  <h2 className="text-zinc-400 text-[10px] font-black tracking-widest mb-4">SELECT SQUAD</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {roster.map(n => (
                      <button 
                        key={n} 
                        onClick={() => togglePlayer(n)} 
                        className={`p-5 rounded-2xl font-bold border-2 transition-all active:scale-95 ${
                          activePlayers.find(p => p.name === n) 
                          ? 'bg-white text-black border-white shadow-lg shadow-white/10' 
                          : 'bg-zinc-900 border-transparent text-zinc-600'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => setIsLive(true)} 
                  disabled={activePlayers.length === 0}
                  className="w-full bg-[#22C55E] text-black py-5 rounded-2xl font-black shadow-xl shadow-green-500/20 active:scale-95 disabled:opacity-30 relative z-10"
                  style={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                >
                  START SESSION
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activePlayers.map((p, i) => (
                  <div key={i} className="bg-zinc-900/80 p-5 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-black">{p.name}</span>
                      <div className="flex items-center bg-black rounded-2xl p-1 border border-white/10">
                        <button 
                          onClick={() => {let a=[...activePlayers]; a[i].buyins=Math.max(1, a[i].buyins-1); setActivePlayers(a)}} 
                          className="p-3 text-zinc-400"
                        >
                          <Minus size={18}/>
                        </button>
                        <span className="px-4 font-black text-yellow-500 text-lg">{p.buyins}</span>
                        <button 
                          onClick={() => {let a=[...activePlayers]; a[i].buyins++; setActivePlayers(a)}} 
                          className="p-3 text-zinc-400"
                        >
                          <Plus size={18}/>
                        </button>
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
                <div className="grid grid-cols-2 gap-3 pt-6">
                  <button className="bg-zinc-800 p-5 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <Save size={18}/> SAVE
                  </button>
                  <button className="bg-green-600 p-5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 active:scale-95 transition-all">
                    <Share2 size={18}/> SHARE
                  </button>
                  <button 
                    onClick={() => {setIsLive(false); setActivePlayers([]);}} 
                    className="col-span-2 bg-red-900/20 text-red-500 border border-red-900/30 p-5 rounded-2xl font-black mt-2 active:scale-95"
                  >
                    ABORT SESSION
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 3. HISTORY VIEW --- */}
        {activeTab === 'history' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-900/40 p-5 rounded-3xl border border-white/5 flex justify-between items-center backdrop-blur-sm">
                <div>
                  <div className="font-black text-sm uppercase tracking-widest text-zinc-200">Session #{500+i}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">APRIL {i+5}, 2026 • 6 PLAYERS</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-black tracking-tighter text-lg">$420.00</div>
                  <div className="text-[8px] font-black text-zinc-600 tracking-widest">SETTLED</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- BOTTOM NAV --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-2xl border-t border-white/5 px-8 py-4 pb-8 flex justify-between items-center z-[100]">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-green-400' : 'text-zinc-600'}`}
        >
          <LayoutDashboard size={20}/>
          <span className="text-[9px] font-black tracking-widest uppercase">Dash</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('live')} 
          className={`flex flex-col items-center gap-1 transition-all -translate-y-4 ${activeTab === 'live' ? 'scale-125' : 'scale-110'}`}
        >
          <div className={`p-4 rounded-3xl shadow-2xl transition-all ${activeTab === 'live' ? 'bg-green-500 text-black shadow-green-500/40' : 'bg-zinc-800 text-zinc-400'}`}>
            <PlayCircle size={28}/>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('history')} 
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-green-400' : 'text-zinc-600'}`}
        >
          <History size={20}/>
          <span className="text-[9px] font-black tracking-widest uppercase">History</span>
        </button>
      </nav>
    </div>
  );
}

