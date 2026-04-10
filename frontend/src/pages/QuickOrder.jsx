import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { useMenu } from '../hooks/useMenu'
import { supabase } from '../api/supabase'
import { COLORS } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'

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

  const regular   = menu.filter(i => i.category !== 'beverages' && !i.is_bulk)
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

  async function completeNow(paymentMode) {
    if (cart.length === 0) { toast.error(t('आयटम निवडा', 'Select items first')); return }
    if (orderType === 'table' && !tableNumber) { toast.error(t('टेबल नंबर टाका', 'Enter table number')); return }
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

      await supabase.from('order_items').insert(
        cart.map(item => ({
          order_id:     order.id,
          menu_item_id: item.id,
          quantity:     item.qty,
          unit_price:   item.price,
        }))
      )

      setLastOrder({ ...order, items: cart, total })
      setCart([])
      setTableNumber('')
      toast.success(t('ऑर्डर पूर्ण!', 'Order done!'))
    } catch (e) {
      toast.error('Error: ' + e.message)
    }
    setSaving(false)
  }

  if (loading) return <div style={s.centered}>Loading...</div>

  return (
    <div style={s.container}>
      <Toaster position="top-center" />

      <div style={s.header}>
        <div>
          <div style={s.title}>{lang === 'mr' ? 'योगेश्वरी मिसळ' : 'Yogeshwari Misal'}</div>
          <div style={s.sub}>{t('झटपट ऑर्डर', 'Quick Order')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.langBtn}
            onClick={() => i18n.changeLanguage(lang === 'mr' ? 'en' : 'mr')}>
            {lang === 'mr' ? 'EN' : 'मराठी'}
          </button>
          <a href="/" style={s.homeBtn}>{t('होम', 'Home')}</a>
        </div>
      </div>

      <div style={s.typeRow}>
        <button
          style={{ ...s.typeBtn, ...(orderType === 'table' ? s.typeActive : {}) }}
          onClick={() => setOrderType('table')}>
          {t('टेबल', 'Table')}
        </button>
        <button
          style={{ ...s.typeBtn, ...(orderType === 'parcel' ? s.typeActive : {}) }}
          onClick={() => setOrderType('parcel')}>
          {t('पार्सल', 'Parcel')}
        </button>
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

      <div style={s.menuWrap}>
        <div style={s.catLabel}>{t('खाद्यपदार्थ', 'Food')}</div>
        <div style={s.grid}>
          {regular.map(item => {
            const inCart = cart.find(c => c.id === item.id)
            return (
              <div key={item.id} style={{
                ...s.tile,
                background:  inCart ? COLORS.primaryLight : '#fff',
                borderColor: inCart ? COLORS.primary : '#e0e0e0',
              }} onClick={() => addItem(item)}>
                {inCart && <div style={s.badge}>{inCart.qty}</div>}
                <div style={s.tileName}>{lang === 'mr' ? item.name_mr : item.name_en}</div>
                <div style={s.tilePrice}>₹{item.price}</div>
              </div>
            )
          })}
        </div>

        <div style={s.catLabel}>{t('पेय पदार्थ', 'Beverages')}</div>
        <div style={s.grid}>
          {beverages.map(item => {
            const inCart = cart.find(c => c.id === item.id)
            return (
              <div key={item.id} style={{
                ...s.tile,
                background:  inCart ? '#E6F1FB' : '#fff',
                borderColor: inCart ? COLORS.blue : '#e0e0e0',
              }} onClick={() => addItem(item)}>
                {inCart && <div style={{ ...s.badge, background: COLORS.blue }}>{inCart.qty}</div>}
                <div style={s.tileName}>{lang === 'mr' ? item.name_mr : item.name_en}</div>
                <div style={{ ...s.tilePrice, color: COLORS.blue }}>₹{item.price}</div>
              </div>
            )
          })}
        </div>
      </div>

      {cart.length > 0 && (
        <div style={s.cartBar}>
          <div style={s.cartItems}>
            {cart.map(item => (
              <div key={item.id} style={s.cartRow}>
                <span style={s.cartName}>{lang === 'mr' ? item.name_mr : item.name_en}</span>
                <div style={s.qtyRow}>
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

          <div style={s.payRow}>
            <button
              onClick={() => completeNow('cash')}
              disabled={saving}
              style={s.cashBtn}>
              {saving ? '...' : `₹${getTotal()} ${t('रोख', 'Cash')}`}
            </button>
            <button
              onClick={() => completeNow('online')}
              disabled={saving}
              style={s.onlineBtn}>
              {saving ? '...' : `₹${getTotal()} ${t('UPI', 'UPI')}`}
            </button>
          </div>

          <button onClick={() => setCart([])} style={s.clearBtn}>
            {t('साफ करा', 'Clear all')}
          </button>
        </div>
      )}

      {lastOrder && (
        <div style={s.lastOrder}>
          ✅ {t('शेवटची ऑर्डर', 'Last order')} #{lastOrder.order_number} —
          ₹{lastOrder.total} — {lastOrder.payment_mode === 'cash'
            ? t('रोख', 'Cash') : 'UPI'}
        </div>
      )}
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', background: COLORS.bg, fontFamily: 'sans-serif', paddingBottom: 20 },
  centered:  { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  header:    { background: COLORS.primary, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:     { color: '#fff', fontSize: 17, fontWeight: 700 },
  sub:       { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
  langBtn:   { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer' },
  homeBtn:   { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', padding: '5px 12px', borderRadius: 20, color: '#fff', textDecoration: 'none', fontSize: 12 },
  typeRow:   { display: 'flex', gap: 8, padding: '10px 12px', background: '#fff', borderBottom: '1px solid #eee', alignItems: 'center' },
  typeBtn:   { padding: '8px 18px', borderRadius: 20, border: '1px solid #ddd', cursor: 'pointer', fontSize: 14, background: '#f5f5f5', color: '#333' },
  typeActive:{ background: COLORS.primary, color: '#fff', border: `1px solid ${COLORS.primary}` },
  tableInput:{ padding: '8px 12px', borderRadius: 20, border: '1px solid #ddd', width: 100, fontSize: 14 },
  menuWrap:  { padding: '10px 12px' },
  catLabel:  { fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.05em', marginBottom: 8, marginTop: 10, textTransform: 'uppercase' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 6 },
  tile:      { borderRadius: 12, border: '1.5px solid', padding: '12px 6px', textAlign: 'center', cursor: 'pointer', position: 'relative', minHeight: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  badge:     { position: 'absolute', top: -7, right: -7, width: 22, height: 22, borderRadius: '50%', background: COLORS.primary, color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  tileName:  { fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: '#1a1a1a' },
  tilePrice: { fontSize: 13, color: COLORS.primary, marginTop: 4, fontWeight: 700 },
  cartBar:   { position: 'sticky', bottom: 0, background: '#fff', borderTop: '2px solid #eee', padding: '10px 12px', zIndex: 100 },
  cartItems: { marginBottom: 8 },
  cartRow:   { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '0.5px solid #f0f0f0' },
  cartName:  { flex: 1, fontSize: 13, color: '#1a1a1a' },
  qtyRow:    { display: 'flex', alignItems: 'center', gap: 6 },
  qBtn:      { width: 26, height: 26, borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qNum:      { fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' },
  cartAmt:   { fontSize: 13, color: COLORS.primary, fontWeight: 600, minWidth: 45, textAlign: 'right' },
  totalRow:  { display: 'flex', justifyContent: 'space-between', padding: '6px 0 8px', borderTop: '1px solid #eee' },
  totalLabel:{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  totalVal:  { fontSize: 18, fontWeight: 700, color: COLORS.primary },
  payRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 },
  cashBtn:   { background: COLORS.teal, color: '#fff', border: 'none', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  onlineBtn: { background: COLORS.blue, color: '#fff', border: 'none', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  clearBtn:  { width: '100%', background: '#f5f5f5', color: '#888', border: 'none', padding: '8px', borderRadius: 10, fontSize: 13, cursor: 'pointer' },
  lastOrder: { background: COLORS.tealLight, color: COLORS.tealDark, padding: '10px 14px', margin: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600 },
}