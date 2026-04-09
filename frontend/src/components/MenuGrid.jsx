import { useTranslation } from 'react-i18next'
import { COLORS } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'

export default function MenuGrid({ menu, cart, onAdd }) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const regular   = menu.filter(i => i.category !== 'beverages' && !i.is_bulk)
  const beverages = menu.filter(i => i.category === 'beverages')

  return (
    <div>
      {regular.length > 0 && (
        <>
          <div style={styles.catLabel}>
            {lang === 'mr' ? 'खाद्यपदार्थ' : 'Food Items'}
          </div>
          <div style={styles.grid}>
            {regular.map(item => <MenuTile key={item.id} item={item} cart={cart} onAdd={onAdd} lang={lang} />)}
          </div>
        </>
      )}
      {beverages.length > 0 && (
        <>
          <div style={styles.catLabel}>
            {lang === 'mr' ? 'पेय पदार्थ' : 'Beverages'}
          </div>
          <div style={styles.grid}>
            {beverages.map(item => <MenuTile key={item.id} item={item} cart={cart} onAdd={onAdd} lang={lang} />)}
          </div>
        </>
      )}
    </div>
  )
}

function MenuTile({ item, cart, onAdd, lang }) {
  const inCart = cart.find(c => c.id === item.id)
  return (
    <div
      onClick={() => onAdd(item)}
      style={{
        ...styles.tile,
        borderColor: inCart ? COLORS.primary : COLORS.border,
        background:  inCart ? COLORS.primaryLight : COLORS.white,
      }}
    >
      {inCart && <div style={styles.badge}>{inCart.quantity}</div>}
      <div style={styles.name}>
        {lang === 'mr' ? item.name_mr : item.name_en}
      </div>
      <div style={styles.price}>{formatCurrency(item.price)}</div>
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
    gap: 8,
    marginBottom: 10,
  },
  catLabel: {
    fontSize: 11, fontWeight: 700, color: '#888',
    letterSpacing: '0.05em', marginBottom: 6, marginTop: 4,
    textTransform: 'uppercase',
  },
  tile: {
    borderRadius: 12, border: '1.5px solid',
    padding: '12px 8px', textAlign: 'center',
    cursor: 'pointer', position: 'relative',
    transition: 'all 0.1s',
    minHeight: 72,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: '50%',
    background: COLORS.primary, color: '#fff',
    fontSize: 11, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontWeight: 700,
  },
  name: {
    fontSize: 14, fontWeight: 600,
    lineHeight: 1.3, color: '#1a1a1a',
  },
  price: {
    fontSize: 13, color: COLORS.primary,
    marginTop: 5, fontWeight: 700,
  },
}