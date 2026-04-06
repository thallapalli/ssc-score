'use client';
import React, { useState } from 'react';
import { 
  LayoutDashboard, PlayCircle, History, 
  Plus, Minus, Share2, CheckCircle2, 
  UserPlus, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

export default function SSCOmniApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLive, setIsLive] = useState(false);
  const BUY_IN = 20;

  // Mock Data for UI - Firestore నుండి వస్తాయి ఇవి
  const roster = ['KT', 'Chaitanya', 'Prasad', 'Guru', 'Arveen', 'Mallela'];
  const [activePlayers, setActivePlayers] = useState([]);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24">
      {/* --- HEADER --- */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-xl z-50">
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
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'live' && <LiveView isLive={isLive} setIsLive={setIsLive} roster={roster} BUY_IN={BUY_IN} activePlayers={activePlayers} setActivePlayers={setActivePlayers} />}
        {activeTab === 'history' && <HistoryView />}
      </main>

      {/* --- BOTTOM NAV --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-lg border-t border-white/5 px-6 py-4 flex justify-between items-center z-50">
        <NavBtn icon={<LayoutDashboard size={20}/>} label="DASHBOARD" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavBtn icon={<PlayCircle size={24}/>} label="SESSION" active={activeTab === 'live'} onClick={() => setActiveTab('live')} primary />
        <NavBtn icon={<History size={20}/>} label="HISTORY" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
      </nav>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick, primary }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-green-400' : 'text-zinc-500'} ${primary ? 'scale-110 -translate-y-2' : ''}`}>
      <div className={`${primary && active ? 'bg-green-500 text-black p-2 rounded-xl' : ''}`}>{icon}</div>
      <span className="text-[9px] font-black tracking-widest">{label}</span>
    </button>
  );
}

// --- 1. DASHBOARD VIEW ---
function DashboardView() {
  const stats = [
    { name: 'KT', net: 140, games: 5 },
    { name: 'Chaitanya', net: -60, games: 5 },
    { name: 'Guru', net: 20, games: 4 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black p-6 rounded-[2rem] border border-white/10">
        <h3 className="text-zinc-500 text-[10px] font-black tracking-widest mb-4">CURRENT STANDINGS (UNSETTLED)</h3>
        <div className="space-y-3">
          {stats.map(p => (
            <div key={p.name} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="font-bold text-lg">{p.name}</span>
              <div className="text-right">
                <div className={`text-xl font-black ${p.net >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                  {p.net >= 0 ? `+$${p.net}` : `-$${Math.abs(p.net)}`}
                </div>
                <div className="text-[10px] text-zinc-600">{p.games} Sessions</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="w-full bg-white text-black py-5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all">
        <CheckCircle2 size={20}/> SETTLE ALL ACCOUNTS
      </button>
    </div>
  );
}

// --- 2. LIVE VIEW ---
function LiveView({ isLive, setIsLive, roster, BUY_IN, activePlayers, setActivePlayers }) {
  const toggle = (n) => {
    if (activePlayers.find(p => p.name === n)) {
      setActivePlayers(activePlayers.filter(p => p.name !== n));
    } else {
      setActivePlayers([...activePlayers, { name: n, buyins: 1, cashout: 0 }]);
    }
  };

  if (!isLive) return (
    <div className="py-10 text-center space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {roster.map(n => (
          <button key={n} onClick={() => toggle(n)} className={`p-5 rounded-2xl font-bold border-2 transition-all ${activePlayers.find(p => p.name === n) ? 'bg-white text-black border-white' : 'bg-zinc-900 border-transparent text-zinc-500'}`}>
            {n}
          </button>
        ))}
      </div>
      <button onClick={() => setIsLive(true)} disabled={activePlayers.length === 0} className="w-full bg-green-500 text-black py-5 rounded-2xl font-black shadow-lg shadow-green-500/20">START SESSION</button>
    </div>
  );

  return (
    <div className="space-y-4">
      {activePlayers.map((p, i) => (
        <div key={i} className="bg-zinc-900 p-5 rounded-[2rem] border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-black">{p.name}</span>
            <div className="flex items-center bg-black rounded-xl p-1 border border-white/10">
              <button onClick={() => {let a=[...activePlayers]; a[i].buyins=Math.max(1, a[i].buyins-1); setActivePlayers(a)}} className="p-2 text-zinc-500"><Minus/></button>
              <span className="px-4 font-black text-yellow-500">{p.buyins}</span>
              <button onClick={() => {let a=[...activePlayers]; a[i].buyins++; setActivePlayers(a)}} className="p-2 text-zinc-500"><Plus/></button>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <input type="number" placeholder="Cash out" className="w-full bg-black border border-white/10 p-4 rounded-xl font-bold" onChange={(e) => {let a=[...activePlayers]; a[i].cashout=Number(e.target.value); setActivePlayers(a)}} />
            </div>
            <div className={`text-lg font-black ${p.cashout - (p.buyins*BUY_IN) >=0 ? 'text-green-400' : 'text-red-500'}`}>
              ${p.cashout - (p.buyins*BUY_IN)}
            </div>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <button className="flex-1 bg-zinc-800 p-5 rounded-2xl font-bold">SAVE SESSION</button>
        <button className="flex-1 bg-green-600 p-5 rounded-2xl font-bold flex justify-center gap-2"><Share2 size={18}/> SHARE</button>
      </div>
    </div>
  );
}

// --- 3. HISTORY VIEW ---
function HistoryView() {
  return (
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
          <div>
            <div className="font-bold">April {i+5}, 2026</div>
            <div className="text-[10px] text-zinc-600">6 PLAYERS • $420 VOLUME</div>
          </div>
          <div className="text-zinc-500 italic text-xs">Settled</div>
        </div>
      ))}
    </div>
  );
}
