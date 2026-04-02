import { useState } from 'react'

const ADMIN_PIN = '9999'

export default function AdminDashboard() {
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)

  function handlePin(digit) {
    if (pin.length >= 4) return
    const newPin = pin + digit
    setPin(newPin)
    if (newPin.length === 4) {
      if (newPin === ADMIN_PIN) {
        setUnlocked(true)
        setError(false)
      } else {
        setError(true)
        setTimeout(() => { setPin(''); setError(false) }, 1000)
      }
    }
  }

  if (unlocked) {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <div style={{
          background: '#D85A30', color: '#fff',
          padding: '14px 16px', borderRadius: 12, marginBottom: 20
        }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>योगेश्वरी मिसळ</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Admin Panel</div>
        </div>
        <p style={{ color: '#1D9E75', fontWeight: 600, fontSize: 15 }}>
          ✅ Admin access granted!
        </p>
        <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>
          🚧 Full admin dashboard coming in Steps 11–20...
        </p>
        <a href="/" style={{
          display: 'inline-block', marginTop: 16,
          background: '#1D9E75', color: '#fff',
          padding: '10px 20px', borderRadius: 10,
          textDecoration: 'none', fontSize: 14, fontWeight: 600
        }}>
          ← Back to Check-in
        </a>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f9f7f4', fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#fff', borderRadius: 20,
        padding: 32, width: 280, textAlign: 'center',
        border: '1px solid #eee'
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Admin Login</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
          Enter 4-digit PIN
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 44, height: 44, borderRadius: 10,
              border: `2px solid ${error ? '#E24B4A' : pin.length > i ? '#D85A30' : '#e0e0e0'}`,
              background: pin.length > i ? '#FAECE7' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#D85A30', fontWeight: 700,
              transition: 'all 0.15s'
            }}>
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ color: '#E24B4A', fontSize: 13, marginBottom: 12 }}>
            Wrong PIN. Try again.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
            <button key={i} onClick={() => {
              if (d === '⌫') setPin(p => p.slice(0,-1))
              else if (d !== '') handlePin(String(d))
            }} style={{
              padding: '14px 0', borderRadius: 10, fontSize: 18,
              fontWeight: 600, cursor: d === '' ? 'default' : 'pointer',
              border: '1px solid #e0e0e0',
              background: d === '' ? 'transparent' : '#fff',
              color: d === '⌫' ? '#D85A30' : '#1a1a1a',
              visibility: d === '' ? 'hidden' : 'visible'
            }}>
              {d}
            </button>
          ))}
        </div>

        <a href="/" style={{
          display: 'block', marginTop: 20,
          color: '#888', fontSize: 13, textDecoration: 'none'
        }}>
          ← Back to Staff Screen
        </a>
      </div>
    </div>
  )
}