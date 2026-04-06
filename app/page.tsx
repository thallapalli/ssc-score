'use client';

import React, { useState } from 'react';

export default function SSCScoreApp() {
  const UNIT_VALUE = 20;

  const [roster, setRoster] = useState(['KT', 'Chaitanya', 'Prasad', 'Guru', 'Arveen', 'Mallela']);
  const [activeMembers, setActiveMembers] = useState([]);
  const [isSessionLive, setIsSessionLive] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [tempName, setTempName] = useState('');

  const joinSession = (name) => {
    if (!activeMembers.find((m) => m.name === name)) {
      setActiveMembers([...activeMembers, { name: name, units: 1, final: 0 }]);
    }
    setShowPicker(false);
  };

  const addCustomMember = () => {
    if (tempName.trim()) {
      setRoster([...roster, tempName.trim()]);
      joinSession(tempName.trim());
      setTempName('');
    }
  };

  const adjustUnits = (index, delta) => {
    const updated = [...activeMembers];
    updated[index].units = Math.max(1, updated[index].units + delta);
    setActiveMembers(updated);
  };

  const getNet = (m) => m.final - (m.units * UNIT_VALUE);

  const shareSummary = () => {
    const data = activeMembers.map((m) => {
      const net = getNet(m);
      return `${m.name}: ${net >= 0 ? '+' : ''}${net}`;
    }).join('\n');
    const text = `📊 *SSC SCORE SUMMARY* 📊\n\n${data}\n\n_System: SSC Analytics_`;
    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const styles = {
    bg: { backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e5e7eb', padding: '24px', fontFamily: 'sans-serif' },
    card: { backgroundColor: '#171717', padding: '16px', borderRadius: '12px', border: '1px solid #262626', marginBottom: '12px' },
    header: { color: '#ffffff', fontSize: '24px', fontWeight: '900', textAlign: 'center', marginBottom: '4px' },
    sub: { fontSize: '10px', color: '#737373', textAlign: 'center', marginBottom: '32px', letterSpacing: '2px' },
    btn: { backgroundColor: '#ffffff', color: '#000000', padding: '16px', borderRadius: '12px', fontWeight: '800', border: 'none', width: '100%', cursor: 'pointer' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', background: '#000', border: '1px solid #404040', color: '#fff', marginTop: '10px', boxSizing: 'border-box' }
  };

  return (
    <div style={styles.bg}>
      <header>
        <h1 style={styles.header}>SSC SCORE</h1>
        <p style={styles.sub}>DATA MANAGEMENT SYSTEM</p>
      </header>

      {!isSessionLive ? (
        <div style={{ marginTop: '100px' }}>
          <button onClick={() => { setIsSessionLive(true); setShowPicker(true); }} style={styles.btn}>
            INITIALIZE SESSION
          </button>
        </div>
      ) : (
        <div style={{ paddingBottom: '100px' }}>
          {activeMembers.map((m, i) => (
            <div key={i} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{m.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#262626', padding: '5px 10px', borderRadius: '8px' }}>
                  <button onClick={() => adjustUnits(i, -1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px' }}>-</button>
                  <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>{m.units}</span>
                  <button onClick={() => adjustUnits(i, 1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px' }}>+</button>
                </div>
              </div>
              <input 
                type="number" 
                placeholder="Final Value" 
                style={styles.input}
                onChange={(e) => {
                  const updated = [...activeMembers];
                  updated[i].final = Number(e.target.value);
                  setActiveMembers(updated);
                }}
              />
              <div style={{ textAlign: 'right', marginTop: '12px', fontWeight: '900', color: getNet(m) >= 0 ? '#4ade80' : '#f87171' }}>
                NET: {getNet(m) >= 0 ? `+${getNet(m)}` : `${getNet(m)}`}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => setShowPicker(true)} style={{ ...styles.btn, backgroundColor: '#262626', color: '#fff' }}>+ ADD</button>
            <button onClick={shareSummary} style={{ ...styles.btn, backgroundColor: '#166534', color: '#fff' }}>SHARE</button>
          </div>
        </div>
      )}

      {showPicker && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#171717', padding: '24px', borderTop: '2px solid #404040', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Select Member</h3>
            <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', color: '#737373' }}>DONE</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {roster.map((r) => (
              <button key={r} onClick={() => joinSession(r)} style={{ padding: '10px 15px', background: '#262626', color: '#fff', border: '1px solid #404040', borderRadius: '8px' }}>{r}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
