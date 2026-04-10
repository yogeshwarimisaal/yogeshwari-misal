import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import Header from '../components/Header'
import { supabase } from '../api/supabase'
import { COLORS, EXPENSE_LABELS } from '../utils/constants'
import { formatCurrency, formatTime, formatDate, getTodayDate } from '../utils/formatters'

const STATUS_COLORS = {
  completed:  { bg: '#E1F5EE', text: '#085041', border: '#1D9E75' },
  open:       { bg: '#E6F1FB', text: '#0C447C', border: '#378ADD' },
  cancelled:  { bg: '#FCEBEB', text: '#791F1F', border: '#E24B4A' },
}

export default function AdminOrderManager() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const t = (mr, en) => lang === 'mr' ? mr : en

  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filterDate,   setFilterDate]   = useState(getTodayDate())
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedId,   setExpandedId]   = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)
  const [menuItems,    setMenuItems]    = useState([])
  const [saving,       setSaving]       = useState(false)
  const [searchText,   setSearchText]   = useState('')

  useEffect(() => {
    loadOrders()
    loadMenuItems()
  }, [filterDate, filterStatus])

  async function loadOrders() {
    setLoading(true)
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_item: menu_items (id, name_en, name_mr, price)
        )
      `)
      .order('created_at', { ascending: false })

    if (filterDate) {
      query = query
        .gte('created_at', `${filterDate}T00:00:00`)
        .lte('created_at', `${filterDate}T23:59:59`)
    }
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }

    const { data, error } = await query
    if (error) toast.error('Failed to load orders')
    else setOrders(data || [])
    setLoading(false)
  }

  async function loadMenuItems() {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true)
      .eq('is_bulk', false)
      .order('name_en')
    setMenuItems(data || [])
  }

  async function deleteOrder(orderId, orderNumber) {
    if (!window.confirm(
      t(`ऑर्डर #${orderNumber} कायमची डिलीट करायची?`, `Permanently delete Order #${orderNumber}?`)
    )) return

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (error) {
      toast.error('Delete failed: ' + error.message)
    } else {
      toast.success(t(`ऑर्डर #${orderNumber} डिलीट झाली`, `Order #${orderNumber} deleted`))
      setExpandedId(null)
      loadOrders()
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    const { error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', orderId)

    if (error) {
      toast.error('Update failed')
    } else {
      toast.success(t('स्थिती बदलली', 'Status updated'))
      loadOrders()
    }
  }

  async function updatePaymentMode(orderId, mode) {
    const { error } = await supabase
      .from('orders')
      .update({ payment_mode: mode })
      .eq('id', orderId)

    if (error) {
      toast.error('Update failed')
    } else {
      toast.success(t('पेमेंट पद्धत बदलली', 'Payment mode updated'))
      loadOrders()
    }
  }

  function startEditOrder(order) {
    setEditingOrder({
      id:           order.id,
      order_number: order.order_number,
      order_type:   order.order_type,
      table_number: order.table_number || '',
      status:       order.status,
      payment_mode: order.payment_mode || 'cash',
      items: order.order_items.map(oi => ({
        order_item_id: oi.id,
        menu_item_id:  oi.menu_item.id,
        name_en:       oi.menu_item.name_en,
        name_mr:       oi.menu_item.name_mr,
        quantity:      oi.quantity,
        unit_price:    oi.unit_price,
      })),
    })
  }

  function editAddItem(item) {
    if (!editingOrder) return
    setEditingOrder(prev => {
      const existing = prev.items.find(i => i.menu_item_id === item.id)
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i =>
            i.menu_item_id === item.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }
      return {
        ...prev,
        items: [...prev.items, {
          order_item_id: null,
          menu_item_id:  item.id,
          name_en:       item.name_en,
          name_mr:       item.name_mr,
          quantity:      1,
          unit_price:    item.price,
        }],
      }
    })
  }

  function editRemoveItem(menuItemId) {
    setEditingOrder(prev => ({
      ...prev,
      items: prev.items
        .map(i => i.menu_item_id === menuItemId ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0),
    }))
  }

  function editGetTotal() {
    if (!editingOrder) return 0
    return editingOrder.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  }

  async function saveEditedOrder() {
    if (!editingOrder) return
    if (editingOrder.items.length === 0) {
      toast.error(t('कमीत कमी एक आयटम असणे आवश्यक आहे', 'At least one item required'))
      return
    }
    setSaving(true)
    try {
      const total = editGetTotal()
      const { error: orderErr } = await supabase
        .from('orders')
        .update({
          order_type:   editingOrder.order_type,
          table_number: editingOrder.order_type === 'table' ? editingOrder.table_number : null,
          status:       editingOrder.status,
          payment_mode: editingOrder.payment_mode,
          total_amount: total,
          completed_at: editingOrder.status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', editingOrder.id)

      if (orderErr) throw orderErr

      await supabase.from('order_items').delete().eq('order_id', editingOrder.id)

      const { error: itemErr } = await supabase
        .from('order_items')
        .insert(editingOrder.items.map(i => ({
          order_id:     editingOrder.id,
          menu_item_id: i.menu_item_id,
          quantity:     i.quantity,
          unit_price:   i.unit_price,
        })))

      if (itemErr) throw itemErr

      toast.success(t(`ऑर्डर #${editingOrder.order_number} अपडेट झाली!`, `Order #${editingOrder.order_number} updated!`))
      setEditingOrder(null)
      setExpandedId(null)
      loadOrders()
    } catch (e) {
      toast.error('Save failed: ' + e.message)
    }
    setSaving(false)
  }

  const filtered = orders.filter(o => {
    if (!searchText) return true
    const s = searchText.toLowerCase()
    return (
      String(o.order_number).includes(s) ||
      (o.table_number && String(o.table_number).includes(s)) ||
      (o.payment_mode && o.payment_mode.includes(s))
    )
  })

  const totalRevenue = filtered
    .filter(o => o.status === 'completed')
    .reduce((s, o) => s + (o.total_amount || 0), 0)

  const cashRevenue = filtered
    .filter(o => o.status === 'completed' && o.payment_mode === 'cash')
    .reduce((s, o) => s + (o.total_amount || 0), 0)

  const onlineRevenue = filtered
    .filter(o => o.status === 'completed' && o.payment_mode === 'online')
    .reduce((s, o) => s + (o.total_amount || 0), 0)

  return (
    <div style={s.container}>
      <Toaster position="top-center" />
      <Header
        subtitle={t('ऑर्डर व्यवस्थापन', 'Order Management')}
        rightContent={
          <a href="/admin" style={s.backBtn}>{t('अॅडमिन', 'Admin')}</a>
        }
      />

      <div style={s.filterBar}>
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={s.dateInput}
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={s.select}
        >
          <option value="all">{t('सर्व', 'All')}</option>
          <option value="completed">{t('पूर्ण', 'Completed')}</option>
          <option value="open">{t('उघडी', 'Open')}</option>
          <option value="cancelled">{t('रद्द', 'Cancelled')}</option>
        </select>
        <input
          type="text"
          placeholder={t('शोधा #नं / टेबल', 'Search #no / table')}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ ...s.dateInput, flex: 1 }}
        />
      </div>

      <div style={s.summaryRow}>
        <div style={s.summaryCard}>
          <div style={s.summaryLabel}>{t('एकूण ऑर्डर', 'Total Orders')}</div>
          <div style={{ ...s.summaryVal, color: COLORS.primary }}>{filtered.length}</div>
        </div>
        <div style={s.summaryCard}>
          <div style={s.summaryLabel}>{t('एकूण महसूल', 'Revenue')}</div>
          <div style={{ ...s.summaryVal, color: COLORS.teal }}>{formatCurrency(totalRevenue)}</div>
        </div>
        <div style={s.summaryCard}>
          <div style={s.summaryLabel}>{t('रोख', 'Cash')}</div>
          <div style={{ ...s.summaryVal, color: '#1D9E75' }}>{formatCurrency(cashRevenue)}</div>
        </div>
        <div style={s.summaryCard}>
          <div style={s.summaryLabel}>{t('ऑनलाइन', 'Online')}</div>
          <div style={{ ...s.summaryVal, color: COLORS.blue }}>{formatCurrency(onlineRevenue)}</div>
        </div>
      </div>

      <div style={s.content}>
        {loading ? (
          <div style={s.centered}>{t('लोड होत आहे...', 'Loading...')}</div>
        ) : filtered.length === 0 ? (
          <div style={s.centered}>{t('कोणत्याही ऑर्डर नाहीत', 'No orders found')}</div>
        ) : (
          filtered.map(order => {
            const sc        = STATUS_COLORS[order.status] || STATUS_COLORS.open
            const isExpanded = expandedId === order.id
            const isEditing  = editingOrder?.id === order.id

            return (
              <div key={order.id} style={{
                ...s.orderCard,
                borderLeft: `4px solid ${sc.border}`,
              }}>
                <div
                  onClick={() => {
                    setExpandedId(isExpanded ? null : order.id)
                    if (isEditing) setEditingOrder(null)
                  }}
                  style={s.orderRow}
                >
                  <div style={s.orderLeft}>
                    <div style={s.orderNum}>#{order.order_number}</div>
                    <div style={s.orderType}>
                      {order.order_type === 'table'
                        ? `${t('टेबल', 'Table')} ${order.table_number}`
                        : t('पार्सल', 'Parcel')}
                    </div>
                    <div style={s.orderTime}>
                      {formatTime(order.created_at)}
                    </div>
                  </div>

                  <div style={s.orderMid}>
                    <div style={{
                      ...s.statusBadge,
                      background: sc.bg,
                      color:      sc.text,
                      border:     `1px solid ${sc.border}`,
                    }}>
                      {order.status === 'completed'
                        ? t('पूर्ण', 'Completed')
                        : order.status === 'open'
                          ? t('उघडी', 'Open')
                          : t('रद्द', 'Cancelled')}
                    </div>
                    {order.payment_mode && (
                      <div style={{
                        ...s.payBadge,
                        background: order.payment_mode === 'cash' ? '#E1F5EE' : '#E6F1FB',
                        color:      order.payment_mode === 'cash' ? '#085041' : '#0C447C',
                      }}>
                        {order.payment_mode === 'cash' ? t('रोख', 'Cash') : 'UPI'}
                      </div>
                    )}
                  </div>

                  <div style={s.orderRight}>
                    <div style={s.orderAmount}>{formatCurrency(order.total_amount)}</div>
                    <div style={s.expandIcon}>{isExpanded ? '▲' : '▼'}</div>
                  </div>
                </div>

                {isExpanded && !isEditing && (
                  <div style={s.expandedSection}>
                    <div style={s.itemsList}>
                      {order.order_items.map(oi => (
                        <div key={oi.id} style={s.itemRow}>
                          <span style={s.itemName}>
                            {lang === 'mr' ? oi.menu_item.name_mr : oi.menu_item.name_en}
                          </span>
                          <span style={s.itemQty}>× {oi.quantity}</span>
                          <span style={s.itemAmt}>
                            {formatCurrency(oi.unit_price * oi.quantity)}
                          </span>
                        </div>
                      ))}
                      <div style={s.totalLine}>
                        <span>{t('एकूण', 'Total')}</span>
                        <span style={{ fontWeight: 700, color: COLORS.primary }}>
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                    </div>

                    <div style={s.quickActions}>
                      <div style={s.actionGroup}>
                        <div style={s.actionLabel}>{t('पेमेंट बदला', 'Change payment')}:</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => updatePaymentMode(order.id, 'cash')}
                            style={{
                              ...s.actionBtn,
                              background: order.payment_mode === 'cash' ? COLORS.teal : '#f0f0f0',
                              color:      order.payment_mode === 'cash' ? '#fff' : '#555',
                            }}
                          >
                            {t('रोख', 'Cash')}
                          </button>
                          <button
                            onClick={() => updatePaymentMode(order.id, 'online')}
                            style={{
                              ...s.actionBtn,
                              background: order.payment_mode === 'online' ? COLORS.blue : '#f0f0f0',
                              color:      order.payment_mode === 'online' ? '#fff' : '#555',
                            }}
                          >
                            UPI
                          </button>
                        </div>
                      </div>

                      <div style={s.actionGroup}>
                        <div style={s.actionLabel}>{t('स्थिती बदला', 'Change status')}:</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {['completed', 'open', 'cancelled'].map(st => (
                            <button
                              key={st}
                              onClick={() => updateOrderStatus(order.id, st)}
                              style={{
                                ...s.actionBtn,
                                background: order.status === st
                                  ? STATUS_COLORS[st].bg : '#f0f0f0',
                                color: order.status === st
                                  ? STATUS_COLORS[st].text : '#555',
                                border: order.status === st
                                  ? `1px solid ${STATUS_COLORS[st].border}` : '1px solid #ddd',
                                fontWeight: order.status === st ? 700 : 400,
                              }}
                            >
                              {st === 'completed'
                                ? t('पूर्ण', 'Done')
                                : st === 'open'
                                  ? t('उघडी', 'Open')
                                  : t('रद्द', 'Cancel')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => startEditOrder(order)}
                        style={s.editOrderBtn}
                      >
                        ✏️ {t('आयटम बदला', 'Edit Items')}
                      </button>
                      <button
                        onClick={() => deleteOrder(order.id, order.order_number)}
                        style={s.deleteOrderBtn}
                      >
                        🗑️ {t('डिलीट करा', 'Delete')}
                      </button>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div style={s.editSection}>
                    <div style={s.editTitle}>
                      ✏️ {t(`ऑर्डर #${editingOrder.order_number} बदलत आहे`, `Editing Order #${editingOrder.order_number}`)}
                    </div>

                    <div style={s.editTypeRow}>
                      <button
                        onClick={() => setEditingOrder(p => ({ ...p, order_type: 'table' }))}
                        style={{
                          ...s.typeBtn,
                          background: editingOrder.order_type === 'table' ? COLORS.primary : '#f0f0f0',
                          color:      editingOrder.order_type === 'table' ? '#fff' : '#555',
                        }}
                      >
                        {t('टेबल', 'Table')}
                      </button>
                      <button
                        onClick={() => setEditingOrder(p => ({ ...p, order_type: 'parcel' }))}
                        style={{
                          ...s.typeBtn,
                          background: editingOrder.order_type === 'parcel' ? COLORS.primary : '#f0f0f0',
                          color:      editingOrder.order_type === 'parcel' ? '#fff' : '#555',
                        }}
                      >
                        {t('पार्सल', 'Parcel')}
                      </button>
                      {editingOrder.order_type === 'table' && (
                        <input
                          type="number"
                          value={editingOrder.table_number}
                          onChange={e => setEditingOrder(p => ({ ...p, table_number: e.target.value }))}
                          placeholder="Table No."
                          style={s.tableInput}
                        />
                      )}
                    </div>

                    <div style={s.editSectionLabel}>{t('सध्याचे आयटम', 'Current Items')}:</div>
                    {editingOrder.items.map(item => (
                      <div key={item.menu_item_id} style={s.editItemRow}>
                        <span style={{ flex: 1, fontSize: 13 }}>
                          {lang === 'mr' ? item.name_mr : item.name_en}
                        </span>
                        <div style={s.qtyCtrl}>
                          <button
                            onClick={() => editRemoveItem(item.menu_item_id)}
                            style={s.qBtn}
                          >−</button>
                          <span style={s.qNum}>{item.quantity}</span>
                          <button
                            onClick={() => editAddItem({ id: item.menu_item_id, name_en: item.name_en, name_mr: item.name_mr, price: item.unit_price })}
                            style={s.qBtn}
                          >+</button>
                        </div>
                        <span style={{ fontSize: 13, color: COLORS.primary, minWidth: 55, textAlign: 'right' }}>
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    ))}

                    <div style={s.editSectionLabel}>{t('आयटम जोडा', 'Add Items')}:</div>
                    <div style={s.addItemsGrid}>
                      {menuItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => editAddItem(item)}
                          style={s.addItemBtn}
                        >
                          <div style={{ fontSize: 12, fontWeight: 600 }}>
                            {lang === 'mr' ? item.name_mr : item.name_en}
                          </div>
                          <div style={{ fontSize: 11, color: COLORS.primary }}>
                            ₹{item.price}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div style={s.editPayRow}>
                      <div style={s.editSectionLabel}>{t('पेमेंट', 'Payment')}:</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setEditingOrder(p => ({ ...p, payment_mode: 'cash' }))}
                          style={{
                            ...s.typeBtn,
                            background: editingOrder.payment_mode === 'cash' ? COLORS.teal : '#f0f0f0',
                            color:      editingOrder.payment_mode === 'cash' ? '#fff' : '#555',
                          }}
                        >
                          {t('रोख', 'Cash')}
                        </button>
                        <button
                          onClick={() => setEditingOrder(p => ({ ...p, payment_mode: 'online' }))}
                          style={{
                            ...s.typeBtn,
                            background: editingOrder.payment_mode === 'online' ? COLORS.blue : '#f0f0f0',
                            color:      editingOrder.payment_mode === 'online' ? '#fff' : '#555',
                          }}
                        >
                          UPI
                        </button>
                      </div>
                    </div>

                    <div style={s.editTotal}>
                      {t('नवीन एकूण', 'New Total')}: <strong style={{ color: COLORS.primary }}>
                        {formatCurrency(editGetTotal())}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        onClick={saveEditedOrder}
                        disabled={saving}
                        style={s.saveBtn}
                      >
                        {saving ? t('सेव्ह होत आहे...', 'Saving...') : t('बदल सेव्ह करा', 'Save Changes')}
                      </button>
                      <button
                        onClick={() => setEditingOrder(null)}
                        style={s.cancelEditBtn}
                      >
                        {t('रद्द करा', 'Cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const s = {
  container:      { minHeight: '100vh', background: COLORS.bg, fontFamily: 'sans-serif' },
  centered:       { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#888' },
  backBtn:        { background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: 20, color: '#fff', textDecoration: 'none', fontSize: 12 },
  filterBar:      { display: 'flex', gap: 8, padding: '10px 12px', background: '#fff', borderBottom: '1px solid #eee', flexWrap: 'wrap' },
  dateInput:      { padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 },
  select:         { padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 },
  summaryRow:     { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '10px 12px', background: '#fff', borderBottom: '1px solid #eee' },
  summaryCard:    { background: COLORS.bg, borderRadius: 8, padding: '8px 10px', textAlign: 'center' },
  summaryLabel:   { fontSize: 10, color: '#888', fontWeight: 600, marginBottom: 4 },
  summaryVal:     { fontSize: 16, fontWeight: 700 },
  content:        { padding: 12 },
  orderCard:      { background: '#fff', borderRadius: 12, border: '1px solid #eee', marginBottom: 8, overflow: 'hidden' },
  orderRow:       { display: 'flex', alignItems: 'center', padding: '10px 12px', cursor: 'pointer', gap: 8 },
  orderLeft:      { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
  orderNum:       { fontSize: 15, fontWeight: 700, color: COLORS.primary, minWidth: 36 },
  orderType:      { fontSize: 13, color: '#1a1a1a', fontWeight: 500 },
  orderTime:      { fontSize: 11, color: '#888' },
  orderMid:       { display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' },
  statusBadge:    { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20 },
  payBadge:       { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20 },
  orderRight:     { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 },
  orderAmount:    { fontSize: 14, fontWeight: 700, color: COLORS.primary },
  expandIcon:     { fontSize: 10, color: '#aaa' },
  expandedSection:{ borderTop: '1px solid #f0f0f0', padding: '10px 12px', background: '#fafafa' },
  itemsList:      { marginBottom: 10 },
  itemRow:        { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid #f0f0f0' },
  itemName:       { flex: 1, fontSize: 13 },
  itemQty:        { fontSize: 12, color: '#888' },
  itemAmt:        { fontSize: 13, color: COLORS.primary, fontWeight: 600, minWidth: 55, textAlign: 'right' },
  totalLine:      { display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', fontSize: 13 },
  quickActions:   { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 },
  actionGroup:    { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  actionLabel:    { fontSize: 11, color: '#888', fontWeight: 600, minWidth: 90 },
  actionBtn:      { padding: '6px 12px', borderRadius: 20, border: '1px solid #ddd', fontSize: 12, cursor: 'pointer' },
  editOrderBtn:   { flex: 1, background: '#E6F1FB', color: '#0C447C', border: '1px solid #378ADD', padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  deleteOrderBtn: { flex: 1, background: '#FCEBEB', color: '#791F1F', border: '1px solid #E24B4A', padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  editSection:    { borderTop: '2px solid #FAEEDA', padding: '12px', background: '#FFFDF8' },
  editTitle:      { fontSize: 13, fontWeight: 700, color: COLORS.primary, marginBottom: 10 },
  editTypeRow:    { display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' },
  typeBtn:        { padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  tableInput:     { padding: '7px 12px', borderRadius: 20, border: '1px solid #ddd', width: 90, fontSize: 13 },
  editSectionLabel:{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' },
  editItemRow:    { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #eee' },
  qtyCtrl:        { display: 'flex', alignItems: 'center', gap: 6 },
  qBtn:           { width: 28, height: 28, borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qNum:           { fontSize: 14, fontWeight: 700, minWidth: 24, textAlign: 'center' },
  addItemsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 },
  addItemBtn:     { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: '8px 4px', cursor: 'pointer', textAlign: 'center' },
  editPayRow:     { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  editTotal:      { fontSize: 15, padding: '8px 0', borderTop: '1px solid #eee', marginTop: 4 },
  saveBtn:        { flex: 1, background: COLORS.teal, color: '#fff', border: 'none', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelEditBtn:  { flex: 1, background: '#f5f5f5', color: '#666', border: '1px solid #ddd', padding: '11px', borderRadius: 10, fontSize: 14, cursor: 'pointer' },
}