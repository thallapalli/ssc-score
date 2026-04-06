'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { LayoutDashboard, PlayCircle, History, UserPlus, Save, Share2 } from 'lucide-react';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANK_META = [
  { medal: '♛', label: 'CHIP LEADER', color: '#E8C96B' },
  { medal: '♜', label: 'RUNNER UP',   color: '#C0C0C0' },
  { medal: '♞', label: 'THIRD',       color: '#CD7F32' },
];

export default function SSCOmniApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLive, setIsLive] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [history, setHistory] = useState([]);
  const [roster, setRoster] = useState([]);
  const [activePlayers, setActivePlayers] = useState([]);
  const BUY_IN = 20;

  useEffect(() => {
    const qRoster = query(collection(db, 'roster'), orderBy('name', 'asc'));
    const unsubRoster = onSnapshot(qRoster, snap =>
      setRoster(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const qHistory = query(collection(db, 'sessions'), orderBy('timestamp', 'desc'));
    const unsubHistory = onSnapshot(qHistory, snap =>
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubRoster(); unsubHistory(); };
  }, []);

  const getOverallStandings = () => {
    const standings = {};
    roster.forEach(p => standings[p.name] = 0);
    history.forEach(session =>
      session.players?.forEach(p => {
        if (standings[p.name] !== undefined) standings[p.name] += p.net;
      })
    );
    return Object.entries(standings).sort((a, b) => b[1] - a[1]);
  };

  const totalNet = activePlayers.reduce(
    (acc, p) => acc + (Number(p.cashout || 0) - p.buyins * BUY_IN), 0
  );

  const handleOnboard = async () => {
    if (!newPlayerName.trim()) return;
    try {
      await addDoc(collection(db, 'roster'), { name: newPlayerName.trim(), createdAt: serverTimestamp() });
      setNewPlayerName('');
      setShowOnboardModal(false);
    } catch (e) { console.error(e); }
  };

  const handleSaveSession = async () => {
    if (Math.abs(totalNet) > 0.01) { alert('Balance mismatch! Net must be $0.'); return; }
    const sessionData = {
      timestamp: serverTimestamp(),
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      players: activePlayers.map(p => ({
        name: p.name, buyins: p.buyins,
        cashout: Number(p.cashout),
        net: Number(p.cashout) - p.buyins * BUY_IN
      })),
      totalPot: activePlayers.reduce((acc, p) => acc + p.buyins * BUY_IN, 0)
    };
    try {
      await addDoc(collection(db, 'sessions'), sessionData);
      setIsLive(false); setActivePlayers([]); setActiveTab('history');
    } catch (e) { alert('Save failed: ' + e.message); }
  };

  const standings = getOverallStandings();

  const gold = { fontFamily: "'Playfair Display', serif" };
  const mono = { fontFamily: "'DM Mono', monospace" };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', paddingBottom: '140px', position: 'relative', zIndex: 1 }}>

      <header style={{ position: 'sticky', top: 0, zIndex: 100, padding: '16px 20px', background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(201,168,76,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h1 style={{ ...gold, fontSize: '26px', fontWeight: 900, fontStyle: 'italic', background: 'linear-gradient(135deg, #E8C96B, #C9A84C, #8A6E2F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }}>SSC</h1>
            <span style={{ ...gold, fontSize: '14px', color: 'rgba(201,168,76,0.5)', fontStyle: 'italic' }}>Score</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            {SUITS.map((s, i) => (
              <span key={i} style={{ fontSize: '8px', color: i < 2 ? 'rgba(201,168,76,0.3)' : 'rgba(192,57,43,0.3)' }}>{s}</span>
            ))}
          </div>
        </div>
        <button onClick={() => setShowOnboardModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '14px', padding: '9px 16px', cursor: 'pointer' }}>
          <UserPlus size={14} style={{ color: '#C9A84C' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: '#C9A84C' }}>ROSTER</span>
        </button>
      </header>

      <main style={{ padding: '20px 16px', maxWidth: '480px', margin: '0 auto' }}>

        {activeTab === 'dashboard' && (
          <div className="animate-fade-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, #E8C96B, #C9A84C)' }} />
              <span style={{ ...gold, fontSize: '11px', letterSpacing: '0.2em', color: '#8A8070', textTransform: 'uppercase' }}>All-Time Standings</span>
            </div>

            {standings.length >= 3 && (
              <div className="animate-fade-up-delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                {[standings[1], standings[0], standings[2]].map((entry, podiumIdx) => {
                  const actualRank = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
                  const [name, net] = entry;
                  const meta = RANK_META[actualRank];
                  const isChamp = actualRank === 0;
                  return (
                    <div key={name} className={isChamp ? 'float-anim' : ''} style={{ background: isChamp ? 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(28,28,28,0.95))' : 'rgba(20,20,20,0.9)', border: isChamp ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '16px 8px', textAlign: 'center', marginTop: isChamp ? '0' : '12px', boxShadow: isChamp ? '0 8px 32px rgba(201,168,76,0.1)' : 'none' }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{meta.medal}</div>
                      <div style={{ ...gold, fontSize: '13px', fontWeight: 700, color: '#F0EAD6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ ...mono, fontSize: '14px', fontWeight: 600, marginTop: '4px', color: net >= 0 ? '#5DD88A' : '#E74C3C' }}>{net >= 0 ? '+' : ''}{net}</div>
                      <div style={{ fontSize: '7px', color: meta.color, letterSpacing: '0.1em', marginTop: '3px', opacity: 0.7 }}>{meta.label}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="animate-fade-up-delay-2" style={{ background: 'linear-gradient(135deg, rgba(20,20,20,0.9), rgba(12,12,12,0.95))', border: '1px solid rgba(201,168,76,0.08)', borderRadius: '24px', overflow: 'hidden', marginBottom: '16px' }}>
              {standings.map(([name, net], i) => (
                <div key={name} style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < standings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i === 0 ? 'linear-gradient(90deg, rgba(201,168,76,0.04), transparent)' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ ...mono, fontSize: '11px', color: i === 0 ? '#C9A84C' : i === 1 ? '#909090' : i === 2 ? '#CD7F32' : '#3A3530', width: '16px', textAlign: 'center' }}>
                      {i === 0 ? '♛' : i === 1 ? '♜' : i === 2 ? '♞' : i + 1}
                    </span>
                    <div>
                      <div style={{ ...gold, fontSize: '16px', fontWeight: 700, color: i === 0 ? '#F0EAD6' : '#8A8070' }}>{name}</div>
                      <div style={{ fontSize: '9px', color: '#3A3530', letterSpacing: '0.1em' }}>
                        {history.filter(s => s.players?.some(p => p.name === name)).length} sessions
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ ...mono, fontSize: '18px', fontWeight: 600, color: net > 0 ? '#5DD88A' : net < 0 ? '#E74C3C' : '#4A4540' }}>{net > 0 ? '+' : ''}{net}</div>
                    {net !== 0 && <div style={{ fontSize: '8px', color: net > 0 ? 'rgba(93,216,138,0.4)' : 'rgba(231,76,60,0.4)', letterSpacing: '0.1em' }}>{net > 0 ? 'PROFIT' : 'DEFICIT'}</div>}
                  </div>
                </div>
              ))}
            </div>

            {history.length > 0 && (
              <div className="animate-fade-up-delay-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Sessions', value: history.length, icon: '♠' },
                  { label: 'Total Pot', value: '$' + history.reduce((a, s) => a + (s.totalPot || 0), 0), icon: '♦' },
                  { label: 'Players', value: roster.length, icon: '♣' },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ background: 'rgba(20,20,20,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '14px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', marginBottom: '4px', opacity: 0.25 }}>{icon}</div>
                    <div style={{ ...mono, fontSize: '15px', fontWeight: 600, color: '#F0EAD6' }}>{value}</div>
                    <div style={{ fontSize: '8px', color: '#4A4540', letterSpacing: '0.1em', marginTop: '2px' }}>{label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'live' && (
          <div className="animate-fade-up">
            {!isLive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, #5DD88A, #27AE60)' }} />
                  <span style={{ ...gold, fontSize: '11px', letter​​​​​​​​​​​​​​​​
