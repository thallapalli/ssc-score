'use client';
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { AI_CONFIG } from '../lib/constants'; // Ensure this path is correct based on your folder structure
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  PlayCircle, 
  History, 
  MessageSquare, 
  Send, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  Share2 
} from 'lucide-react';

export default function SSCScoreApp() {
  const [activeTab, setActiveTab] = useState('ai');
  const [isLive, setIsLive] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activePlayers, setActivePlayers] = useState([]);
  const [roster, setRoster] = useState([]);
  const [history, setHistory] = useState([]);
  
  // AI Chat States
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hey KT! I'm your ${AI_CONFIG.APP_NAME} assistant. Send a photo of the scores or tell me who is playing today.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Sync with Firebase
  useEffect(() => {
    const unsubRoster = onSnapshot(query(collection(db, 'roster'), orderBy('name', 'asc')), snap =>
      setRoster(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubHistory = onSnapshot(query(collection(db, 'sessions'), orderBy('timestamp', 'desc')), snap =>
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubRoster(); unsubHistory(); };
  }, []);

  const totalNet = activePlayers.reduce((acc, p) => acc + (Number(p.cashout || 0) - p.buyins * AI_CONFIG.BUY_IN_AMOUNT), 0);

  // --- AI LOGIC ---
  const sendMessage = async (imgData = null) => {
    if (!input.trim() && !imgData) return;
    
    const userMsg = { role: 'user', content: input || "I've uploaded a score sheet image." };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: currentInput, 
          history: messages.slice(-5), 
          image: imgData 
        }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const aiReply = data.reply;

      // Regex to extract session data from the AI's response
      const dataMatch = aiReply.match(/START_DATA({.*?})END_DATA/s);
      if (dataMatch) {
        try {
          const sessionInfo = JSON.parse(dataMatch[1]);
          setActivePlayers(sessionInfo.players.map((p, i) => ({
            id: `ai-${Date.now()}-${i}`,
            ...p,
            cashout: p.cashout || 0
          })));
          setIsLive(true);
        } catch (e) {
          console.error("Failed to parse AI data:", e);
        }
      }

      // Clean the text to remove the raw data block before showing to user
      const cleanText = aiReply.replace(/START_DATA.*?END_DATA/s, '').trim();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: cleanText || "Session updated! Head over to the Live tab to see the details." 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `క్షమించు మామ, చిన్న ఎర్రర్: ${err.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- SESSION CONTROLS ---
  const handleSaveSession = async () => {
    try {
      const sessionData = {
        timestamp: serverTimestamp(),
        status: 'unsettled',
        players: activePlayers.map(p => ({
          name: p.name,
          buyins: p.buyins,
          cashout: Number(p.cashout),
          net: Number(p.cashout) - p.buyins * AI_CONFIG.BUY_IN_AMOUNT
        }))
      };
      await addDoc(collection(db, 'sessions'), sessionData);
      setIsSaved(true);
    } catch (error) {
      alert("Failed to save: " + error.message);
    }
  };

  const shareToWhatsApp = () => {
    let message = `*🃏 ${AI_CONFIG.APP_NAME} - Session Report*\n\n`;
    activePlayers.forEach(p => {
      const net = Number(p.cashout) - (p.buyins * AI_CONFIG.BUY_IN_AMOUNT);
      message += `👤 *${p.name}*\n   In: $${p.buyins * AI_CONFIG.BUY_IN_AMOUNT} | Net: ${net >= 0 ? '+$' : '-$'}${Math.abs(net)}\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EAD6', paddingBottom: '100px' }}>
      
      <header style={{ padding: '20px', background: '#080808', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#C9A84C' }}>CHILLBOYZ</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ cursor: 'pointer', background: '#111', padding: '8px', borderRadius: '10px', border: '1px solid #333' }}>
            <Camera size={20} color="#C9A84C" />
            <input type="file" hidden accept="image/*" onChange={(e) => {
              if (e.target.files?.[0]) {
                const reader = new FileReader();
                reader.onload = () => sendMessage(reader.result);
                reader.readAsDataURL(e.target.files[0]);
              }
            }} />
          </label>
        </div>
      </header>

      <main style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        
        {/* AI CHAT VIEW */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ 
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user' ? '#C9A84C' : '#111',
                  color: m.role === 'user' ? '#000' : '#F0EAD6',
                  padding: '12px 16px',
                  borderRadius: '15px',
                  maxWidth: '85%',
                  fontSize: '14px'
                }}>
                  {m.content}
                </div>
              ))}
              {isLoading && <Loader2 className="animate-spin" size={20} color="#C9A84C" />}
            </div>

            <div style={{ display: 'flex', gap: '10px', background: '#111', padding: '12px', borderRadius: '15px', border: '1px solid #222' }}>
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder="Talk to ChillBoyz AI..." 
                style={{ flex: 1, background: 'none', border: 'none', color: 'white', outline: 'none' }} 
              />
              <button onClick={() => sendMessage()} style={{ color: '#C9A84C', background: 'none', border: 'none' }}><Send size={20} /></button>
            </div>
          </div>
        )}

        {/* LIVE GAME VIEW */}
        {activeTab === 'live' && (
          <div>
            {!isLive ? (
              <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.4 }}>
                <PlayCircle size={60} style={{ margin: '0 auto 20px' }} />
                <p>No live session active.<br/>Ask the AI to start one or upload a sheet!</p>
              </div>
            ) : isSaved ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#111', borderRadius: '20px', border: '1px solid #222' }}>
                <CheckCircle2 size={60} color="#27AE60" style={{ marginBottom: '20px' }} />
                <h2>Session Saved!</h2>
                <button onClick={shareToWhatsApp} style={{ width: '100%', padding: '15px', background: '#25D366', borderRadius: '12px', color: 'white', fontWeight: 'bold', border: 'none', marginBottom: '10px' }}>SHARE TO WHATSAPP</button>
                <button onClick={() => { setIsLive(false); setIsSaved(false); setActivePlayers([]); setActiveTab('history'); }} style={{ width: '100%', padding: '15px', background: '#222', borderRadius: '12px', color: '#8A8070', border: 'none' }}>CLOSE SESSION</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: Math.abs(totalNet) < 0.01 ? '#1E4A35' : '#3d100d', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalNet === 0 ? '✓ Balanced' : `Diff: $${totalNet.toFixed(2)}`}</div>
                </div>
                {activePlayers.map((p, i) => (
                  <div key={i} style={{ background: '#111', padding: '15px', borderRadius: '15px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold' }}>{p.name} (${p.buyins * AI_CONFIG.BUY_IN_AMOUNT})</span>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <button onClick={() => { let a = [...activePlayers]; a[i].buyins = Math.max(1, a[i].buyins - 1); setActivePlayers(a); }}>-</button>
                        <span>{p.buyins}</span>
                        <button onClick={() => { let a = [...activePlayers]; a[i].buyins++; setActivePlayers(a); }}>+</button>
                      </div>
                    </div>
                    <input 
                      type="number" 
                      placeholder="Enter Cashout" 
                      value={p.cashout || ''} 
                      onChange={e => { let a = [...activePlayers]; a[i].cashout = e.target.value; setActivePlayers(a); }} 
                      style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '12px', borderRadius: '10px', color: 'white' }} 
                    />
                  </div>
                ))}
                <button onClick={handleSaveSession} style={{ padding: '20px', background: '#C9A84C', color: '#000', borderRadius: '15px', fontWeight: 'bold', border: 'none', marginTop: '10px' }}>END & SAVE SESSION</button>
              </div>
            )}
          </div>
        )}

        {/* DASHBOARD & HISTORY */}
        {activeTab === 'dashboard' && <div style={{ textAlign: 'center', marginTop: '50px', opacity: 0.5 }}>Standings module loading...</div>}
        {activeTab === 'history' && <div style={{ textAlign: 'center', marginTop: '50px', opacity: 0.5 }}>Session history coming soon...</div>}

      </main>

      {/* FOOTER */}
      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: '#080808', display: 'flex', justifyContent: 'space-around', padding: '20px 0 35px', borderTop: '1px solid #222' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none' }}><LayoutDashboard color={activeTab === 'dashboard' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('ai')} style={{ background: 'none', border: 'none' }}><MessageSquare color={activeTab === 'ai' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('live')} style={{ background: 'none', border: 'none' }}><PlayCircle color={activeTab === 'live' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none' }}><History color={activeTab === 'history' ? '#C9A84C' : '#444'} /></button>
      </nav>

    </div>
  );
}
