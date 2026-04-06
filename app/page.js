'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import {
  LayoutDashboard, PlayCircle, History, Plus, Minus, Share2,
  CheckCircle2, UserPlus, Save, X, AlertTriangle, Trophy, Scale
} from 'lucide-react';

const SUITS = ['♠', '♥', '♦', '♣'];

const RANK_META = [
  { medal: '♛', label: 'CHIP LEADER', color: '#E8C96B' },
  { medal: '♜', label: 'RUNNER UP',   color: '#C0C0C0' },
  { medal: '♞', label: 'THIRD',       color: '#CD7F32' },
];

export default function SSCOmniApp() {
  const [activeTab, setActiveTab]               = useState('dashboard');
  const [isLive, setIsLive]                     = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newPlayerName, setNewPlayerName]       = useState('');
  const [history, setHistory]                   = useState([]);
  const [roster, setRoster]                     = useState([]);
  const [activePlayers, setActivePlayers]       = useState([]);
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
      await addDoc(collection(db, 'roster'), {
        name: newPlayerName.trim(), createdAt: serverTimestamp()
      });
      setNewPlayerName(''); setShowOnboardModal(false);
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

  return (
    <div className="min-h-screen pb-36 relative z-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER */}
      <header className="sticky top-0 z-[100] px-5 py-4"
        style={{
          background: 'linear-gradient(180deg, rgba(8,8,8,0.98) 0%, rgba(8,8,8,0.85) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(201,168,76,0.08)',
        }}>
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '26px', fontWeight: 900, fontStyle: 'italic',
                background: 'linear-gradient(135deg, #E8C96B 0%, #C9A84C 50%, #8A6E2F 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                letterSpacing: '-0.5px', lineHeight: 1,
              }}>SSC</h1>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '14px', color: 'rgba(201,168,76,0.5)', fontStyle: 'italic',
              }}>Score</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {SUITS.map((s, i) => (
                <span key={i} style={{
                  fontSize: '8px',
                  color: i < 2 ? 'rgba(201,168,76,0.3)' : 'rgba(192,57,43,0.3)',
                  letterSpacing: '1px',
                }}>{s}</span>
              ))}
            </div>
          </div>
          <button onClick={() => setShowOnboardModal(true)}
            className="flex items-center gap-2 active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.06) 100%)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: '14px', padding: '9px 16px',
            }}>
            <UserPlus size={14} style={{ color: '#C9A84C' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: '#C9A84C' }}>
              ROSTER
            </span>
          </button>
        </div>
      </header>

      <main className="px-4 pt-5 max-w-md mx-auto space-y-4">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-up space-y-5">
            <div className="flex items-center gap-3 px-1">
              <div style={{ width: '3px', height: '18px', borderRadius: '2px',
                background: 'linear-gradient(180deg, #E8C96B, #C9A84C)' }} />
              <span style={{ fontFamily: "'Playfair Display', serif",
                fontSize: '11px', letterSpacing: '0.2em', color: '#8A8070',
                textTransform: 'uppercase' }}>All-Time Standings</span>
              <div style={{ flex: 1, height: '1px',
                background: 'linear-gradient(90deg, rgba(201,168,76,0.15), transparent)' }} />
            </div>

            {standings.length >= 3 && (
              <div className="animate-fade-up-delay-1 grid grid-cols-3 gap-2">
                {[standings[1], standings[0], standings[2]].map((entry, podiumIdx) => {
                  const actualRank = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
                  const [name, net] = entry;
                  const meta = RANK_META[actualRank];
                  const isChamp = actualRank === 0;
                  return (
                    <div key={name} className={isChamp ? 'float-anim' : ''}
                      style={{
                        background: isChamp
                          ? 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(28,28,28,0.95) 100%)'
                          : 'linear-gradient(135deg, rgba(28,28,28,0.95) 0%, rgba(14,14,14,0.98) 100%)',
                        border: `1px solid ${isChamp ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '20px', padding: '16px 10px', textAlign: 'center',
                        marginTop: isChamp ? '0' : '12px',
                        position: 'relative', overflow: 'hidden',
                        boxShadow: isChamp ? '0 8px 32px rgba(201,168,76,0.12)' : 'none',
                      }}>
                      {isChamp && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)',
                        }} />
                      )}
                      <div style={{ fontSize: '22px', marginBottom: '4px' }}>{meta.medal}</div>
                      <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: isChamp ? '14px' : '13px', fontWeight: 700, color: '#F0EAD6',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{name}</div>
                      <div style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '14px', fontWeight: 600, marginTop: '4px',
                        color: net >= 0 ? '#5DD88A' : '#E74C3C',
                      }}>{net >= 0 ? '+' : ''}{net}</div>
                      <div style={{ fontSize: '8px', color: meta.color,
                        letterSpacing: '0.15em', marginTop: '4px', opacity: 0.7 }}>
                        {meta.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="animate-fade-up-delay-2" style={{
              background: 'linear-gradient(135deg, rgba(20,20,20,0.9) 0%, rgba(12,12,12,0.95) 100%)',
              border: '1px solid rgba(201,168,76,0.1)', borderRadius: '24px', overflow: 'hidden',
            }}>
              {standings.map(([name, net], i) => (
                <div key={name} style={{
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: i < standings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: i === 0
                    ? 'linear-gradient(90deg, rgba(201,168,76,0.04) 0%, transparent 60%)'
                    : 'transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: '10px', fontWeight: 500,
                      color: i === 0 ? '#C9A84C' : i === 1 ? '#909090' : i === 2 ? '#CD7F32' : '#3A3530',
                      width: '16px', textAlign: 'center',
                    }}>
                      {i === 0 ? '♛' : i === 1 ? '♜' : i === 2 ? '♞' : `${i + 1}`}
                    </span>
                    <div>
                      <span style={{
                        fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 700,
                        color: i === 0 ? '#F0EAD6' : '#B0A898',
                      }}>{name}</span>
                      <div style={{ fontSize: '9px', color: '#​​​​​​​​​​​​​​​​
