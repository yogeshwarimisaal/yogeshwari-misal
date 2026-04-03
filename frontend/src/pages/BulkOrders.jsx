import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import Header from '../components/Header'
import { useBulkOrders } from '../hooks/useBulkOrders'
import { useMenu } from '../hooks/useMenu'
import { COLORS } from '../utils/constants'
import { formatCurrency, formatDate, getTodayDate } from '../utils/formatters'

const STATUS_COLORS = {
  confirmed:  { bg: '#E6F1FB', text: '#0C447C', border: '#378ADD' },
  preparing:  { bg: '#FAEEDA', text: '#633806', border: '#BA7517' },
  ready:      { bg: '#E1F5EE', text: '#085041', border: '#1D9E75' },
  delivered:  { bg: '#F1EFE8', text: '#444441', border: '#888780' },
  cancelled:  { bg: '#FCEBEB', text: '#791F1F', border: '#E24B4A' },
}

const STATUS_LABELS = {
  en: {
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  },
  mr: {
    confirmed: 'पक्के',
    preparing: 'तयार होत आहे',
    ready: 'तयार',
    delivered: 'दिले',
    cancelled: 'रद्द',
  },
}

export default function BulkOrders() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const t = (mr, en) => lang === 'mr' ? mr : en

  const {
    bulkOrders, todayBulkOrders, loading,
    createBulkOrder, updateBulkOrderStatus,
    deleteBulkOrder, getDaysUntilDelivery,
  } = useBulkOrders()

  const { menu: bulkMenu } = useMenu(true)

  const [activeTab, setActiveTab] = useState('upcoming')
  const [showForm, setShowForm] = useState(false)

  const tabs = [
    { id: 'upcoming', label: t('येणारे', 'Upcoming') },
    { id: 'today',    label: t('आज', 'Today') },
    { id: 'all',      label: t('सर्व', 'All') },
    { id: 'add',      label: t('+ नवीन', '+ New') },
  ]

  const upcoming = bulkOrders.filter(o =>
    o.delivery_date >= getTodayDate() && o.status !== 'delivered' && o.status !== 'cancelled'
  )
  const all = [...bulkOrders]

  const displayOrders = activeTab === 'today'
    ? todayBulkOrders
    : activeTab === 'upcoming'
      ? upcoming
      : all

  if (loading) return <div style={styles.centered}>Loading...</div>

  return (
    <div style={styles.container}>
      <Toaster position="top-center" />
      <Header
        subtitle={t('बल्क / स्पेशल ऑर्डर', 'Bulk / Special Orders')}
        rightContent={
          <a href="/admin" style={styles.backBtn}>
            {t('अॅडमिन', 'Admin')}
          </a>
        }
      />

      <div style={styles.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              borderBottom: activeTab === tab.id
                ? `3px solid ${COLORS.primary}`
                : '3px solid transparent',
              color: activeTab === tab.id ? COLORS.primary : '#888',
              fontWeight: activeTab === tab.id ? 700 : 400,
              background: tab.id === 'add' && activeTab !== 'add'
                ? COLORS.primaryLight : 'none',
            }}
          >
            {tab.label}
            {tab.id === 'today' && todayBulkOrders.length > 0 && (
              <span style={styles.badge}>{todayBulkOrders.length}</span>
            )}
            {tab.id === 'upcoming' && upcoming.length > 0 && (
              <span style={styles.badge}>{upcoming.length}</span>
            )}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'add' ? (
          <AddBulkOrderForm
            bulkMenu={bulkMenu}
            lang={lang} t={t}
            onCreate={async (order) => {
              const ok = await createBulkOrder(order)
              if (ok) setActiveTab('upcoming')
            }}
          />
        ) : (
          <OrdersList
            orders={displayOrders}
            lang={lang} t={t}
            getDaysUntil={getDaysUntilDelivery}
            onStatusChange={updateBulkOrderStatus}
            onDelete={deleteBulkOrder}
            emptyMsg={
              activeTab === 'today'
                ? t('आज कोणतेही बल्क ऑर्डर नाहीत', 'No bulk orders for today')
                : t('कोणतेही बल्क ऑर्डर नाहीत', 'No bulk orders yet')
            }
          />
        )}
      </div>
    </div>
  )
}

