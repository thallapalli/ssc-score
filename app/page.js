'use client';

import React, { useState, useEffect } from 'react';

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

  const adjustUnits = (index, delta) => {
    const updated = [...activeMembers];
    updated[index].units = Math.max(1, updated[index].units + delta);
    setActiveMembers(updated);
  };

  const getNet = (m) => (Number(m.final) || 0) - (Number(m.units) * UNIT_VALUE);

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

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e5e7eb', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#ffffff', fontSize: '24px', fontWeight: '900', margin: 0 }}>SSC SCORE</h1>
        <p style={{ fontSize: '10px', color: '#737373', letterSpacing: '2px', marginTop: '5px' }}>DATA MANAGEMENT SYSTEM</p>
      </header>

      {!isSessionLive ? (
        <div style={{ marginTop: '100px', textAlign: 'center' }}>
          <button onClick={() => { setIsSessionLive(true); setShowPicker(true); }} style={{ backgroundColor: '#ffffff', color: '#000', padding: '16px 32px', borderRadius: '12px', fontWeight: '800', border: 'none', width: '100%' }}>
            INITIALIZE SESSION
          </button>
        </div>
      ) : (
        <div style={{ paddingBottom: '100px' }}>
          {activeMembers.map((m, i) => (
            <div key={i} style={{ backgroundColor: '#171717', padding: '16px', borderRadius: '12px', border: '1px solid #262626', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{m.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#262626', padding: '5px 10px', borderRadius: '8px' }}>
                  <button onClick={() => adjustUnits(i, -1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>-</button>
                  <span style={{ fontWeight: 'bold', color: '#fbbf24', minWidth: '20px', textAlign: 'center' }}>{m.units}</span>
                  <button onClick={() => adjustUnits(i, 1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>+</button>
                </div>
              </div>
              <input 
                type="number" 
                placeholder="Final Value" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#000', border: '1px solid #404040', color: '#fff', boxSizing: 'border-box' }}
                onChange={(e) => {
                  const updated = [...activeMembers];
                  updated[i].final = e.target.value;
                  setActiveMembers(updated);
                }}
              />
              <div style={{ textAlign: 'right', marginTop: '12px', fontWeight: '900', fontSize: '18px', color: getNet(m) >= 0 ? '#4ade80' : '#f87171' }}>
                NET: {getNet(m) >= 0 ? `+${getNet(m)}` : `${getNet(m)}`}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => setShowPicker(true)} style={{ flex: 1, padding: '15px', background: '#262626', color: '#fff', border: '1px solid #404040', borderRadius: '12px', fontWeight: 'bold' }}>+ ADD</button>
            <button onClick={shareSummary} style={{ flex: 1, padding: '15px', background: '#166534', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>SHARE</button>
          </div>
        </div>
      )}

      {showPicker && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#171717', padding: '24px', borderTop: '2px solid #404040', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Select Member</h3>
            <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', color: '#737373', fontWeight: 'bold' }}>DONE</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {roster.map((r) => (
              <button key={r} onClick={() => joinSession(r)} style={{ padding: '10px 15px', background: '#262626', color: '#fff', border: '1px solid #404040', borderRadius: '8px' }}>{r}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
