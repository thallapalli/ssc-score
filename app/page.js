'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { LayoutDashboard, PlayCircle, History, UserPlus, TrendingUp, Clock, Share2, CheckCircle2 } from 'lucide-react';

const BUY_IN_UNIT = 20;

export default function SSCScoreFinal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLive, setIsLive] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // New state to hold screen for WhatsApp share
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

  const shareToWhatsApp = (text) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareCurrentGame = () => {
    const date = new Date().toLocaleDateString();
    let message = `*🃏 SSC SCORE - Session Report*\n📅 Date: ${date}\n\n`;
    activePlayers.forEach(p => {
      const net = Number(p.cashout) - (p.buyins * BUY_IN_UNIT);
      message += `👤 *${p.name}*\n   In: $${p.buyins * BUY_IN_UNIT} | Net: ${net >= 0 ? '+$' : '-$'}${Math.abs(net)}\n`;
    });
    message += `\n#PokerNight #SSCScore`;
    shareToWhatsApp(message);
  };

  const shareSeasonStandings = () => {
    const stats = getUnsettledStats();
    if (stats.length === 0) return alert("No data to share!");
    let message = `*🏆 SSC SCORE - Standings*\n\n`;
    stats.forEach(([name, data]) => {
      message += `${data.net >= 0 ? '✅' : '🔴'} *${name}*: ${data.net >= 0 ? '+$' : '-$'}${Math.abs(data.net.toFixed(0))}\n`;
    });
    shareToWhatsApp(message);
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

    // Update state with adjusted values so WhatsApp share uses correct data
    setActivePlayers(finalPlayers);

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
    setShowSettleModal(false);
    setIsSaved(true); // Stay on this screen to show WhatsApp button
  };

  const closeSessionAndGoHistory = () => {
    setIsLive(false);
    setIsSaved(false);
    setActivePlayers([]);
    setActiveTab('history');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EAD6', paddingBottom: '100px', fontFamily: 'sans-serif' }}>
      
      <header style={{ padding: '20px', background: '#080808', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#C9A84C' }}>SSC SCORE</h1>
        <button onClick={() => setShowOnboardModal(true)} style={{ background: '#111', border: '1px solid #333', padding: '8px', borderRadius: '10px' }}><UserPlus size={20} color="#C9A84C" /></button>
      </header>

      <main style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', color: '#8A8070', fontWeight: 'bold' }}>UNSETTLED SEASON</span>
              <button onClick={shareSeasonStandings} style={{ background: '#25D366', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Share2 size={12} /> STANDINGS
              </button>
            </div>
            {getUnsettledStats().map(([name, data]) => (
              <div key={name} style={{ background: '#111', padding: '16px', borderRadius: '15px', marginBottom: '12px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{name}</span>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: data.net >= 0 ? '#5DD88A' : '#E74C3C' }}>{data.net > 0 ? '+' : ''}{data.net.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'live' && (
          <div>
            {!isLive ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {roster.map(p => (
                  <button key={p.id} onClick={() => activePlayers.find(ap => ap.id === p.id) ? setActivePlayers(activePlayers.filter(ap => ap.id !== p.id)) : setActivePlayers([...activePlayers, { ...p, buyins: 1, cashout: 0 }])}
                    style={{ padding: '15px', borderRadius: '12px', background: activePlayers.find(ap => ap.id === p.id) ? '#C9A84C' : '#111', color: activePlayers.find(ap => ap.id === p.id) ? '#000' : '#8A8070', border: '1px solid #222' }}>
                    {p.name}
                  </button>
                ))}
                <button onClick={() => setIsLive(true)} style={{ gridColumn: 'span 2', padding: '20px', background: '#27AE60', borderRadius: '15px', fontWeight: 'bold', marginTop: '10px', border: 'none', color: 'white' }}>START SESSION</button>
              </div>
            ) : isSaved ? (
              /* --- POST-SAVE SCREEN --- */
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#111', borderRadius: '20px', border: '1px solid #222' }}>
                <CheckCircle2 size={60} color="#27AE60" style={{ marginBottom: '20px' }} />
                <h2 style={{ color: '#F0EAD6' }}>Session Saved!</h2>
                <p style={{ color: '#8A8070', marginBottom: '30px' }}>Balances have been adjusted and stored in history.</p>
                
                <button onClick={shareCurrentGame} style={{ width: '100%', padding: '18px', background: '#25D366', color: 'white', borderRadius: '15px', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Share2 size={20} /> SHARE ON WHATSAPP
                </button>
                
                <button onClick={closeSessionAndGoHistory} style={{ width: '100%', padding: '18px', background: '#222', color: '#C9A84C', borderRadius: '15px', fontWeight: 'bold', border: '1px solid #333' }}>
                  DONE & CLOSE
                </button>
              </div>
            ) : (
              /* --- ACTIVE SCORING SCREEN --- */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: Math.abs(totalNet) < 0.1 ? '#1E4A35' : '#3d100d', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totalNet === 0 ? '✓ Matched' : `$${totalNet.toFixed(2)}`}</div>
                </div>
                {activePlayers.map((p, i) => (
                  <div key={p.id} style={{ background: '#111', padding: '15px', borderRadius: '15px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span>{p.name} (${p.buyins * BUY_IN_UNIT})</span>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={() => { let a = [...activePlayers]; a[i].buyins = Math.max(1, a[i].buyins - 1); setActivePlayers(a); }}>-</button>
                        <span>{p.buyins}</span>
                        <button onClick={() => { let a = [...activePlayers]; a[i].buyins++; setActivePlayers(a); }}>+</button>
                      </div>
                    </div>
                    <input type="number" placeholder="Cashout" value={p.cashout || ''} onChange={e => { let a = [...activePlayers]; a[i].cashout = e.target.value; setActivePlayers(a); }} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '12px', borderRadius: '10px', color: 'white' }} />
                  </div>
                ))}
                <button onClick={() => Math.abs(totalNet) < 0.1 ? handleSaveSession() : setShowSettleModal(true)} style={{ padding: '20px', background: '#C9A84C', color: '#000', borderRadius: '15px', fontWeight: 'bold', border: 'none' }}>END & SAVE SESSION</button>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB (Same as before) */}
        {activeTab === 'history' && (
          <div>
            {Object.keys(history).length === 0 ? <div style={{ textAlign: 'center', opacity: 0.5 }}>No history.</div> : 
              Object.keys(history).map(date => (
                /* History grouping logic here */
                <div key={date}>...</div>
              ))
            }
          </div>
        )}
      </main>

      {/* FOOTER NAV & MODALS (Same as before) */}
      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: '#080808', display: 'flex', justifyContent: 'space-around', padding: '20px 0 35px', borderTop: '1px solid #222' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none' }}><LayoutDashboard color={activeTab === 'dashboard' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => { setActiveTab('live'); setIsSaved(false); }} style={{ background: 'none', border: 'none' }}><PlayCircle color={activeTab === 'live' ? '#C9A84C' : '#444'} /></button>
        <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none' }}><History color={activeTab === 'history' ? '#C9A84C' : '#444'} /></button>
      </nav>

      {/* SETTLE MODAL */}
      {showSettleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
          <div style={{ background: '#111', padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ color: '#E74C3C', marginTop: 0 }}>Mismatch!</h3>
            <button onClick={() => handleSaveSession('split_equal')} style={{ width: '100%', padding: '15px', margin: '8px 0', background: '#222', borderRadius: '12px', color: 'white' }}>Split Equally</button>
            <button onClick={() => handleSaveSession('split_positives')} style={{ width: '100%', padding: '15px', margin: '8px 0', background: '#222', borderRadius: '12px', color: 'white' }}>Split to Winners</button>
            <button onClick={() => setShowSettleModal(false)} style={{ width: '100%', padding: '15px', margin: '8px 0', background: '#C9A84C', color: '#000', borderRadius: '12px', fontWeight: 'bold' }}>Re-edit</button>
          </div>
        </div>
      )}
    </div>
  );
}
