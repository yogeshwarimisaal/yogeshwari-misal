import { useTranslation } from 'react-i18next'
import { COLORS } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'

export default function MenuGrid({ menu, cart, onAdd }) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  return (
    <div style={styles.grid}>
      {menu.map(item => {
        const inCart = cart.find(c => c.id === item.id)
        return (
          <div
            key={item.id}
            onClick={() => onAdd(item)}
            style={{
              ...styles.tile,
              borderColor: inCart ? COLORS.primary : COLORS.border,
              background: inCart ? COLORS.primaryLight : COLORS.white,
            }}
          >
            {inCart && (
              <div style={styles.badge}>{inCart.quantity}</div>
            )}
            <div style={styles.name}>
              {lang === 'mr' ? item.name_mr : item.name_en}
            </div>
            <div style={styles.price}>
              {formatCurrency(item.price)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
    gap: 8,
  },
  tile: {
    borderRadius: 12,
    border: '1.5px solid',
    padding: '10px 6px',
    textAlign: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.1s',
  },
  badge: {
    position: 'absolute',
    top: -6, right: -6,
    width: 18, height: 18,
    borderRadius: '50%',
    background: COLORS.primary,
    color: '#fff',
    fontSize: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
  },
  name: {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.3,
    color: COLORS.textDark,
  },
  price: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: 600,
  },
}