function OrdersList({ orders, lang, t, getDaysUntil, onStatusChange, onDelete, emptyMsg }) {
  const [expandedId, setExpandedId] = useState(null)

  if (orders.length === 0) {
    return <div style={styles.empty}>{emptyMsg}</div>
  }

  return (
    <div>
      {orders.map(order => {
        const days = getDaysUntil(order.delivery_date)
        const sc = STATUS_COLORS[order.status] || STATUS_COLORS.confirmed
        const isExpanded = expandedId === order.id
        const isToday = days === 0
        const isOverdue = days < 0 && order.status !== 'delivered'

        return (
          <div key={order.id} style={{
            ...styles.orderCard,
            borderLeft: `4px solid ${isToday ? COLORS.primary : isOverdue ? '#E24B4A' : sc.border}`,
          }}>
            <div
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
              style={styles.orderHeader}
            >
              <div style={{ flex: 1 }}>
                <div style={styles.customerName}>{order.customer_name}</div>
                <div style={styles.orderMeta}>
                  {order.phone && `${order.phone} · `}
                  {formatDate(order.delivery_date)}
                  {order.delivery_time && ` · ${order.delivery_time}`}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{
                  ...styles.statusBadge,
                  background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                }}>
                  {STATUS_LABELS[lang]?.[order.status] || order.status}
                </div>
                {isToday && (
                  <div style={styles.todayBadge}>
                    {t('आज!', 'Today!')}
                  </div>
                )}
                {days > 0 && days <= 3 && (
                  <div style={styles.soonBadge}>
                    {days} {t('दिवस', 'days')}
                  </div>
                )}
                {isOverdue && (
                  <div style={styles.overdueBadge}>
                    {t('उशीर!', 'Overdue!')}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.amountRow}>
              <span style={styles.amountLabel}>
                {t('एकूण', 'Total')}: <strong>{formatCurrency(order.total_amount)}</strong>
              </span>
              {order.advance_paid > 0 && (
                <span style={styles.advanceLabel}>
                  {t('आगाऊ', 'Advance')}: {formatCurrency(order.advance_paid)}
                </span>
              )}
              {order.total_amount > order.advance_paid && (
                <span style={styles.balanceLabel}>
                  {t('बाकी', 'Balance')}: {formatCurrency(order.total_amount - order.advance_paid)}
                </span>
              )}
            </div>

            {isExpanded && (
              <div style={styles.expandedSection}>
                {order.items_json && (
                  <div style={styles.itemsSection}>
                    <div style={styles.itemsTitle}>
                      {t('आयटम', 'Items')}:
                    </div>
                    {(typeof order.items_json === 'string'
                      ? JSON.parse(order.items_json)
                      : order.items_json
                    ).map((item, i) => (
                      <div key={i} style={styles.itemRow}>
                        <span>{item.name}</span>
                        <span style={{ color: '#888' }}>× {item.quantity}</span>
                        <span style={{ color: COLORS.primary }}>{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={styles.statusButtons}>
                  <div style={styles.statusLabel}>
                    {t('स्थिती बदला', 'Change Status')}:
                  </div>
                  <div style={styles.statusBtnRow}>
                    {['confirmed', 'preparing', 'ready', 'delivered'].map(s => (
                      <button
                        key={s}
                        onClick={() => onStatusChange(order.id, s)}
                        style={{
                          ...styles.statusBtn,
                          background: order.status === s
                            ? STATUS_COLORS[s].bg
                            : '#f5f5f5',
                          color: order.status === s
                            ? STATUS_COLORS[s].text
                            : '#888',
                          border: `1px solid ${order.status === s
                            ? STATUS_COLORS[s].border
                            : '#ddd'}`,
                          fontWeight: order.status === s ? 700 : 400,
                        }}
                      >
                        {STATUS_LABELS[lang]?.[s]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onDelete(order.id)}
                  style={styles.deleteBtn}
                >
                  {t('ऑर्डर डिलीट करा', 'Delete Order')}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AddBulkOrderForm({ bulkMenu, lang, t, onCreate }) {
  const regularBulkItems = [
    { id: 'pb1kg',  name: 'Pav Bhaji 1kg',    name_mr: 'पाव भाजी 1kg',   price: 170 },
    { id: 'tp1kg',  name: 'Tawa Pulav 1kg',   name_mr: 'तवा पुलाव 1kg',  price: 300 },
    { id: 'tp05kg', name: 'Tawa Pulav 0.5kg', name_mr: 'तवा पुलाव 500g', price: 150 },
    { id: 'ap',     name: 'Aloo Paratha',     name_mr: 'आलू पराठा',      price: 30  },
  ]

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    delivery_date: getTodayDate(),
    delivery_time: '12:00',
    advance_paid: '',
    notes: '',
  })
  const [selectedItems, setSelectedItems] = useState({})
  const [saving, setSaving] = useState(false)

  function updateQty(item, qty) {
    if (qty <= 0) {
      const updated = { ...selectedItems }
      delete updated[item.id]
      setSelectedItems(updated)
    } else {
      setSelectedItems(prev => ({ ...prev, [item.id]: { ...item, quantity: qty } }))
    }
  }

  function getTotal() {
    return Object.values(selectedItems).reduce(
      (s, item) => s + item.price * item.quantity, 0
    )
  }

  async function handleSubmit() {
    if (!form.customer_name) return
    if (Object.keys(selectedItems).length === 0) return

    setSaving(true)
    const items = Object.values(selectedItems).map(item => ({
      name: lang === 'mr' ? item.name_mr : item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total: item.price * item.quantity,
    }))

    const ok = await onCreate({
      ...form,
      advance_paid: parseInt(form.advance_paid) || 0,
      total_amount: getTotal(),
      items_json: items,
      status: 'confirmed',
    })
    if (ok) {
      setForm({
        customer_name: '',
        phone: '',
        delivery_date: getTodayDate(),
        delivery_time: '12:00',
        advance_paid: '',
        notes: '',
      })
      setSelectedItems({})
    }
    setSaving(false)
  }

  return (
    <div>
      <div style={styles.sectionTitle}>
        {t('ग्राहकाची माहिती', 'Customer Details')}
      </div>
      <div style={styles.formCard}>
        <input
          style={styles.input}
          placeholder={t('ग्राहकाचे नाव *', 'Customer name *')}
          value={form.customer_name}
          onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
        />
        <input
          style={styles.input}
          placeholder={t('फोन नंबर', 'Phone number')}
          type="tel"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        />
        <div style={styles.row2}>
          <div style={{ flex: 1 }}>
            <div style={styles.inputLabel}>
              {t('डिलिव्हरी तारीख', 'Delivery Date')}
            </div>
            <input
              style={{ ...styles.input, marginBottom: 0 }}
              type="date"
              value={form.delivery_date}
              onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.inputLabel}>
              {t('वेळ', 'Time')}
            </div>
            <input
              style={{ ...styles.input, marginBottom: 0 }}
              type="time"
              value={form.delivery_time}
              onChange={e => setForm(f => ({ ...f, delivery_time: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div style={styles.sectionTitle}>
        {t('आयटम निवडा', 'Select Items')}
      </div>
      <div style={styles.formCard}>
        {regularBulkItems.map(item => {
          const sel = selectedItems[item.id]
          return (
            <div key={item.id} style={styles.bulkItemRow}>
              <div style={{ flex: 1 }}>
                <div style={styles.bulkItemName}>
                  {lang === 'mr' ? item.name_mr : item.name}
                </div>
                <div style={styles.bulkItemPrice}>
                  {formatCurrency(item.price)}
                  {item.id === 'ap' && '/piece'}
                </div>
              </div>
              <div style={styles.qtyCtrl}>
                <button
                  onClick={() => updateQty(item, (sel?.quantity || 0) - 1)}
                  style={styles.qtyBtn}
                >-</button>
                <span style={styles.qtyNum}>{sel?.quantity || 0}</span>
                <button
                  onClick={() => updateQty(item, (sel?.quantity || 0) + 1)}
                  style={styles.qtyBtn}
                >+</button>
              </div>
              {sel && (
                <div style={styles.itemSubtotal}>
                  {formatCurrency(item.price * sel.quantity)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {Object.keys(selectedItems).length > 0 && (
        <>
          <div style={styles.sectionTitle}>
            {t('पेमेंट', 'Payment')}
          </div>
          <div style={styles.formCard}>
            <div style={styles.totalDisplay}>
              {t('एकूण रक्कम', 'Total Amount')}: <strong>{formatCurrency(getTotal())}</strong>
            </div>
            <input
              style={styles.input}
              placeholder={t('आगाऊ रक्कम (Rs.)', 'Advance amount (Rs.)')}
              type="number"
              value={form.advance_paid}
              onChange={e => setForm(f => ({ ...f, advance_paid: e.target.value }))}
            />
            {form.advance_paid > 0 && (
              <div style={styles.balanceDisplay}>
                {t('बाकी रक्कम', 'Balance due')}: {formatCurrency(getTotal() - parseInt(form.advance_paid || 0))}
              </div>
            )}
            <input
              style={styles.input}
              placeholder={t('नोट्स (ऐच्छिक)', 'Notes (optional)')}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving || !form.customer_name || Object.keys(selectedItems).length === 0}
        style={{
          ...styles.submitBtn,
          opacity: (!form.customer_name || Object.keys(selectedItems).length === 0) ? 0.5 : 1,
        }}
      >
        {saving
          ? t('सेव्ह होत आहे...', 'Saving...')
          : t('बल्क ऑर्डर तयार करा', 'Create Bulk Order')}
      </button>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: COLORS.bg, fontFamily: 'sans-serif' },
  centered: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  backBtn: {
    background: 'rgba(255,255,255,0.2)', padding: '5px 12px',
    borderRadius: 20, color: '#fff', textDecoration: 'none', fontSize: 12,
  },
  tabBar: {
    display: 'flex', background: '#fff',
    borderBottom: '1px solid #eee', overflowX: 'auto',
  },
  tab: {
    padding: '12px 14px', border: 'none', background: 'none',
    cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
    transition: 'all 0.15s', position: 'relative',
  },
  badge: {
    display: 'inline-block',
    background: COLORS.primary, color: '#fff',
    borderRadius: 10, fontSize: 10, fontWeight: 700,
    padding: '1px 6px', marginLeft: 4,
  },
  content: { padding: 14 },
  empty: { textAlign: 'center', color: '#aaa', fontSize: 13, padding: '40px 0' },
  orderCard: {
    background: '#fff', borderRadius: 12,
    border: '1px solid #eee', marginBottom: 10,
    overflow: 'hidden',
  },
  orderHeader: {
    display: 'flex', alignItems: 'flex-start',
    padding: '12px 14px', cursor: 'pointer', gap: 10,
  },
  customerName: { fontSize: 15, fontWeight: 700, color: COLORS.textDark },
  orderMeta: { fontSize: 12, color: '#888', marginTop: 3 },
  statusBadge: {
    fontSize: 11, fontWeight: 600,
    padding: '3px 10px', borderRadius: 20,
  },
  todayBadge: {
    fontSize: 11, fontWeight: 700,
    padding: '3px 10px', borderRadius: 20,
    background: COLORS.primaryLight, color: COLORS.primary,
    border: `1px solid ${COLORS.primary}`,
  },
  soonBadge: {
    fontSize: 11, fontWeight: 600,
    padding: '3px 10px', borderRadius: 20,
    background: '#FAEEDA', color: '#633806',
    border: '1px solid #BA7517',
  },
  overdueBadge: {
    fontSize: 11, fontWeight: 700,
    padding: '3px 10px', borderRadius: 20,
    background: '#FCEBEB', color: '#791F1F',
    border: '1px solid #E24B4A',
  },
  amountRow: {
    display: 'flex', gap: 12, flexWrap: 'wrap',
    padding: '0 14px 12px', fontSize: 13,
  },
  amountLabel: { color: COLORS.textDark },
  advanceLabel: { color: COLORS.teal },
  balanceLabel: { color: COLORS.primary, fontWeight: 600 },
  expandedSection: {
    borderTop: '1px solid #f0f0f0',
    padding: '12px 14px',
    background: '#fafafa',
  },
  itemsSection: { marginBottom: 12 },
  itemsTitle: { fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6 },
  itemRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 13, padding: '4px 0',
    borderBottom: '0.5px solid #eee',
  },
  statusButtons: { marginBottom: 10 },
  statusLabel: { fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6 },
  statusBtnRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  statusBtn: {
    padding: '6px 12px', borderRadius: 20,
    fontSize: 12, cursor: 'pointer',
  },
  deleteBtn: {
    background: '#FCEBEB', color: '#791F1F',
    border: '1px solid #E24B4A', padding: '7px 14px',
    borderRadius: 8, fontSize: 12, cursor: 'pointer',
  },
  sectionTitle: {
    fontSize: 12, fontWeight: 700, color: '#555',
    marginBottom: 8, marginTop: 14,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  formCard: {
    background: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 4,
    border: '1px solid #eee',
  },
  input: {
    width: '100%', padding: '10px 12px',
    borderRadius: 10, border: '1px solid #ddd',
    fontSize: 14, marginBottom: 10,
    boxSizing: 'border-box',
  },
  inputLabel: { fontSize: 11, color: '#888', marginBottom: 4, fontWeight: 600 },
  row2: { display: 'flex', gap: 10 },
  bulkItemRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 0', borderBottom: '0.5px solid #f0f0f0',
  },
  bulkItemName: { fontSize: 13, fontWeight: 600 },
  bulkItemPrice: { fontSize: 12, color: COLORS.primary, marginTop: 2 },
  qtyCtrl: { display: 'flex', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 8,
    border: '1px solid #ddd', background: '#f5f5f5',
    cursor: 'pointer', fontSize: 16,
  },
  qtyNum: { fontSize: 14, fontWeight: 600, minWidth: 24, textAlign: 'center' },
  itemSubtotal: { fontSize: 13, color: COLORS.primary, fontWeight: 600, minWidth: 60, textAlign: 'right' },
  totalDisplay: {
    fontSize: 16, color: COLORS.textDark,
    padding: '8px 0 12px', borderBottom: '1px solid #eee', marginBottom: 10,
  },
  balanceDisplay: {
    fontSize: 13, color: COLORS.primary, fontWeight: 600,
    padding: '4px 0 8px',
  },
  submitBtn: {
    width: '100%', background: COLORS.primary, color: '#fff',
    border: 'none', padding: 13, borderRadius: 12,
    fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8,
  },
}