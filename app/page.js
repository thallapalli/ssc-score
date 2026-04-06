'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { LayoutDashboard, PlayCircle, History, Camera, Loader2, Share2, CheckCircle2 } from 'lucide-react';

const BUY_IN_UNIT = 20;

export default function SSCScoreAI() {
  const [activeTab, setActiveTab] = useState('live');
  const [activePlayers, setActivePlayers] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // --- AI IMAGE ANALYSIS ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = reader.result;
      
      try {
        const res = await fetch('/api/analyze-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image }),
        });
        
        const data = await res.json();
        if (data.players) {
          // Identify existing players from roster or create temp ones
          const mappedPlayers = data.players.map((p, index) => ({
            id: `ai-${index}`,
            name: p.name,
            buyins: p.buyins || 1,
            cashout: p.cashout || 0
          }));
          setActivePlayers(mappedPlayers);
          setIsLive(true);
        }
      } catch (err) {
        alert("AI analysis failed. Please enter manually.");
      } finally {
        setIsAnalyzing(false);
      }
    };
  };

  // Rest of your Save and Share logic (same as previous version)
  const totalNet = activePlayers.reduce((acc, p) => acc + (Number(p.cashout || 0) - p.buyins * BUY_IN_UNIT), 0);

  const handleSave = async () => {
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

  const shareToWhatsApp = () => {
    let message = `*🃏 SSC SCORE - Session Report*\n\n`;
    activePlayers.forEach(p => {
      const net = Number(p.cashout) - (p.buyins * BUY_IN_UNIT);
      message += `👤 *${p.name}*\n   In: $${p.buyins * BUY_IN_UNIT} | Net: ${net >= 0 ? '+$' : '-$'}${Math.abs(net)}\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EAD6', paddingBottom: '100px' }}>
      <header style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#C9A84C', margin: 0 }}>SSC AI</h1>
        <label style={{ cursor: 'pointer', background: '#111', padding: '10px', borderRadius: '10px', border: '1px solid #333' }}>
          <Camera size={20} color="#C9A84C" />
          <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
        </label>
      </header>

      <main style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        {isAnalyzing ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <Loader2 size={40} className="animate-spin" color="#C9A84C" />
            <p>AI is reading your sheet...</p>
          </div>
        ) : isSaved ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#111', borderRadius: '20px' }}>
            <CheckCircle2 size={60} color="#27AE60" style={{ marginBottom: '20px' }} />
            <h2>Session Analyzed!</h2>
            <button onClick={shareToWhatsApp} style={{ width: '100%', padding: '15px', background: '#25D366', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', marginBottom: '10px' }}>SHARE REPORT</button>
            <button onClick={() => { setIsLive(false); setIsSaved(false); }} style={{ width: '100%', padding: '15px', background: '#222', border: 'none', borderRadius: '12px', color: '#8A8070' }}>CLOSE</button>
          </div>
        ) : isLive ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ background: totalNet === 0 ? '#1E4A35' : '#3d100d', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
               <b>Status: {totalNet === 0 ? '✓ Matched' : `Diff: $${totalNet.toFixed(2)}`}</b>
            </div>
            {activePlayers.map((p, i) => (
              <div key={p.id} style={{ background: '#111', padding: '15px', borderRadius: '15px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.name} (Buyins: {p.buyins})</span>
                  <span style={{ color: '#C9A84C' }}>In: ${p.buyins * BUY_IN_UNIT}</span>
                </div>
                <input 
                  type="number" 
                  value={p.cashout} 
                  onChange={(e) => { let a = [...activePlayers]; a[i].cashout = e.target.value; setActivePlayers(a); }}
                  style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '10px', marginTop: '10px', borderRadius: '8px', color: 'white' }}
                />
              </div>
            ))}
            <button onClick={handleSave} style={{ padding: '20px', background: '#C9A84C', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>SAVE ANALYZED DATA</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.5 }}>
            <p>Upload a photo of your score sheet to start AI analysis.</p>
          </div>
        )}
      </main>

      {/* Footer Nav */}
      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: '#080808', display: 'flex', justifyContent: 'space-around', padding: '20px', borderTop: '1px solid #222' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none' }}><LayoutDashboard color="#444" /></button>
        <button onClick={() => setActiveTab('live')} style={{ background: 'none', border: 'none' }}><PlayCircle color="#C9A84C" /></button>
        <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none' }}><History color="#444" /></button>
      </nav>
    </div>
  );
}
