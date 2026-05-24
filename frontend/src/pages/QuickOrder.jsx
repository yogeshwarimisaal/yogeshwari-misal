import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { useMenu } from '../hooks/useMenu'
import { supabase } from '../api/supabase'
import { COLORS } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'

const ZOMATO_RED = '#E23744'
const ZOMATO_LIGHT = '#fce8ea'

export default function QuickOrder() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const t = (mr, en) => lang === 'mr' ? mr : en
  const { menu, loading } = useMenu()

  const [cart,        setCart]        = useState([])
  const [orderType,   setOrderType]   = useState('table')
  const [tableNumber, setTableNumber] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [lastOrder,   setLastOrder]   = useState(null)

  const regular   = menu.filter(i => i.category === 'regular')
  const extras    = menu.filter(i => i.category === 'extras')
  const beverages = menu.filter(i => i.category === 'beverages')

  function addItem(item) {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id)
      if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function removeItem(id) {
    setCart(prev => {
      const ex = prev.find(i => i.id === id)
      if (!ex) return prev
      if (ex.qty === 1) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
    })
  }

  function getTotal() {
    return cart.reduce((s, i) => s + i.price * i.qty, 0)
  }

  async function completeOrder(paymentMode) {
    if (cart.length === 0) {
      toast.error(t('आयटम निवडा', 'Select items first'))
      return
    }
    if (orderType === 'table' && !tableNumber) {
      toast.error(t('टेबल नंबर टाका', 'Enter table number'))
      return
    }

    setSaving(true)
    try {
      const total = getTotal()

      const { data: order, error: oe } = await supabase
        .from('orders')
        .insert({
          order_type:   orderType,
          table_number: orderType === 'table' ? tableNumber : null,
          status:       'completed',
          payment_mode: paymentMode,
          total_amount: total,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (oe) throw oe

      const { error: ie } = await supabase
        .from('order_items')
        .insert(cart.map(item => ({
          order_id:     order.id,
          menu_item_id: item.id,
          quantity:     item.qty,
          unit_price:   item.price,
        })))

      if (ie) throw ie

      setLastOrder({ ...order, items: [...cart], total })
      setCart([])
      setTableNumber('')

      if (paymentMode === 'zomato') {
        toast.success(
          t('Zomato ऑर्डर नोंदवली! पेमेंट ४-५ दिवसात येईल', 'Zomato order saved! Payment in 4-5 days'),
          { duration: 4000, style: { background: ZOMATO_LIGHT, color: '#c0392b' } }
        )
      } else {
        toast.success(
          t('ऑर्डर पूर्ण!', 'Order complete!'),
          { style: { background: COLORS.tealLight, color: COLORS.tealDark } }
        )
      }
    } catch (e) {
      toast.error('Error: ' + e.message)
    }
    setSaving(false)
  }

  if (loading) {
    return <div style={s.centered}>{t('लोड होत आहे...', 'Loading...')}</div>
  }

  return (
    <div style={s.container}>
      <Toaster position="top-center" />

      <div style={s.header}>
        <div>
          <div style={s.title}>
            {lang === 'mr' ? 'योगेश्वरी मिसळ' : 'Yogeshwari Misal'}
          </div>
          <div style={s.sub}>{t('झटपट ऑर्डर', 'Quick Order')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={s.langBtn}
            onClick={() => i18n.changeLanguage(lang === 'mr' ? 'en' : 'mr')}
          >
            {lang === 'mr' ? 'EN' : 'मराठी'}
          </button>
          <a href="/pos"   style={s.navBtn}>{t('टेबल', 'Tables')}</a>
          <a href="/admin" style={s.navBtn}>{t('अॅडमिन', 'Admin')}</a>
        </div>
      </div>

      <div style={s.typeBar}>
        {[
          { id: 'table',  labelMr: '🪑 टेबल',   labelEn: '🪑 Table',  color: COLORS.primary },
          { id: 'parcel', labelMr: '📦 पार्सल', labelEn: '📦 Parcel', color: COLORS.teal    },
          { id: 'zomato', labelMr: '🛵 झोमॅटो', labelEn: '🛵 Zomato', color: ZOMATO_RED     },
        ].map(ot => (
          <button
            key={ot.id}
            onClick={() => { setOrderType(ot.id); setTableNumber('') }}
            style={{
              ...s.typeBtn,
              background:  orderType === ot.id ? ot.color : '#f0f0f0',
              color:       orderType === ot.id ? '#fff'   : '#555',
              borderColor: orderType === ot.id ? ot.color : '#e0e0e0',
            }}
          >
            {lang === 'mr' ? ot.labelMr : ot.labelEn}
          </button>
        ))}

        {orderType === 'table' && (
          <input
            type="number"
            placeholder={t('टेबल नं.', 'Table No.')}
            value={tableNumber}
            onChange={e => setTableNumber(e.target.value)}
            style={s.tableInput}
          />
        )}
      </div>

      {orderType === 'zomato' && (
        <div style={s.zomatoBanner}>
          🛵 {t(
            'Zomato ऑर्डर — पेमेंट ४-५ बिझनेस दिवसांत Zomato कडून येईल',
            'Zomato Order — Payment arrives from Zomato in 4-5 business days'
          )}
        </div>
      )}

      <div style={s.menuSection}>
        {regular.length > 0 && (
          <>
            <div style={s.catLabel}>{t('जेवण', 'Meals')}</div>
            <div style={s.grid}>
              {regular.map(item => (
                <Tile
                  key={item.id} item={item} cart={cart}
                  onAdd={addItem} lang={lang}
                  color={COLORS.primary}
                />
              ))}
            </div>
          </>
        )}

        {extras.length > 0 && (
          <>
            <div style={{ ...s.catLabel, color: COLORS.primary }}>
              {t('अतिरिक्त', 'Extras')}
            </div>
            <div style={s.grid}>
              {extras.map(item => (
                <Tile
                  key={item.id} item={item} cart={cart}
                  onAdd={addItem} lang={lang}
                  color={COLORS.primary}
                />
              ))}
            </div>
          </>
        )}

        {beverages.length > 0 && (
          <>
            <div style={{ ...s.catLabel, color: COLORS.blue }}>
              {t('पेय व पाणी', 'Beverages & Water')}
            </div>
            <div style={s.grid}>
              {beverages.map(item => (
                <Tile
                  key={item.id} item={item} cart={cart}
                  onAdd={addItem} lang={lang}
                  color={COLORS.blue}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div style={s.cartBar}>
          <div style={s.cartList}>
            {cart.map(item => (
              <div key={item.id} style={s.cartRow}>
                <span style={s.cartName}>
                  {lang === 'mr' ? item.name_mr : item.name_en}
                </span>
                <div style={s.qRow}>
                  <button style={s.qBtn} onClick={() => removeItem(item.id)}>−</button>
                  <span style={s.qNum}>{item.qty}</span>
                  <button style={s.qBtn} onClick={() => addItem(item)}>+</button>
                </div>
                <span style={s.cartAmt}>₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>

          <div style={s.totalRow}>
            <span style={s.totalLabel}>{t('एकूण', 'Total')}</span>
            <span style={s.totalVal}>₹{getTotal()}</span>
          </div>

          {orderType === 'zomato' ? (
            <button
              onClick={() => completeOrder('zomato')}
              disabled={saving}
              style={{ ...s.zomatoPayBtn, opacity: saving ? 0.7 : 1 }}
            >
              {saving
                ? t('सेव्ह होत आहे...', 'Saving...')
                : `🛵 Zomato Order — ₹${getTotal()}`}
            </button>
          ) : (
            <div style={s.payBtns}>
              <button
                onClick={() => completeOrder('cash')}
                disabled={saving}
                style={{ ...s.cashBtn, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? '...' : `₹${getTotal()} ${t('रोख', 'Cash')}`}
              </button>
              <button
                onClick={() => completeOrder('online')}
                disabled={saving}
                style={{ ...s.onlineBtn, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? '...' : `₹${getTotal()} UPI`}
              </button>
            </div>
          )}

          <button onClick={() => setCart([])} style={s.clearBtn}>
            {t('साफ करा', 'Clear')}
          </button>
        </div>
      )}

      {lastOrder && (
        <div style={{
          ...s.lastOrderBanner,
          background: lastOrder.payment_mode === 'zomato' ? ZOMATO_LIGHT  : COLORS.tealLight,
          color:      lastOrder.payment_mode === 'zomato' ? '#c0392b'      : COLORS.tealDark,
          border:     `1px solid ${lastOrder.payment_mode === 'zomato' ? ZOMATO_RED : COLORS.teal}`,
        }}>
          {lastOrder.payment_mode === 'zomato' ? '🛵' : '✅'}
          {' '}{t('शेवटची', 'Last')} #{lastOrder.order_number} — ₹{lastOrder.total}
          {' — '}
          {lastOrder.payment_mode === 'zomato'
            ? t('Zomato (पेमेंट प्रलंबित)', 'Zomato (payment pending)')
            : lastOrder.payment_mode === 'cash'
              ? t('रोख', 'Cash')
              : 'UPI'}
        </div>
      )}
    </div>
  )
}

function Tile({ item, cart, onAdd, lang, color }) {
  const inCart = cart.find(c => c.id === item.id)
  const lightBg = color === COLORS.blue ? '#E6F1FB' : COLORS.primaryLight
  return (
    <div
      onClick={() => onAdd(item)}
      style={{
        ...ts.tile,
        borderColor: inCart ? color : '#e0e0e0',
        background:  inCart ? lightBg : '#fff',
      }}
    >
      {inCart && (
        <div style={{ ...ts.badge, background: color }}>{inCart.qty}</div>
      )}
      <div style={ts.name}>
        {lang === 'mr' ? item.name_mr : item.name_en}
      </div>
      <div style={{ ...ts.price, color }}>
        {formatCurrency(item.price)}
      </div>
    </div>
  )
}

const ts = {
  tile: {
    borderRadius:   12,
    border:         '1.5px solid',
    padding:        '11px 6px',
    textAlign:      'center',
    cursor:         'pointer',
    position:       'relative',
    minHeight:      68,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    transition:     'all 0.1s',
  },
  badge: {
    position:       'absolute',
    top:            -7,
    right:          -7,
    width:          22,
    height:         22,
    borderRadius:   '50%',
    color:          '#fff',
    fontSize:       12,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontWeight:     700,
  },
  name:  { fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: '#1a1a1a' },
  price: { fontSize: 13, marginTop: 5, fontWeight: 700 },
}

const s = {
  container: {
    minHeight:   '100vh',
    background:  COLORS.bg,
    fontFamily:  'sans-serif',
    paddingBottom: 20,
  },
  centered: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    height:         '100vh',
    color:          '#888',
  },
  header: {
    background:     COLORS.primary,
    padding:        '12px 14px',
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  title:   { color: '#fff', fontSize: 17, fontWeight: 700 },
  sub:     { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
  langBtn: {
    background:   'rgba(255,255,255,0.2)',
    border:       'none',
    color:        '#fff',
    padding:      '5px 12px',
    borderRadius: 20,
    fontSize:     12,
    cursor:       'pointer',
  },
  navBtn: {
    background:     'rgba(255,255,255,0.15)',
    border:         '1px solid rgba(255,255,255,0.4)',
    padding:        '5px 12px',
    borderRadius:   20,
    color:          '#fff',
    textDecoration: 'none',
    fontSize:       12,
  },
  typeBar: {
    display:       'flex',
    gap:           8,
    padding:       '10px 12px',
    background:    '#fff',
    borderBottom:  '1px solid #eee',
    alignItems:    'center',
    flexWrap:      'wrap',
  },
  typeBtn: {
    padding:      '8px 16px',
    borderRadius: 20,
    border:       '2px solid',
    cursor:       'pointer',
    fontSize:     13,
    fontWeight:   600,
    transition:   'all 0.15s',
  },
  tableInput: {
    padding:      '8px 12px',
    borderRadius: 20,
    border:       '1px solid #ddd',
    width:        100,
    fontSize:     14,
  },
  zomatoBanner: {
    background:  ZOMATO_LIGHT,
    color:       '#c0392b',
    padding:     '8px 14px',
    fontSize:    12,
    fontWeight:  600,
    borderBottom:'1px solid #f5c0c4',
  },
  menuSection: { padding: '10px 12px' },
  catLabel: {
    fontSize:      11,
    fontWeight:    700,
    color:         '#888',
    letterSpacing: '0.05em',
    marginBottom:  8,
    marginTop:     10,
    textTransform: 'uppercase',
  },
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap:                 8,
    marginBottom:        6,
  },
  cartBar: {
    position:    'sticky',
    bottom:      0,
    background:  '#fff',
    borderTop:   '2px solid #eee',
    padding:     '10px 12px',
    zIndex:      100,
  },
  cartList:    { marginBottom: 8 },
  cartRow: {
    display:       'flex',
    alignItems:    'center',
    gap:           8,
    padding:       '5px 0',
    borderBottom:  '0.5px solid #f0f0f0',
  },
  cartName:    { flex: 1, fontSize: 13, color: '#1a1a1a' },
  qRow:        { display: 'flex', alignItems: 'center', gap: 6 },
  qBtn: {
    width:          26,
    height:         26,
    borderRadius:   8,
    border:         '1px solid #ddd',
    background:     '#f5f5f5',
    cursor:         'pointer',
    fontSize:       16,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  qNum:        { fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' },
  cartAmt:     { fontSize: 13, color: COLORS.primary, fontWeight: 600, minWidth: 45, textAlign: 'right' },
  totalRow: {
    display:        'flex',
    justifyContent: 'space-between',
    padding:        '7px 0 9px',
    borderTop:      '1px solid #eee',
  },
  totalLabel:  { fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  totalVal:    { fontSize: 20, fontWeight: 700, color: COLORS.primary },
  payBtns: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 8,
    marginBottom:        6,
  },
  cashBtn: {
    background:   COLORS.teal,
    color:        '#fff',
    border:       'none',
    padding:      '13px',
    borderRadius: 12,
    fontSize:     15,
    fontWeight:   700,
    cursor:       'pointer',
  },
  onlineBtn: {
    background:   COLORS.blue,
    color:        '#fff',
    border:       'none',
    padding:      '13px',
    borderRadius: 12,
    fontSize:     15,
    fontWeight:   700,
    cursor:       'pointer',
  },
  zomatoPayBtn: {
    width:        '100%',
    background:   ZOMATO_RED,
    color:        '#fff',
    border:       'none',
    padding:      '13px',
    borderRadius: 12,
    fontSize:     15,
    fontWeight:   700,
    cursor:       'pointer',
    marginBottom: 6,
  },
  clearBtn: {
    width:        '100%',
    background:   '#f5f5f5',
    color:        '#888',
    border:       'none',
    padding:      '8px',
    borderRadius: 10,
    fontSize:     13,
    cursor:       'pointer',
    marginTop:    4,
  },
  lastOrderBanner: {
    borderRadius: 10,
    padding:      '10px 14px',
    margin:       '10px 12px 0',
    fontSize:     13,
    fontWeight:   600,
  },
}