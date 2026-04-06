'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { AI_CONFIG } from '../lib/constants';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { LayoutDashboard, PlayCircle, History, MessageSquare, Send, Camera, Loader2, CheckCircle2 } from 'lucide-react';

export default function SSCScoreApp() {
  const [activeTab, setActiveTab] = useState('ai');
  const [isLive, setIsLive] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activePlayers, setActivePlayers] = useState([]);
  const [messages, setMessages] = useState([{ role: 'assistant', content: `Hey మామ! I'm ${AI_CONFIG.APP_NAME} assistant. Ready for poker?` }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (imgData = null) => {
    if (!input.trim() && !imgData) return;
    const userMsg = { role: 'user', content: input || "Uploaded an image." };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages.slice(-5), image: imgData }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const aiReply = data.reply;
      const dataMatch = aiReply.match(/START_DATA({.*?})END_DATA/s);
      if (dataMatch) {
        const sessionInfo = JSON.parse(dataMatch[1]);
        setActivePlayers(sessionInfo.players.map((p, i) => ({ id: `ai-${Date.now()}-${i}`, ...p, cashout: p.cashout || 0 })));
        setIsLive(true);
      }
      const cleanText = aiReply.replace(/START_DATA.*?END_DATA/s, '').trim();
      setMessages(prev => [...prev, { role: 'assistant', content: cleanText || "Session updated!" }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally { setIsLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EAD6', paddingBottom: '100px' }}>
      <header style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#C9A84C', margin: 0, fontSize: '20px' }}>{AI_CONFIG.APP_NAME}</h1>
        <label style={{ cursor: 'pointer' }}><Camera size={24} color="#C9A84C" />
          <input type="file" hidden accept="image/*" onChange={(e) => {
            const reader = new FileReader();
            reader.onload = () => sendMessage(reader.result);
            reader.readAsDataURL(e.target.files[0]);
          }} />
        </label>
      </header>

      <main style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#C9A84C' : '#111', color: m.role === 'user' ? '#000' : '#F0EAD6', padding: '12px', borderRadius: '15px', margin: '10px 0', maxWidth: '85%' }}>{m.content}</div>
              ))}
              {isLoading && <Loader2 className="animate-spin" size={24} color="#C9A84C" />}
            </div>
            <div style={{ display: 'flex', background: '#111', padding: '10px', borderRadius: '15px' }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Ask SSC Score AI..." style={{ flex: 1, background: 'none', border: 'none', color: 'white', outline: 'none' }} />
              <button onClick={() => sendMessage()} style={{ color: '#C9A84C', background: 'none', border: 'none' }}><Send size={20} /></button>
            </div>
          </div>
        )}
        {activeTab === 'live' && isLive && (
          <div style={{ background: '#111', padding: '20px', borderRadius: '15px' }}>
             <h2 style={{ color: '#C9A84C' }}>Live Session</h2>
             {activePlayers.map((p, i) => (
               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                 <span>{p.name} ({p.buyins}x)</span>
                 <span>Cash: ${p.cashout}</span>
               </div>
             ))}
             <button style={{ width: '100%', padding: '15px', background: '#C9A84C', border: 'none', borderRadius: '10px', marginTop: '20px', fontWeight: 'bold' }}>SAVE TO FIREBASE</button>
          </div>
        )}
      </main>

      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: '#080808', display: 'flex', justifyContent: 'space-around', padding: '20px 0 35px', borderTop: '1px solid #222' }}>
        <button onClick={() => setActiveTab('ai')}><MessageSquare color={activeTab === 'ai' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('live')}><PlayCircle color={activeTab === 'live' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('history')}><History color={activeTab === 'history' ? '#C9A84C' : '#444'} /></button>
      </nav>
    </div>
  );
}

