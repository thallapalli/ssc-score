'use client';
import { useState, useEffect } from 'react';

// Note: Later we will move this to a separate firebase.js file
const BUY_IN_AMOUNT = 20;

export default function PokerTracker() {
  const [roster, setRoster] = useState(['KT', 'Chaitanya', 'Prasad', 'Guru']); // Default Roster
  const [sessionPlayers, setSessionPlayers] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showRoster, setShowRoster] = useState(false);

  // 1. Add Player to Roster & Session
  const addToSession = (playerName) => {
    if (!sessionPlayers.find(p => p.name === playerName)) {
      setSessionPlayers([...sessionPlayers, { name: playerName, buyins: 1, cashOut: 0 }]);
    }
    setShowRoster(false);
  };

  const addNewPlayerToRoster = (name) => {
    if (name && !roster.includes(name)) {
      setRoster([...roster, name]);
      addToSession(name);
    }
  };

  // 2. Buy-in Logic
  const updateBuyins = (index, delta) => {
    const updated = [...sessionPlayers];
    updated[index].buyins = Math.max(1, updated[index].buyins + delta);
    setSessionPlayers(updated);
  };

  // 3. Scoring Logic
  const handleCashOut = (index, val) => {
    const updated = [...sessionPlayers];
    updated[index].cashOut = Number(val);
    setSessionPlayers(updated);
  };

  const calculateNet = (p) => p.cashOut - (p.buyins * BUY_IN_AMOUNT);

  // 4. AI Roast Logic (Mockup for now)
  const generateRoast = () => {
    const results = sessionPlayers.map(p => `${p.name}: ${calculateNet(p) >= 0 ? '+' : ''}${calculateNet(p)}`).join(', ');
    const text = `ChillBoyz Poker Report: ${results}. AI Roast: Looks like someone needs to stick to Candy Crush! 🃏🔥`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      <script src="https://cdn.tailwindcss.com"></script>
      <main className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-20 font-sans">
        <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-black text-yellow-500">CHILLBOYZ 🃏</h1>
          <button className="bg-slate-800 px-3 py-1 rounded text-xs border border-slate-700">Settlements</button>
        </header>

        {!isSessionActive ? (
          <div className="text-center mt-20">
            <button 
              onClick={() => {setIsSessionActive(true); setShowRoster(true);}}
              className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 px-10 rounded-full text-xl shadow-lg shadow-yellow-900/20"
            >
              START NEW SESSION
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Session Players List */}
            {sessionPlayers.map((p, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-inner">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold uppercase tracking-wide">{p.name}</span>
                  <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl">
                    <button onClick={() => updateBuyins(i, -1)} className="w-10 h-10 bg-slate-700 rounded-lg text-xl">-</button>
                    <span className="w-12 text-center text-yellow-500 font-mono font-bold">{p.buyins}</span>
                    <button onClick={() => updateBuyins(i, 1)} className="w-10 h-10 bg-slate-700 rounded-lg text-xl">+</button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative flex-grow">
                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                    <input 
                      type="number" 
                      placeholder="Cash Out"
                      className="w-full bg-slate-950 border border-slate-700 p-2 pl-7 rounded-lg outline-none focus:border-yellow-600"
                      onChange={(e) => handleCashOut(i, e.target.value)}
                    />
                  </div>
                  <div className={`text-xl font-black min-w-[80px] text-right ${calculateNet(p) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {calculateNet(p) >= 0 ? `+$${calculateNet(p)}` : `-$${Math.abs(calculateNet(p))}`}
                  </div>
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => setShowRoster(true)}
                className="bg-slate-800 border border-slate-700 p-3 rounded-xl font-bold"
              >
                + ADD PLAYER
              </button>
              <button 
                onClick={generateRoast}
                className="bg-green-700 p-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                WhatsApp Share
              </button>
            </div>

            <button 
              onClick={() => {if(confirm('End session as Unsettled?')) setIsSessionActive(false)}}
              className="w-full bg-red-900/40 border border-red-800 text-red-400 p-4 rounded-2xl font-bold mt-4"
            >
              END SESSION (UNSETTLED)
            </button>
          </div>
        )}

        {/* Roster Modal */}
        {showRoster && (
          <div className="fixed inset-0 bg-black/80 flex items-end z-50">
            <div className="bg-slate-900 w-full p-6 rounded-t-3xl border-t border-slate-700 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Select Players</h2>
                <button onClick={() => setShowRoster(false)} className="text-slate-400 underline">Close</button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {roster.map(name => (
                  <button 
                    key={name}
                    onClick={() => addToSession(name)}
                    className="p-3 bg-slate-800 border border-slate-700 rounded-xl active:bg-yellow-600 transition"
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-800 pt-4">
                <p className="text-sm text-slate-400 mb-2">New Player?</p>
                <div className="flex gap-2">
                  <input id="newP" type="text" className="flex-grow bg-slate-850 border border-slate-700 p-3 rounded-xl" placeholder="Enter Name"/>
                  <button 
                    onClick={() => {
                      const name = document.getElementById('newP').value;
                      addNewPlayerToRoster(name);
                      document.getElementById('newP').value = '';
                    }}
                    className="bg-yellow-600 px-4 rounded-xl"
                  >
                    ADD
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
