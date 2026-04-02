import { useState } from 'react'

export default function PinPad({ onSuccess, onCancel, title = 'Enter PIN' }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleDigit = (digit) => {
    if (pin.length >= 4) return
    const newPin = pin + digit
    setPin(newPin)
    if (newPin.length === 4) {
      if (onSuccess(newPin)) {
        setError(false)
      } else {
        setError(true)
        setTimeout(() => { setPin(''); setError(false) }, 1000)
      }
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
    setError(false)
  }

  return (
    <div style={styles.pinContainer}>
      <div style={styles.pinCard}>
        <div style={styles.pinEmoji}>🔐</div>
        <div style={styles.pinTitle}>{title}</div>
        <div style={styles.pinSub}>Enter 4-digit PIN</div>

        <div style={styles.pinDots}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              ...styles.pinDot,
              background: pin.length > i ? '#D85A30' : '#fff',
              borderColor: error ? '#E24B4A' : '#ddd'
            }} />
          ))}
        </div>

        {error && <div style={styles.pinError}>Wrong PIN</div>}

        <div style={styles.pinGrid}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
            <button key={i} onClick={() => {
              if (d === '⌫') handleBackspace()
              else if (d !== '') handleDigit(String(d))
            }} style={{
              ...styles.pinBtn,
              visibility: d === '' ? 'hidden' : 'visible'
            }}>
              {d}
            </button>
          ))}
        </div>
        {onCancel && <a href="/" style={styles.backLink}>← Back to Staff Screen</a>}
      </div>
    </div>
  )
}

const styles = {
  pinContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9f7f4',
    fontFamily: 'sans-serif',
  },
  pinCard: {
    background: '#fff',
    borderRadius: 20,
    padding: 32,
    width: 280,
    textAlign: 'center',
    border: '1px solid #eee',
  },
  pinEmoji: { fontSize: 32, marginBottom: 8 },
  pinTitle: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  pinSub: { fontSize: 13, color: '#888', marginBottom: 24 },
  pinDots: { display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24 },
  pinDot: {
    width: 44, height: 44, borderRadius: 10,
    border: '2px solid #ddd', background: '#fff',
  },
  pinError: { color: '#E24B4A', fontSize: 13, marginBottom: 12 },
  pinGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
  },
  pinBtn: {
    padding: '14px 0', borderRadius: 10, fontSize: 18, fontWeight: 600,
    border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer',
  },
  backLink: {
    display: 'block', marginTop: 20, color: '#888', fontSize: 13, textDecoration: 'none',
  },
}