import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import Header from '../components/Header'
import MenuGrid from '../components/MenuGrid'
import CartPanel from '../components/CartPanel'
import { useMenu } from '../hooks/useMenu'
import { useOrders } from '../hooks/useOrders'
import { COLORS } from '../utils/constants'

export default function StaffPOS() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const t = (mr, en) => lang === 'mr' ? mr : en

  const { menu, loading }                                              = useMenu()
  const { orders, createOrder, updateOrder, completeOrder, cancelOrder } = useOrders()

  const [cart,           setCart]           = useState([])
  const [orderType,      setOrderType]      = useState('table')
  const [tableNumber,    setTableNumber]    = useState('')
  const [activeOrderId,  setActiveOrderId]  = useState(null)
  const [editingOrderId, setEditingOrderId] = useState(null)

  function addToCart(item) {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  function removeFromCart(itemId) {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId)
      if (!existing) return prev
      if (existing.quantity === 1) return prev.filter(i => i.id !== itemId)
      return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }

  function resetForm() {
    setCart([])
    setOrderType('table')
    setTableNumber('')
    setEditingOrderId(null)
    setActiveOrderId(null)
  }

  function startEdit(order) {
    setEditingOrderId(order.id)
    setActiveOrderId(null)
    setOrderType(order.order_type)
    setTableNumber(order.table_number || '')
    setCart(order.order_items.map(oi => ({
      id:      oi.menu_item.id,
      name_en: oi.menu_item.name_en,
      name_mr: oi.menu_item.name_mr,
      price:   oi.menu_item.price,
      quantity: oi.quantity,
    })))
  }

  async function handleCreate() {
    if (cart.length === 0) { toast.error(t('आयटम जोडा', 'Add items first')); return }
    if (orderType === 'table' && !tableNumber) { toast.error(t('टेबल नंबर टाका', 'Enter table number')); return }
    const order = await createOrder(cart, orderType, tableNumber)
    if (order) { resetForm(); setActiveOrderId(order.id) }
  }

  async function handleUpdate() {
    if (!editingOrderId) return
    const eid = editingOrderId
    const ok  = await updateOrder(eid, cart)
    if (ok) { resetForm(); setActiveOrderId(eid) }
  }

  async function handleComplete(paymentMode) {
    if (!activeOrderId) return
    const ok = await completeOrder(activeOrderId, paymentMode)
    if (ok) setActiveOrderId(null)
  }

  async function handleCancel() {
    if (!activeOrderId) return
    if (window.confirm(t('ऑर्डर रद्द करायची?', 'Cancel this order?'))) {
      const ok = await cancelOrder(activeOrderId)
      if (ok) setActiveOrderId(null)
    }
  }

  if (loading) return <div style={styles.centered}>Loading...</div>

  const activeOrder = orders.find(o => o.id === activeOrderId)
  const isEditing   = !!editingOrderId

  const isMobile = window.innerWidth < 640

  return (
    <div style={styles.container}>
      <Toaster position="top-center" />

      <Header
        subtitle={t('ऑर्डर स्क्रीन', 'Order Screen')}
        rightContent={
          <a href="/" style={styles.endShiftBtn}>
            {t('शिफ्ट संपवा', 'End Shift')}
          </a>
        }
      />

      <div style={styles.topBar}>
        <div style={styles.typeRow}>
          <button
            style={{ ...styles.typeBtn, ...(orderType === 'table' ? styles.typeBtnActive : {}) }}
            onClick={() => setOrderType('table')}>
            {t('टेबल', 'Table')}
          </button>
          <button
            style={{ ...styles.typeBtn, ...(orderType === 'parcel' ? styles.typeBtnActive : {}) }}
            onClick={() => setOrderType('parcel')}>
            {t('पार्सल', 'Parcel')}
          </button>
          {orderType === 'table' && (
            <input
              type="number"
              placeholder={t('टेबल नं.', 'Table No.')}
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              style={styles.tableInput}
            />
          )}
          <button onClick={resetForm} style={styles.newOrderBtn}>
            + {t('नवी', 'New')}
          </button>
        </div>

        <div style={styles.orderGrid}>
          {orders.map(order => (
            <div key={order.id} style={styles.orderCardWrap}>
              <div
                onClick={() => { setActiveOrderId(order.id); setEditingOrderId(null) }}
                style={{
                  ...styles.orderCard,
                  background:  activeOrderId === order.id ? COLORS.teal : '#fff',
                  borderColor: activeOrderId === order.id ? COLORS.teal : '#ddd',
                }}
              >
                <div style={{
                  ...styles.orderCardTitle,
                  color: activeOrderId === order.id ? '#fff' : COLORS.textDark,
                }}>
                  {order.order_type === 'table'
                    ? `${t('टेबल', 'Table')} ${order.table_number}`
                    : t('पार्सल', 'Parcel')}
                </div>
                <div style={{
                  ...styles.orderCardNum,
                  color: activeOrderId === order.id ? 'rgba(255,255,255,0.8)' : '#888',
                }}>
                  #{order.order_number} · Rs.{order.total_amount}
                </div>
              </div>
              <button
                onClick={() => startEdit(order)}
                style={{
                  ...styles.editBtn,
                  background: editingOrderId === order.id ? COLORS.primary : '#f0f0f0',
                  color:      editingOrderId === order.id ? '#fff' : '#555',
                }}
              >
                {t('बदल', 'Edit')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {isMobile ? (
        <MobileLayout
          menu={menu} cart={cart}
          activeOrder={activeOrder} isEditing={isEditing}
          lang={lang} t={t}
          onAdd={addToCart} onRemove={removeFromCart}
          onCreate={handleCreate} onUpdate={handleUpdate}
          onComplete={handleComplete} onCancel={handleCancel}
          onClear={resetForm}
          activeOrderId={activeOrderId}
        />
      ) : (
        <div style={styles.desktopBody}>
          <div style={styles.menuSection}>
            <div style={styles.sectionLabel}>{t('मेनू — टॅप करा', 'Menu — Tap to add')}</div>
            <MenuGrid menu={menu} cart={cart} onAdd={addToCart} />
          </div>
          <CartPanel
            cart={cart} activeOrder={activeOrder} isEditing={isEditing}
            onAdd={addToCart} onRemove={removeFromCart}
            onCreate={handleCreate} onUpdate={handleUpdate}
            onComplete={handleComplete} onCancel={handleCancel}
            onClear={resetForm}
          />
        </div>
      )}

      <div style={styles.adminBar}>
        <a href="/admin" style={styles.adminLink}>
          {t('अॅडमिन पॅनल', 'Admin Panel')}
        </a>
      </div>
    </div>
  )
}

function MobileLayout({
  menu, cart, activeOrder, isEditing,
  lang, t, onAdd, onRemove,
  onCreate, onUpdate, onComplete, onCancel, onClear,
  activeOrderId,
}) {
  const [view, setView] = useState('menu')

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const hasActive = !!activeOrder

  return (
    <div>
      <div style={mStyles.tabRow}>
        <button
          onClick={() => setView('menu')}
          style={{
            ...mStyles.tabBtn,
            borderBottom: view === 'menu'
              ? `3px solid ${COLORS.primary}`
              : '3px solid transparent',
            color: view === 'menu' ? COLORS.primary : '#888',
            fontWeight: view === 'menu' ? 700 : 400,
          }}
        >
          {lang === 'mr' ? 'मेनू' : 'Menu'}
        </button>
        <button
          onClick={() => setView('cart')}
          style={{
            ...mStyles.tabBtn,
            borderBottom: view === 'cart'
              ? `3px solid ${COLORS.primary}`
              : '3px solid transparent',
            color: view === 'cart' ? COLORS.primary : '#888',
            fontWeight: view === 'cart' ? 700 : 400,
            position: 'relative',
          }}
        >
          {lang === 'mr' ? 'ऑर्डर' : 'Order'}
          {(cartCount > 0 || hasActive) && (
            <span style={mStyles.tabBadge}>
              {hasActive ? '!' : cartCount}
            </span>
          )}
        </button>
      </div>

      {view === 'menu' && (
        <div style={mStyles.menuPanel}>
          <MenuGrid menu={menu} cart={cart} onAdd={(item) => {
            onAdd(item)
            setView('cart')
          }} />
        </div>
      )}

      {view === 'cart' && (
        <div style={mStyles.cartPanel}>
          <CartPanel
            cart={cart} activeOrder={activeOrder} isEditing={isEditing}
            onAdd={onAdd} onRemove={onRemove}
            onCreate={onCreate} onUpdate={onUpdate}
            onComplete={onComplete} onCancel={onCancel}
            onClear={onClear}
          />
        </div>
      )}
    </div>
  )
}

const mStyles = {
  tabRow: {
    display: 'flex', background: '#fff',
    borderBottom: '1px solid #eee',
  },
  tabBtn: {
    flex: 1, padding: '12px 0', border: 'none',
    background: 'none', fontSize: 15,
    cursor: 'pointer', transition: 'all 0.15s',
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute', top: 6, right: '22%',
    background: COLORS.primary, color: '#fff',
    borderRadius: '50%', width: 18, height: 18,
    fontSize: 10, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  menuPanel: { padding: '10px 12px', background: '#fff', minHeight: '60vh' },
  cartPanel: { padding: '10px 12px' },
}

const styles = {
  container:     { minHeight: '100vh', background: COLORS.bg, fontFamily: 'sans-serif' },
  centered:      { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  endShiftBtn:   { background: 'rgba(255,255,255,0.25)', border: '1.5px solid rgba(255,255,255,0.6)', padding: '6px 14px', borderRadius: 20, color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 },
  topBar:        { background: '#fff', padding: '10px 12px', borderBottom: '1px solid #eee' },
  typeRow:       { display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' },
  typeBtn:       { padding: '7px 16px', borderRadius: 20, border: '1px solid #ddd', cursor: 'pointer', fontSize: 13, background: '#f5f5f5', color: '#333' },
  typeBtnActive: { background: COLORS.primary, color: '#fff', border: `1px solid ${COLORS.primary}` },
  tableInput:    { padding: '7px 12px', borderRadius: 20, border: '1px solid #ddd', width: 90, fontSize: 13 },
  newOrderBtn:   { padding: '7px 14px', borderRadius: 20, background: COLORS.primary, color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', fontWeight: 600, marginLeft: 'auto' },
  orderGrid:     {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  orderCardWrap: { display: 'flex', flexDirection: 'column', gap: 4 },
  orderCard:     {
    borderRadius: 10, border: '1.5px solid',
    padding: '8px 10px', cursor: 'pointer',
    transition: 'all 0.12s',
  },
  orderCardTitle:{ fontSize: 14, fontWeight: 700 },
  orderCardNum:  { fontSize: 12, marginTop: 2 },
  editBtn:       {
    border: 'none', borderRadius: 8,
    padding: '7px 0', fontSize: 13,
    cursor: 'pointer', fontWeight: 600,
    width: '100%', textAlign: 'center',
  },
  desktopBody:   { display: 'flex', gap: 12, padding: 12 },
  menuSection:   { background: '#fff', borderRadius: 14, padding: 14, flex: 1 },
  sectionLabel:  { fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, letterSpacing: '0.04em' },
  adminBar:      { padding: '12px 16px', textAlign: 'right' },
  adminLink:     { fontSize: 12, color: COLORS.primary, textDecoration: 'none', fontWeight: 600 },
}