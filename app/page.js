'use client';
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { LayoutDashboard, PlayCircle, History, UserPlus, TrendingUp, Clock, Share2, MessageSquare, Mic, Camera, Send, Loader2, CheckCircle2 } from 'lucide-react';

const BUY_IN_UNIT = 20;

export default function SSCScoreOmni() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLive, setIsLive] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activePlayers, setActivePlayers] = useState([]);
  const [roster, setRoster] = useState([]);
  const [history, setHistory] = useState([]);
  
  // AI States
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubRoster = onSnapshot(query(collection(db, 'roster'), orderBy('name', 'asc')), snap =>
      setRoster(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubHistory = onSnapshot(query(collection(db, 'sessions'), orderBy('timestamp', 'desc')), snap =>
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubRoster(); unsubHistory(); };
  }, []);

  const totalNet = activePlayers.reduce((acc, p) => acc + (Number(p.cashout || 0) - p.buyins * BUY_IN_UNIT), 0);

  // --- AI LOGIC ---
  const handleAIAction = async (type, payload) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data: payload }),
      });
      const result = await res.json();
      
      if (result.players) {
        setActivePlayers(result.players.map((p, i) => ({
          id: p.id || `ai-${i}`,
          name: p.name,
          buyins: p.buyins || 1,
          cashout: p.cashout || 0
        })));
        setIsLive(true);
        setActiveTab('live');
      }
    } catch (err) {
      alert("AI Error: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => handleAIAction('image', reader.result);
  };

  // --- MANUAL ACTIONS ---
  const togglePlayerManual = (p) => {
    const exists = activePlayers.find(ap => ap.id === p.id);
    if (exists) setActivePlayers(activePlayers.filter(ap => ap.id !== p.id));
    else setActivePlayers([...activePlayers, { ...p, buyins: 1, cashout: 0 }]);
  };

  const handleSaveSession = async () => {
    const sessionData = {
      timestamp: serverTimestamp(),
      status: 'unsettled',
      players: activePlayers.map(p => ({
        name: p.name,
        buyins: p.buyins,
        cashout: Number(p.cashout),
        net: Number(p.cashout) - p.buyins * BUY_IN_UNIT
      }))
    };
    await addDoc(collection(db, 'sessions'), sessionData);
    setIsSaved(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EAD6', paddingBottom: '100px', fontFamily: 'sans-serif' }}>
      
      <header style={{ padding: '20px', background: '#080808', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', sticky: 'top' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#C9A84C' }}>SSC CHILLBOYZ</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
             <button onClick={() => fileInputRef.current.click()} style={{ background: '#111', border: '1px solid #333', padding: '8px', borderRadius: '10px' }}>
                <Camera size={20} color="#C9A84C" />
             </button>
             <input type="file" ref={fileInputRef} onChange={onImageUpload} hidden accept="image/*" />
        </div>
      </header>

      <main style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
             <h2 style={{ fontSize: '14px', color: '#8A8070' }}>SEASON STANDINGS</h2>
             {/* ... existing standings list ... */}
          </div>
        )}

        {/* AI CHAT TAB (New separate place) */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.6 }}>
               {isAnalyzing ? <Loader2 className="animate-spin" size={40} color="#C9A84C" /> : <MessageSquare size={40} />}
               <p>{isAnalyzing ? "AI is processing..." : "Start session via Voice, Text or Image"}</p>
            </div>
            
            <div style={{ background: '#111', padding: '15px', borderRadius: '20px', border: '1px solid #222' }}>
               <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button style={{ color: '#C9A84C' }}><Mic size={24} /></button>
                  <input 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="e.g. Add KT with 3 buyins..." 
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                  />
                  <button onClick={() => handleAIAction('text', chatInput)} style={{ color: '#C9A84C' }}><Send size={24} /></button>
               </div>
            </div>
          </div>
        )}

        {/* LIVE SESSION TAB (Manual Start or AI Results) */}
        {activeTab === 'live' && (
          <div>
            {!isLive ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <h3 style={{ gridColumn: 'span 2', fontSize: '12px', color: '#8A8070' }}>SELECT PLAYERS MANUALLY</h3>
                {roster.map(p => (
                  <button key={p.id} onClick={() => togglePlayerManual(p)}
                    style={{ padding: '15px', borderRadius: '12px', background: activePlayers.find(ap => ap.id === p.id) ? '#C9A84C' : '#111', color: activePlayers.find(ap => ap.id === p.id) ? '#000' : '#8A8070', border: '1px solid #222', fontWeight: 'bold' }}>
                    {p.name}
                  </button>
                ))}
                <button onClick={() => setIsLive(true)} disabled={activePlayers.length === 0} style={{ gridColumn: 'span 2', padding: '20px', background: '#27AE60', borderRadius: '15px', fontWeight: 'bold', border: 'none', color: 'white' }}>START MANUAL SESSION</button>
              </div>
            ) : isSaved ? (
                <div style={{ textAlign: 'center', padding: '30px', background: '#111', borderRadius: '20px' }}>
                    <CheckCircle2 size={50} color="#27AE60" />
                    <h2>Session Saved!</h2>
                    <button onClick={() => { setIsLive(false); setIsSaved(false); setActivePlayers([]); setActiveTab('history'); }} style={{ width: '100%', padding: '15px', background: '#C9A84C', borderRadius: '12px', color: 'black', fontWeight: 'bold' }}>GO TO HISTORY</button>
                </div>
            ) : (
              /* ACTIVE GAME VIEW */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: totalNet === 0 ? '#1E4A35' : '#3d100d', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalNet === 0 ? '✓ Matched' : `Diff: $${totalNet.toFixed(2)}`}</div>
                </div>
                {activePlayers.map((p, i) => (
                  <div key={p.id} style={{ background: '#111', padding: '15px', borderRadius: '15px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>{p.name} (${p.buyins * BUY_IN_UNIT})</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => { let a = [...activePlayers]; a[i].buyins++; setActivePlayers(a); }}>+</button>
                        </div>
                    </div>
                    <input type="number" value={p.cashout || ''} onChange={e => { let a = [...activePlayers]; a[i].cashout = e.target.value; setActivePlayers(a); }} placeholder="Enter Final Cashout" style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '12px', borderRadius: '10px', color: 'white' }} />
                  </div>
                ))}
                <button onClick={handleSaveSession} style={{ padding: '20px', background: '#C9A84C', color: '#000', borderRadius: '15px', fontWeight: 'bold' }}>END & SAVE</button>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
           <div>{/* ... existing history logic ... */}</div>
        )}

      </main>

      {/* FOOTER NAV */}
      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: '#080808', display: 'flex', justifyContent: 'space-around', padding: '20px 0 35px', borderTop: '1px solid #222', zIndex: 100 }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none' }}><LayoutDashboard color={activeTab === 'dashboard' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('live')} style={{ background: 'none', border: 'none' }}><PlayCircle color={activeTab === 'live' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('ai')} style={{ background: 'none', border: 'none' }}><MessageSquare color={activeTab === 'ai' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none' }}><History color={activeTab === 'history' ? '#C9A84C' : '#444'} /></button>
      </nav>

    </div>
  );
}
