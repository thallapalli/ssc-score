'use client';
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { LayoutDashboard, PlayCircle, History, MessageSquare, Send, Camera, Loader2 } from 'lucide-react';

export default function ChillBoyzAI() {
  const [activeTab, setActiveTab] = useState('ai');
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hey KT! Ready for some poker? Send a photo or tell me who is playing.' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePlayers, setActivePlayers] = useState([]);
  const [isLive, setIsLive] = useState(false);

  const sendMessage = async (imgData = null) => {
    if (!input.trim() && !imgData) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input || "Analyze this image", 
          history: messages.slice(-5), // Keep context
          image: imgData 
        }),
      });
      
      const data = await res.json();
      const aiReply = data.reply;

      // Check if AI wants to trigger a session
      if (aiReply.includes('[SESSION_DATA:')) {
        const jsonStr = aiReply.split('[SESSION_DATA:')[1].split(']')[0];
        const sessionInfo = JSON.parse(jsonStr);
        
        setActivePlayers(sessionInfo.players.map((p, i) => ({
          id: `ai-${i}`, ...p
        })));
        setIsLive(true);
        setTimeout(() => setActiveTab('live'), 1500); // Switch after a brief delay
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiReply.split('[SESSION_DATA:')[0] }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry మామ, something went wrong.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EAD6', paddingBottom: '100px' }}>
      
      {/* HEADER */}
      <header style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ color: '#C9A84C', margin: 0, fontSize: '20px' }}>CHILLBOYZ AI</h1>
      </header>

      <main style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ 
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user' ? '#C9A84C' : '#111',
                  color: m.role === 'user' ? '#000' : '#F0EAD6',
                  padding: '12px 16px',
                  borderRadius: '15px',
                  maxWidth: '80%',
                  fontSize: '14px'
                }}>
                  {m.content}
                </div>
              ))}
              {isLoading && <Loader2 className="animate-spin" size={20} color="#C9A84C" />}
            </div>

            <div style={{ display: 'flex', gap: '10px', background: '#111', padding: '10px', borderRadius: '15px' }}>
              <label style={{ cursor: 'pointer' }}>
                <Camera size={24} color="#8A8070" />
                <input type="file" hidden accept="image/*" onChange={(e) => {
                  const reader = new FileReader();
                  reader.onload = () => sendMessage(reader.result);
                  reader.readAsDataURL(e.target.files[0]);
                }} />
              </label>
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder="Talk to me..." 
                style={{ flex: 1, background: 'none', border: 'none', color: 'white', outline: 'none' }} 
              />
              <button onClick={() => sendMessage()} style={{ color: '#C9A84C', background: 'none', border: 'none' }}><Send size={24} /></button>
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div style={{ textAlign: 'center' }}>
            {isLive ? (
              <div style={{ background: '#111', padding: '20px', borderRadius: '20px' }}>
                <h3 style={{ color: '#C9A84C' }}>Live Session Loaded</h3>
                {activePlayers.map(p => (
                  <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' }}>
                    <span>{p.name}</span>
                    <span>{p.buyins} Buyins</span>
                  </div>
                ))}
                <button onClick={() => setActiveTab('ai')} style={{ marginTop: '20px', color: '#8A8070', background: 'none', border: 'none' }}>Go back to Chat</button>
              </div>
            ) : (
              <p>No live session. Start one via AI chat!</p>
            )}
          </div>
        )}
      </main>

      {/* FOOTER NAV */}
      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: '#080808', display: 'flex', justifyContent: 'space-around', padding: '20px 0 35px', borderTop: '1px solid #222' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none' }}><LayoutDashboard color={activeTab === 'dashboard' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('ai')} style={{ background: 'none', border: 'none' }}><MessageSquare color={activeTab === 'ai' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('live')} style={{ background: 'none', border: 'none' }}><PlayCircle color={activeTab === 'live' ? '#C9A84C' : '#444'} /></button>
      </nav>
    </div>
  );
}
