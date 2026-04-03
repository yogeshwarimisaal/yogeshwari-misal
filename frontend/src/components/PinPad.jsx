import { useState } from 'react'
import { COLORS, ADMIN_PIN } from '../utils/constants'

export default function PinPad({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function handleDigit(digit) {
    if (pin.length >= 4) return
    const newPin = pin + digit
    setPin(newPin)
    if (newPin.length === 4) {
      if (newPin === ADMIN_PIN) {
        setTimeout(() => onUnlock(), 200)
      } else {
        setError(true)
        setTimeout(() => { setPin(''); setError(false) }, 1000)
      }
    }
  }

  function handleDelete() {
    setPin(p => p.slice(0, -1))
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.icon}>🔐</div>
        <div style={styles.title}>Admin Login</div>
        <div style={styles.subtitle}>Enter 4-digit PIN</div>

        <div style={styles.dots}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              ...styles.dot,
              background: pin.length > i
                ? (error ? '#E24B4A' : COLORS.primary)
                : '#e8e8e8',
              transform: pin.length > i ? 'scale(1.2)' : 'scale(1)',
            }} />
          ))}
        </div>

        {error && (
          <div style={styles.errorMsg}>Wrong PIN. Try again.</div>
        )}

        <div style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d, i) => (
            <button
              key={i}
              onClick={() => {
                if (d === '⌫') handleDelete()
                else if (d !== '') handleDigit(String(d))
              }}
              style={{
                ...styles.key,
                visibility: d === '' ? 'hidden' : 'visible',
                color: d === '⌫' ? COLORS.primary : '#1a1a1a',
                fontWeight: d === '⌫' ? 700 : 600,
              }}
            >
              {d}
            </button>
          ))}
        </div>

        <a href="/" style={styles.backLink}>← Back to Staff Screen</a>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9f7f4',
    fontFamily: 'sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '32px 28px',
    width: 300,
    textAlign: 'center',
    border: '1px solid #eee',
  },
  icon: { fontSize: 36, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 24 },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 8,
  },
  dot: {
    width: 14, height: 14,
    borderRadius: '50%',
    transition: 'all 0.15s',
  },
  errorMsg: {
    color: '#E24B4A',
    fontSize: 13,
    marginBottom: 8,
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    margin: '20px 0',
  },
  key: {
    padding: '16px 0',
    borderRadius: 12,
    border: '1px solid #eee',
    background: '#fff',
    fontSize: 20,
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  backLink: {
    display: 'block',
    marginTop: 8,
    color: '#aaa',
    fontSize: 13,
    textDecoration: 'none',
  },
}