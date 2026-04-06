'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { LayoutDashboard, PlayCircle, History, UserPlus, Wallet, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const BUY_IN_UNIT = 20;

export default function SSCScoreFinal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLive, setIsLive] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
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

  // Stats for Dashboard (Only Unsettled)
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

  // Grouping History by Date for Game 1, Game 2
  const getGroupedHistory = () => {
    const groups = {};
    // Reverse to process chronologically for numbering
    [...history].reverse().forEach(session => {
      if (!session.timestamp) return;
      const dateKey = session.timestamp.toDate().toLocaleDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(session);
    });
    return groups;
  };

  const handleOnboard = async () => {
    if (!newPlayerName.trim()) return;
    await addDoc(collection(db, 'roster'), { name: newPlayerName.trim(), createdAt: serverTimestamp() });
    setNewPlayerName(''); setShowOnboardModal(false);
  };

  const handleSaveSession = async (resolutionType = 'none') => {
    let finalPlayers = [...activePlayers];
    const diff = -totalNet;

    if (diff !== 0) {
      if (resolutionType === 'split_equal') {
        const adj = diff / finalPlayers.length;
        finalPlayers = finalPlayers.map(p => ({ ...p, cashout: Number(p.cashout) + adj }));
      } else if (resolutionType === 'split_positives') {
        const winners = finalPlayers.filter(p => (Number(p.cashout) - p.buyins * BUY_IN_UNIT) > 0);
        const adj = diff / (winners.length || finalPlayers.length);
        finalPlayers = finalPlayers.map(p => winners.find(w => w.id === p.id) ? { ...p, cashout: Number(p.cashout) + adj } : p);
      }
    }

    const sessionData = {
      timestamp: serverTimestamp(),
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
    const unsettled = history.filter(s => s.status === 'unsettled');
    if (unsettled.length === 0) return;
    const batch = writeBatch(db);
    unsettled.forEach(s => batch.update(doc(db, 'sessions', s.id), { status: 'settled' }));
    await batch.commit();
    alert('All sessions settled and archived!');
  };

  const groupedHistory = getGroupedHistory();

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EAD6', paddingBottom: '100px', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ padding: '20px', background: '#080808', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#C9A84C' }}>SSC SCORE</h1>
        <button onClick={() => setShowOnboardModal(true)} style={{ background: '#111', border: '1px solid #333', padding: '8px', borderRadius: '10px' }}>
          <UserPlus size={20} color="#C9A84C" />
        </button>
      </header>

      <main style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', color: '#8A8070', fontWeight: 'bold' }}>UNSETTLED SEASON STATS</span>
              {getUnsettledStats().length > 0 && (
                <button onClick={batchSettleAll} style={{ background: '#C9A84C', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', border: 'none' }}>SETTLE ALL</button>
              )}
            </div>
            {getUnsettledStats().map(([name, data]) => (
              <div key={name} style={{ background: '#111', padding: '16px', borderRadius: '15px', marginBottom: '12px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{name}</span>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: data.net >= 0 ? '#5DD88A' : '#E74C3C' }}>
                    {data.net > 0 ? '+' : ''}{data.net.toFixed(0)}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#8A8070', marginTop: '8px', display: 'flex', gap: '15px' }}>
                  <span>Total In: <strong>${data.totalBuyIn}</strong></span>
                  <span>Games: <strong>{data.sessions}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LIVE SESSION */}
        {activeTab === 'live' && (
          <div>
            {!isLive ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {roster.map(p => {
                  const selected = activePlayers.find(ap => ap.id === p.id);
                  return (
                    <button key={p.id} onClick={() => selected ? setActivePlayers(activePlayers.filter(ap => ap.id !== p.id)) : setActivePlayers([...activePlayers, { ...p, buyins: 1, cashout: 0 }])}
                      style={{ padding: '15px', borderRadius: '12px', background: selected ? '#C9A84C' : '#111', color: selected ? '#000' : '#8A8070', border: '1px solid #222', fontWeight: 'bold' }}>
                      {p.name}
                    </button>
                  );
                })}
                <button onClick={() => setIsLive(true)} disabled={activePlayers.length === 0} style={{ gridColumn: 'span 2', padding: '20px', background: '#27AE60', borderRadius: '15px', fontWeight: 'bold', marginTop: '10px', border: 'none', color: 'white' }}>START SESSION</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: Math.abs(totalNet) < 0.1 ? '#1E4A35' : '#3d100d', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px' }}>Balance Status</span>
                  <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totalNet === 0 ? '✓ Matched' : `$${totalNet.toFixed(2)}`}</div>
                </div>
                {activePlayers.map((p, i) => (
                  <div key={p.id} style={{ background: '#111', padding: '15px', borderRadius: '15px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold' }}>{p.name} (${p.buyins * BUY_IN_UNIT})</span>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <button onClick={() => { let a = [...activePlayers]; a[i].buyins = Math.max(1, a[i].buyins - 1); setActivePlayers(a); }} style={{ color: '#C9A84C', fontSize: '20px', background: 'none', border: 'none' }}>-</button>
                        <span>{p.buyins}</span>
                        <button onClick={() => { let a = [...activePlayers]; a[i].buyins++; setActivePlayers(a); }} style={{ color: '#C9A84C', fontSize: '20px', background: 'none', border: 'none' }}>+</button>
                      </div>
                    </div>
                    <input type="number" placeholder="Cashout amount" onChange={e => { let a = [...activePlayers]; a[i].cashout = e.target.value; setActivePlayers(a); }} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '12px', borderRadius: '10px', color: 'white' }} />
                  </div>
                ))}
                <button onClick={() => Math.abs(totalNet) < 0.1 ? handleSaveSession() : setShowSettleModal(true)} style={{ padding: '20px', background: '#C9A84C', color: '#000', borderRadius: '15px', fontWeight: 'bold', border: 'none' }}>END SESSION</button>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {activeTab === 'history' && (
          <div>
            {Object.keys(groupedHistory).reverse().map(date => (
              <div key={date} style={{ marginBottom: '25px' }}>
                <div style={{ fontSize: '13px', color: '#C9A84C', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> {date}
                </div>
                {groupedHistory[date].map((session, idx) => (
                  <div key={session.id} style={{ background: '#111', padding: '16px', borderRadius: '15px', marginBottom: '10px', borderLeft: session.status === 'unsettled' ? '4px solid #C9A84C' : '4px solid #27AE60' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                      <span style={{ fontWeight: 'bold' }}>Game {idx + 1}</span>
                      <span style={{ fontSize: '10px', opacity: 0.5 }}>{session.status.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {session.players.map(p => (
                        <div key={p.name} style={{ fontSize: '12px', color: '#8A8070' }}>
                          {p.name}: <span style={{ color: p.net >= 0 ? '#5DD88A' : '#E74C3C' }}>{p.net >= 0 ? '+' : ''}{p.net.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER NAV */}
      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: '#080808', display: 'flex', justifyContent: 'space-around', padding: '20px 0 35px', borderTop: '1px solid #222' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none' }}><LayoutDashboard color={activeTab === 'dashboard' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('live')} style={{ background: 'none', border: 'none' }}><PlayCircle color={activeTab === 'live' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none' }}><History color={activeTab === 'history' ? '#C9A84C' : '#444'} /></button>
      </nav>

      {/* SETTLE OPTIONS MODAL */}
      {showSettleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
          <div style={{ background: '#111', padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ color: '#E74C3C', marginTop: 0 }}>Balance Mismatch!</h3>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>Difference: ${totalNet.toFixed(2)}</p>
            <button onClick={() => handleSaveSession('split_equal')} style={{ width: '100%', padding: '15px', margin: '8px 0', background: '#222', borderRadius: '12px', color: 'white', border: '1px solid #444' }}>Split Equally</button>
            <button onClick={() => handleSaveSession('split_positives')} style={{ width: '100%', padding: '15px', margin: '8px 0', background: '#222', borderRadius: '12px', color: 'white', border: '1px solid #444' }}>Split to Winners</button>
            <button onClick={() => setShowSettleModal(false)} style={{ width: '100%', padding: '15px', margin: '8px 0', background: '#C9A84C', color: '#000', borderRadius: '12px', fontWeight: 'bold', border: 'none' }}>Go Back & Edit</button>
          </div>
        </div>
      )}

      {/* ONBOARD MODAL */}
      {showOnboardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
          <div style={{ background: '#111', padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Add New Player</h3>
            <input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Player name" style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '12px', marginBottom: '20px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowOnboardModal(false)} style={{ flex: 1, padding: '12px', background: '#222', borderRadius: '10px', color: 'white', border: 'none' }}>Cancel</button>
              <button onClick={handleOnboard} style={{ flex: 1, padding: '12px', background: '#C9A84C', borderRadius: '10px', color: '#000', fontWeight: 'bold', border: 'none' }}>Add Player</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
