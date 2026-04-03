import { COLORS } from '../utils/constants'

export default function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      ...styles.card,
      borderLeft: `4px solid ${accent || COLORS.primary}`,
    }}>
      <div style={styles.label}>{label}</div>
      <div style={{ ...styles.value, color: accent || COLORS.primary }}>
        {value}
      </div>
      {sub && <div style={styles.sub}>{sub}</div>}
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '14px 16px',
    border: '1px solid #eee',
  },
  label: {
    fontSize: 11,
    color: '#888',
    fontWeight: 600,
    letterSpacing: '0.04em',
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  sub: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
  },
}