'use client';
import { useState } from 'react';

export default function SSCScoreApp() {
  // Config
  const UNIT_VALUE = 20; 

  // State Management
  const [roster, setRoster] = useState(['KT', 'Chaitanya', 'Prasad', 'Guru', 'Arveen', 'Mallela']); 
  const [activeMembers, setActiveMembers] = useState([]);
  const [isSessionLive, setIsSessionLive] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [tempName, setTempName] = useState('');

  // Business Logic
  const joinSession = (name) => {
    if (!activeMembers.find(m => m.name === name)) {
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
    const data = activeMembers.map(m => {
      const net = getNet(m);
      return `${m.name}: ${net >= 0 ? '+' : ''}${net}`;
    }).join('\n');
    const text = `📊 *SSC SCORE SUMMARY* 📊\n\n${data}\n\n_System: SSC Analytics_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Mobile-Optimized Inline Styles
  const styles = {
    bg: { backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e5e7eb', padding: '24px', fontFamily: 'system-ui, sans-serif' },
    card: { backgroundColor: '#171717', padding: '16px', borderRadius: '12px', border: '1px solid #262626', marginBottom: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
    header: { color: '#ffffff', fontSize: '24px', fontWeight: '900', letterSpacing: '1px', textAlign: 'center', marginBottom: '4px' },
    subHeader: { fontSize: '10px', color: '#737373', textAlign: 'center', marginBottom: '32px', letterSpacing: '3px', fontWeight: 'bold' },
    btnMain: { backgroundColor: '#ffffff', color: '#000000', padding: '16px', borderRadius: '12px', fontWeight: '800', border: 'none', width: '100%', cursor: 'pointer', fontSize: '14px' },
    btnGhost: { backgroundColor: '#262626', color: '#ffffff', padding: '12px', borderRadius: '8px', fontWeight: '600', border: '1px solid #404040', width: '100%' },
    btnSuccess: { backgroundColor: '#166534', color: '#ffffff', padding: '12px', borderRadius: '8px', fontWeight: '600', border: 'none', width: '100%' },
    input: { width: '100%', padding: '14px', borderRadius: '8px', background: '#000000', border: '1px solid #404040', color: '#ffffff', marginTop: '10px', outline: 'none', fontSize: '16px', boxSizing: 'border-box' },
    unitBox: { display: 'flex', alignItems: 'center', gap: '16px', background: '#262626', padding: '6px 12px', borderRadius: '8px' }
  };

  return (
    <div style={styles.bg}>
      <header>
        <h1 style={styles.header}>SSC SCORE</h1>
        <p style={styles.subHeader}>DATA MANAGEMENT SYSTEM</p>
      </header>

      {!isSessionLive ? (
        <div style={{ marginTop: '100px', textAlign: 'center' }}>
          <button onClick={() => {setIsSessionLive(true); setShowPicker(true);}} style={styles.btnMain}>
            INITIALIZE NEW SESSION
          </button>
        </div>
      ) : (
        <div style={{ paddingBottom: '100px' }}>
          {activeMembers.map((m, i) => (
            <div key={i} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: '700', fontSize: '18px', color: '#fff' }}>{m.name}</span>
                <div style={styles.unitBox}>
                  <button onClick={() => adjustUnits(i, -1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', padding: '0 10px' }}>-</button>
                  <span style={{ fontWeight: '800', minWidth: '20px', textAlign: 'center', color: '#fbbf24' }}>{m.units}</span>
                  <button onClick={() => adjustUnits(i, 1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', padding: '0 10px' }}>+</button>
                </div>
              </div>
              
              <input 
                type="number" 
                inputMode="numeric"
                placeholder="Final Value" 
                style={styles.input} 
                onChange={(e) => {
                  const updated = [...activeMembers];
                  updated[i].final = Number(e.target.value);
                  setActiveMembers(updated);
                }}
              />
              
              <div style={{ textAlign: 'right', marginTop: '14px', fontSize: '18px', fontWeight: '900', color: getNet(m) >= 0 ? '#4ade80' : '#f87171' }}>
                NET: {getNet(m) >= 0 ? `+${getNet(m)}` : `${getNet(m)}`}
              </div>
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '30px' }}>
            <button onClick={() => setShowPicker(true)} style={styles.btnGhost}>+ ADD ENTRY</button>
            <button onClick={shareSummary} style={styles.btnSuccess}>SHARE DATA</button>
          </div>
          
          <button 
            onClick={() => {if(confirm('Archive current session?')) setIsSessionLive(false)}} 
            style={{ ...styles.btnGhost, marginTop: '12px', borderColor: '#7f1d1d', color: '#f87171' }}
          >
            CLOSE SESSION
          </button>
        </div>
      )}

      {/* Roster Bottom Sheet */}
      {showPicker && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#171717', padding: '24px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 100, borderTop: '2px solid #404040', boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
             <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>System Roster</h3>
             <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', color: '#737373', fontWeight: 'bold' }}>DONE</button>
           </div>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
             {roster.map(r => (
               <button key={r} onClick={() => joinSession(r)} style={{ padding: '12px 18px', background: '#262626', border: '1px solid #404040', color: '#fff', borderRadius: '10px', fontSize: '14px' }}>{r}</button>
             ))}
           </div>
           <div style={{ borderTop: '1px solid #262626', paddingTop: '20px' }}>
             <input 
               type="text" 
               placeholder="Enter New Identity" 
               value={tempName}
               onChange={(e) => setTempName(e.target.value)}
               style={styles.input} 
             />
             <button onClick={addCustomMember} style={{ ...styles.btnMain, marginTop: '12px' }}>REGISTER NEW ENTRY</button>
           </div>
        </div>
      )}
    </div>
  );
}
