import { useTranslation } from 'react-i18next'
import { COLORS } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'

export default function MenuGrid({ menu, cart, onAdd }) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const regular   = menu.filter(i => i.category === 'regular')
  const extras    = menu.filter(i => i.category === 'extras')
  const beverages = menu.filter(i => i.category === 'beverages')

  return (
    <div>
      {regular.length > 0 && (
        <>
          <div style={styles.catLabel}>
            {lang === 'mr' ? 'जेवण' : 'Meals'}
          </div>
          <div style={styles.grid}>
            {regular.map(item => (
              <MenuTile key={item.id} item={item} cart={cart} onAdd={onAdd} lang={lang} />
            ))}
          </div>
        </>
      )}

      {extras.length > 0 && (
        <>
          <div style={{ ...styles.catLabel, color: COLORS.primary, borderLeft: `3px solid ${COLORS.primary}`, paddingLeft: 6 }}>
            {lang === 'mr' ? 'अतिरिक्त / Extra' : 'Extras / Add-ons'}
          </div>
          <div style={styles.grid}>
            {extras.map(item => (
              <MenuTile key={item.id} item={item} cart={cart} onAdd={onAdd} lang={lang} accent={COLORS.primary} />
            ))}
          </div>
        </>
      )}

      {beverages.length > 0 && (
        <>
          <div style={{ ...styles.catLabel, color: COLORS.blue, borderLeft: `3px solid ${COLORS.blue}`, paddingLeft: 6 }}>
            {lang === 'mr' ? 'पेय पदार्थ व पाणी' : 'Beverages & Water'}
          </div>
          <div style={styles.grid}>
            {beverages.map(item => (
              <MenuTile key={item.id} item={item} cart={cart} onAdd={onAdd} lang={lang} accent={COLORS.blue} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MenuTile({ item, cart, onAdd, lang, accent }) {
  const inCart   = cart.find(c => c.id === item.id)
  const color    = accent || COLORS.teal
  const lightBg  = accent === COLORS.blue ? '#E6F1FB' : accent === COLORS.primary ? COLORS.primaryLight : COLORS.tealLight

  return (
    <div
      onClick={() => onAdd(item)}
      style={{
        ...styles.tile,
        borderColor: inCart ? color : COLORS.border,
        background:  inCart ? lightBg : COLORS.white,
      }}
    >
      {inCart && (
        <div style={{ ...styles.badge, background: color }}>
          {inCart.quantity}
        </div>
      )}
      <div style={styles.name}>
        {lang === 'mr' ? item.name_mr : item.name_en}
      </div>
      <div style={{ ...styles.price, color }}>
        {formatCurrency(item.price)}
      </div>
    </div>
  )
}

const styles = {
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap:                 8,
    marginBottom:        10,
  },
  catLabel: {
    fontSize:      11,
    fontWeight:    700,
    color:         '#888',
    letterSpacing: '0.05em',
    marginBottom:  6,
    marginTop:     8,
    textTransform: 'uppercase',
  },
  tile: {
    borderRadius:   12,
    border:         '1.5px solid',
    padding:        '11px 6px',
    textAlign:      'center',
    cursor:         'pointer',
    position:       'relative',
    transition:     'all 0.1s',
    minHeight:      68,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
  },
  badge: {
    position:       'absolute',
    top:            -7,
    right:          -7,
    width:          22,
    height:         22,
    borderRadius:   '50%',
    color:          '#fff',
    fontSize:       11,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontWeight:     700,
  },
  name: {
    fontSize:   13,
    fontWeight: 600,
    lineHeight: 1.3,
    color:      '#1a1a1a',
  },
  price: {
    fontSize:   13,
    marginTop:  5,
    fontWeight: 700,
  },
}