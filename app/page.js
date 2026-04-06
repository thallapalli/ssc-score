'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { LayoutDashboard, PlayCircle, History, UserPlus, Save, TrendingUp, Wallet, CheckCircle2 } from 'lucide-react';

const BUY_IN_UNIT = 20;

export default function SSCScoreApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLive, setIsLive] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [history, setHistory] = useState([]);
  const [roster, setRoster] = useState([]);
  const [activePlayers, setActivePlayers] = useState([]);

  // Firebase Real-time Sync
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

  // Stats for Dashboard (Unsettled Sessions only)
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

  const handleOnboard = async () => {
    if (!newPlayerName.trim()) return;
    await addDoc(collection(db, 'roster'), { name: newPlayerName.trim(), createdAt: serverTimestamp() });
    setNewPlayerName('');
    setShowOnboardModal(false);
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
    const unsettled = history.filter(s => s.status === 'unsettled');
    if (unsettled.length === 0) return;
    const batch = writeBatch(db);
    unsettled.forEach(s => batch.update(doc(db, 'sessions', s.id), { status: 'settled' }));
    await batch.commit();
    alert('Season Settled! All data archived.');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EAD6', paddingBottom: '120px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ padding: '16px 20px', background: 'rgba(8,8,8,0.95)', borderBottom: '1px solid rgba(201,168,76,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
           <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, background: 'linear-gradient(135deg, #E8C96B, #8A6E2F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SSC SCORE</h1>
           <div style={{ fontSize: '9px', color: '#8A8070', letterSpacing: '2px' }}>POKER LEDGER</div>
        </div>
        <button onClick={() => setShowOnboardModal(true)} style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid #C9A84C', padding: '8px', borderRadius: '10px' }}>
          <UserPlus size={18} color="#C9A84C" />
        </button>
      </header>

      <main style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
        
        {/* DASHBOARD: SEASON STATS */}
        {activeTab === 'dashboard' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="#C9A84C" />
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>UNSETTLED SEASON</span>
              </div>
              {getUnsettledStats().length > 0 && (
                <button onClick={batchSettleAll} style={{ background: '#C9A84C', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>SETTLE ALL</button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getUnsettledStats().map(([name, data]) => (
                <div key={name} style={{ background: 'linear-gradient(135deg, #111, #0a0a0a)', border: '1px solid #222', padding: '16px', borderRadius: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{name}</span>
                    <span style={{ fontSize: '22px', fontWeight: '900', color: data.net >= 0 ? '#5DD88A' : '#E74C3C' }}>
                      {data.net > 0 ? '+' : ''}{data.net.toFixed(0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '10px', opacity: 0.6, fontSize: '12px', borderTop: '1px solid #1a1a1a', paddingTop: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Wallet size={12} /> Total In: ${data.totalBuyIn}</span>
                    <span>Games: {data.sessions}</span>
                  </div>
                </div>
              ))}
              {getUnsettledStats().length === 0 && <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>No pending sessions.</div>}
            </div>
          </div>
        )}

        {/* LIVE SESSION: THE CORE ENGINE */}
        {activeTab === 'live' && (
          <div className="fade-in">
            {!isLive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontSize: '14px', color: '#8A8070' }}>Select Players for Tonight</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {roster.map(p => {
                    const isSelected = activePlayers.find(ap => ap.id === p.id);
                    return (
                      <button key={p.id} onClick={() => isSelected ? setActivePlayers(activePlayers.filter(ap => ap.id !== p.id)) : setActivePlayers([...activePlayers, { ...p, buyins: 1, cashout: 0 }])}
                        style={{ padding: '18px', borderRadius: '15px', background: isSelected ? 'linear-gradient(135deg, #E8C96B, #C9A84C)' : '#111', color: isSelected ? '#000' : '#8A8070', border: '1px solid #222', fontWeight: 'bold', cursor: 'pointer' }}>
                        {p.name}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setIsLive(true)} disabled={activePlayers.length === 0}
                  style={{ marginTop: '10px', padding: '20px', borderRadius: '18px', background: activePlayers.length > 0 ? '#27AE60' : '#222', color: 'white', fontWeight: '900', border: 'none', cursor: 'pointer' }}>
                  START SESSION
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: Math.abs(totalNet) < 0.1 ? '#1E4A35' : '#3d100d', padding: '15px', borderRadius: '15px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                   <div style={{ fontSize: '10px', opacity: 0.7 }}>BALANCE STATUS</div>
                   <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalNet === 0 ? '✓ MATCHED' : `$${totalNet.toFixed(2)}`}</div>
                </div>

                {activePlayers.map((p, i) => (
                  <div key={p.id} style={{ background: '#111', padding: '20px', borderRadius: '20px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{p.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#000', padding: '6px 12px', borderRadius: '10px' }}>
                        <button onClick={() => { let a = [...activePlayers]; a[i].buyins = Math.max(1, a[i].buyins - 1); setActivePlayers(a); }} style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: '20px' }}>-</button>
                        <span style={{ fontWeight: 'bold' }}>{p.buyins}</span>
                        <button onClick={() => { let a = [...activePlayers]; a[i].buyins++; setActivePlayers(a); }} style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: '20px' }}>+</button>
                      </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }}>$</span>
                      <input type="number" placeholder="0.00" onChange={e => { let a = [...activePlayers]; a[i].cashout = e.target.value; setActivePlayers(a); }}
                        style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '12px 12px 12px 25px', borderRadius: '10px', color: 'white', fontSize: '18px' }} />
                    </div>
                  </div>
                ))}

                <button onClick={() => Math.abs(totalNet) < 0.1 ? handleSaveSession() : setShowSettleModal(true)}
                  style={{ padding: '20px', background: '#C9A84C', color: '#000', borderRadius: '18px', fontWeight: '900', border: 'none' }}>
                  END & SAVE SESSION
                </button>
              </div>
            )}
          </div>
        )}

        {/* HISTORY: PAST LOGS */}
        {activeTab === 'history' && (
          <div className="fade-in">
            {history.map(s => (
              <div key={s.id} style={{ background: '#111', padding: '16px', borderRadius: '15px', marginBottom: '12px', borderLeft: s.status === 'unsettled' ? '4px solid #C9A84C' : '4px solid #27AE60' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.5, marginBottom: '8px' }}>
                  <span>{s.date}</span>
                  <span>{s.status.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {s.players.map(p => (
                    <div key={p.name} style={{ background: '#000', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                      {p.name}: <span style={{ color: p.net >= 0 ? '#5DD88A' : '#E74C3C' }}>{p.net > 0 ? '+' : ''}{p.net}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* RESOLUTION MODAL */}
      {showSettleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
          <div style={{ background: '#111', padding: '30px', borderRadius: '25px', width: '100%', border: '1px solid #333' }}>
            <h2 style={{ color: '#E74C3C', marginTop: 0 }}>Mismatch!</h2>
            <p style={{ opacity: 0.7, fontSize: '14px' }}>The table is off by <strong>${totalNet.toFixed(2)}</strong>. How do you want to fix it?</p>
            <button onClick={() => handleSaveSession('split_equal')} style={{ width: '100%', padding: '15px', margin: '8px 0', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '12px', fontWeight: 'bold' }}>Split Equally</button>
            <button onClick={() => handleSaveSession('split_positives')} style={{ width: '100%', padding: '15px', margin: '8px 0', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '12px', fontWeight: 'bold' }}>Split to Winners</button>
            <button onClick={() => setShowSettleModal(false)} style={{ width: '100%', padding: '15px', margin: '8px 0', background: '#C9A84C', color: '#000', borderRadius: '12px', fontWeight: 'bold', border: 'none' }}>Re-edit Scores</button>
          </div>
        </div>
      )}

      {/* ONBOARD MODAL */}
      {showOnboardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
          <div style={{ background: '#111', padding: '30px', borderRadius: '25px', width: '100%' }}>
            <h3>New Player</h3>
            <input autoFocus value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Enter name"
              style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '12px', marginBottom: '15px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowOnboardModal(false)} style={{ flex: 1, padding: '12px', background: '#222', borderRadius: '10px', color: 'white', border: 'none' }}>Cancel</button>
              <button onClick={handleOnboard} style={{ flex: 1, padding: '12px', background: '#C9A84C', borderRadius: '10px', color: '#000', border: 'none', fontWeight: 'bold' }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER NAV */}
      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: 'rgba(10,10,10,0.98)', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-around', padding: '15px 0 35px' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none' }}><LayoutDashboard color={activeTab === 'dashboard' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('live')} style={{ background: 'none', border: 'none' }}><PlayCircle color={activeTab === 'live' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none' }}><History color={activeTab === 'history' ? '#C9A84C' : '#444'} /></button>
      </nav>
    </div>
  );
}
