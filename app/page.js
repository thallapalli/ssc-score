'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { LayoutDashboard, PlayCircle, History, UserPlus, Save, TrendingUp, Wallet } from 'lucide-react';

const BUY_IN_UNIT = 20;

export default function ChillBoyzDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLive, setIsLive] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [roster, setRoster] = useState([]);
  const [activePlayers, setActivePlayers] = useState([]);

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

  // Calculates aggregated data for unsettled sessions
  const getUnsettledStats = () => {
    const stats = {};
    history.filter(s => s.status === 'unsettled').forEach(s => {
      s.players.forEach(p => {
        if (!stats[p.name]) stats[p.name] = { net: 0, totalBuyIn: 0, sessions: 0 };
        stats[p.name].net += p.net;
        stats[p.name].totalBuyIn += (p.buyins * BUY_IN_UNIT);
        stats[p.name].sessions += 1;
      });
    });
    return Object.entries(stats).sort((a, b) => b[1].net - a[1].net);
  };

  const handleSaveSession = async (resolutionType = 'none') => {
    let finalPlayers = [...activePlayers];
    const diff = -totalNet;

    if (diff !== 0) {
      if (resolutionType === 'split_equal') {
        const adjustment = diff / finalPlayers.length;
        finalPlayers = finalPlayers.map(p => ({ ...p, cashout: Number(p.cashout) + adjustment }));
      } else if (resolutionType === 'split_positives') {
        const winners = finalPlayers.filter(p => (Number(p.cashout) - p.buyins * BUY_IN_UNIT) > 0);
        const adjustment = diff / (winners.length || finalPlayers.length);
        finalPlayers = finalPlayers.map(p => winners.find(w => w.id === p.id) ? { ...p, cashout: Number(p.cashout) + adjustment } : p);
      }
    }

    const sessionData = {
      timestamp: serverTimestamp(),
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'unsettled',
      players: finalPlayers.map(p => ({
        name: p.name,
        buyins: p.buyins,
        cashout: Number(p.cashout),
        net: Number(p.cashout) - p.buyins * BUY_IN_UNIT
      })),
      totalPot: finalPlayers.reduce((acc, p) => acc + p.buyins * BUY_IN_UNIT, 0)
    };

    await addDoc(collection(db, 'sessions'), sessionData);
    setIsLive(false); setActivePlayers([]); setShowSettleModal(false); setActiveTab('dashboard');
  };

  const batchSettleAll = async () => {
    if (!window.confirm("Are you sure you want to settle all pending sessions?")) return;
    const unsettled = history.filter(s => s.status === 'unsettled');
    const batch = writeBatch(db);
    unsettled.forEach(s => batch.update(doc(db, 'sessions', s.id), { status: 'settled' }));
    await batch.commit();
    alert('Season settled and archived to history!');
  };

  const unsettledStats = getUnsettledStats();

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EAD6', paddingBottom: '120px', fontFamily: 'system-ui' }}>
      
      <header style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#C9A84C' }}>CHILLBOYZ POKER</h1>
        {unsettledStats.length > 0 && (
          <button onClick={batchSettleAll} style={{ background: '#C9A84C', color: 'black', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
            SETTLE SEASON
          </button>
        )}
      </header>

      <main style={{ padding: '16px', maxWidth: '500px', margin: '0 auto' }}>
        
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', opacity: 0.7 }}>
              <TrendingUp size={16} />
              <span style={{ fontSize: '12px', letterSpacing: '1px' }}>CURRENT SEASON (UNSETTLED)</span>
            </div>

            {unsettledStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No pending sessions. Start a new game!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {unsettledStats.map(([name, data]) => (
                  <div key={name} style={{ background: '#111', borderRadius: '16px', padding: '16px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{name}</span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: data.net >= 0 ? '#5DD88A' : '#E74C3C' }}>
                        {data.net > 0 ? '+' : ''}{data.net.toFixed(0)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid #1a1a1a', paddingTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Wallet size={12} color="#8A8070" />
                        <span style={{ fontSize: '12px', color: '#8A8070' }}>Total In: <strong>${data.totalBuyIn}</strong></span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#8A8070' }}>Sessions: <strong>{data.sessions}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- REST OF THE TABS (LIVE & HISTORY) REMAIN SIMILAR --- */}
        {activeTab === 'live' && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                {/* Re-insert the Live Tab Logic here from the previous code */}
                <p>Live session management logic goes here...</p>
                <button onClick={() => setIsLive(true)} style={{ padding: '15px 30px', background: '#27AE60', borderRadius: '12px', color: 'white', border: 'none' }}>Start New Session</button>
            </div>
        )}
      </main>

      {/* Persistent Navigation */}
      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-around', padding: '20px 0', borderTop: '1px solid #222' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none' }}><LayoutDashboard color={activeTab === 'dashboard' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('live')} style={{ background: 'none', border: 'none' }}><PlayCircle color={activeTab === 'live' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none' }}><History color={activeTab === 'history' ? '#C9A84C' : '#444'} /></button>
      </nav>
    </div>
  );
}
