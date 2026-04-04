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

  const { menu, loading } = useMenu()
  const { orders, createOrder, updateOrder, completeOrder, cancelOrder } = useOrders()

  const [cart, setCart] = useState([])
  const [orderType, setOrderType] = useState('table')
  const [tableNumber, setTableNumber] = useState('')
  const [activeOrderId, setActiveOrderId] = useState(null)
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
      id: oi.menu_item.id,
      name_en: oi.menu_item.name_en,
      name_mr: oi.menu_item.name_mr,
      price: oi.menu_item.price,
      quantity: oi.quantity,
    })))
  }

  async function handleCreate() {
    if (cart.length === 0) { toast.error(t('आयटम ऍड करा', 'Add items first')); return }
    if (orderType === 'table' && !tableNumber) { toast.error(t('टेबल नंबर काय आहे?', 'Enter table number')); return }
    const order = await createOrder(cart, orderType, tableNumber)
    if (order) { resetForm(); setActiveOrderId(order.id) }
  }

  async function handleUpdate() {
    if (!editingOrderId) return
    const eid = editingOrderId
    const ok = await updateOrder(eid, cart)
    if (ok) { resetForm(); setActiveOrderId(eid) }
  }

  async function handleComplete(paymentMode) {
    if (!activeOrderId) return
    const ok = await completeOrder(activeOrderId, paymentMode)
    if (ok) setActiveOrderId(null)
  }

  async function handleCancel() {
    if (!activeOrderId) return
    const ok = await cancelOrder(activeOrderId)
    if (ok) setActiveOrderId(null)
  }

  if (loading) return <div style={styles.centered}>Loading...</div>

  const activeOrder = orders.find(o => o.id === activeOrderId)
  const isEditing = !!editingOrderId

  return (
    <div style={styles.container}>
      <Toaster position="top-center" />

      <Header
        subtitle={t('ऑर्डर स्क्रीन', 'Order Screen')}
        rightContent={
          <a href="/" style={styles.homeBtn}>
            {t('होम', 'Home')}
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
        </div>

        <div style={styles.orderStrip}>
          <button onClick={resetForm} style={styles.newOrderBtn}>
            + {t('नवीन ऑर्डर', 'New Order')}
          </button>
          {orders.map(order => (
            <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <div
                onClick={() => { setActiveOrderId(order.id); setEditingOrderId(null) }}
                style={{
                  ...styles.orderChip,
                  background: activeOrderId === order.id ? COLORS.teal : '#fff',
                  color: activeOrderId === order.id ? '#fff' : '#333',
                }}>
                #{order.order_number} {order.order_type === 'table' ? `T${order.table_number}` : 'P'}
              </div>
              <button onClick={() => startEdit(order)} style={styles.editBtn}>
                {t('बदल', 'Edit')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.menuSection}>
          <div style={styles.sectionLabel}>
            {t('मेनू — टॅप करा', 'Menu — Tap to add')}
          </div>
          <MenuGrid menu={menu} cart={cart} onAdd={addToCart} />
        </div>

        <CartPanel
          cart={cart}
          activeOrder={activeOrder}
          isEditing={isEditing}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onComplete={handleComplete}
          onCancel={handleCancel}
          onClear={resetForm}
        />
      </div>

      <div style={styles.adminBar}>
        <a href="/admin" style={styles.adminLink}>
          {t('ऍडमीन पॅनल', 'Admin Panel')}
        </a>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: COLORS.bg, fontFamily: 'sans-serif' },
  centered: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  homeBtn: {
    background: 'rgba(255,255,255,0.2)', padding: '5px 12px',
    borderRadius: 20, color: '#fff', textDecoration: 'none', fontSize: 12,
  },
  topBar: { background: '#fff', padding: '10px 14px', borderBottom: '1px solid #eee' },
  typeRow: { display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' },
  typeBtn: {
    padding: '6px 14px', borderRadius: 20, border: '1px solid #ddd',
    cursor: 'pointer', fontSize: 13, background: '#f5f5f5', color: '#333',
  },
  typeBtnActive: { background: COLORS.primary, color: '#fff', border: `1px solid ${COLORS.primary}` },
  tableInput: {
    padding: '6px 12px', borderRadius: 20,
    border: '1px solid #ddd', width: 90, fontSize: 13,
  },
  orderStrip: { display: 'flex', gap: 6, overflowX: 'auto', alignItems: 'center', paddingBottom: 2 },
  newOrderBtn: {
    padding: '5px 12px', borderRadius: 20, background: COLORS.primary,
    color: '#fff', border: 'none', fontSize: 12,
    cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600,
  },
  orderChip: {
    padding: '5px 10px', borderRadius: 20, fontSize: 12,
    cursor: 'pointer', border: '1px solid #ddd', whiteSpace: 'nowrap',
  },
  editBtn: {
    background: '#f0f0f0', border: 'none', borderRadius: 10,
    padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#555',
  },
  body: {
  display: 'grid',
  gridTemplateColumns: window.innerWidth < 600 ? '1fr' : '1fr 300px',
  gap: 12,
  padding: 12
        },
  menuSection: { background: '#fff', borderRadius: 14, padding: 14 },
  sectionLabel: { fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10, letterSpacing: '0.04em' },
  adminBar: { padding: '12px 16px', textAlign: 'right' },
  adminLink: { fontSize: 12, color: COLORS.primary, textDecoration: 'none', fontWeight: 600 },
}