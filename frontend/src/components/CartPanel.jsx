import { useTranslation } from 'react-i18next'
import { COLORS } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'

export default function CartPanel({
  cart, activeOrder, isEditing,
  onAdd, onRemove, onCreate, onUpdate,
  onComplete, onCancel, onClear,
}) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const t = (mr, en) => lang === 'mr' ? mr : en

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  const sectionTitle = isEditing
    ? t('ऑर्डर बदला', 'Edit Order')
    : activeOrder
      ? `${t('ऑर्डर', 'Order')} #${activeOrder.order_number}`
      : t('नवी ऑर्डर', 'New Order')

  return (
    <div style={styles.panel}>
      <div style={styles.label}>{sectionTitle}</div>

      {activeOrder && !isEditing ? (
        <ViewMode
          order={activeOrder} lang={lang} t={t}
          onComplete={onComplete} onCancel={onCancel}
        />
      ) : (
        <EditMode
          cart={cart} lang={lang} t={t}
          cartTotal={cartTotal} isEditing={isEditing}
          onAdd={onAdd} onRemove={onRemove}
          onCreate={onCreate} onUpdate={onUpdate} onClear={onClear}
        />
      )}
    </div>
  )
}

function ViewMode({ order, lang, t, onComplete, onCancel }) {
  return (
    <div>
      {order.order_items.map(oi => (
        <div key={oi.id} style={styles.row}>
          <span style={styles.itemName}>
            {lang === 'mr' ? oi.menu_item.name_mr : oi.menu_item.name_en}
          </span>
          <span style={styles.qty}>x{oi.quantity}</span>
          <span style={styles.itemTotal}>
            {formatCurrency(oi.unit_price * oi.quantity)}
          </span>
        </div>
      ))}
      <div style={styles.total}>
        {t('एकूण', 'Total')}: {formatCurrency(order.total_amount)}
      </div>
      <button onClick={() => onComplete('cash')} style={styles.cashBtn}>
        {t('रोख द्या', 'Pay Cash')}
      </button>
      <button onClick={() => onComplete('online')} style={styles.onlineBtn}>
        {t('UPI / ऑनलाइन', 'Pay UPI / Online')}
      </button>
      <button onClick={() => {
       if (window.confirm('ऑर्डर रद्द करायची? / Cancel this order?')) onCancel()
      }} style={styles.cancelBtn}>
        {t('ऑर्डर रद्द करा', 'Cancel Order')}
      </button>
    </div>
  )
}

function EditMode({ cart, lang, t, cartTotal, isEditing, onAdd, onRemove, onCreate, onUpdate, onClear }) {
  if (cart.length === 0) {
    return (
      <div style={styles.empty}>
        {t('मेनूमधून आयटम निवडा', 'Tap menu items to add')}
      </div>
    )
  }

  return (
    <div>
      {cart.map(item => (
        <div key={item.id} style={styles.row}>
          <span style={{ ...styles.itemName, flex: 1 }}>
            {lang === 'mr' ? item.name_mr : item.name_en}
          </span>
          <div style={styles.qtyCtrl}>
            <button onClick={() => onRemove(item.id)} style={styles.qtyBtn}>-</button>
            <span style={styles.qtyNum}>{item.quantity}</span>
            <button onClick={() => onAdd(item)} style={styles.qtyBtn}>+</button>
          </div>
          <span style={styles.itemTotal}>
            {formatCurrency(item.price * item.quantity)}
          </span>
        </div>
      ))}
      <div style={styles.total}>
        {t('एकूण', 'Total')}: {formatCurrency(cartTotal)}
      </div>
      {isEditing ? (
        <>
          <button onClick={onUpdate} style={styles.cashBtn}>
            {t('ऑर्डर अपडेट करा', 'Update Order')}
          </button>
          <button onClick={onClear} style={styles.cancelBtn}>
            {t('रद्द करा', 'Cancel Edit')}
          </button>
        </>
      ) : (
        <>
          <button onClick={onCreate} style={styles.cashBtn}>
            {t('ऑर्डर तयार करा', 'Create Order')}
          </button>
          <button onClick={onClear} style={styles.cancelBtn}>
            {t('साफ करा', 'Clear')}
          </button>
        </>
      )}
    </div>
  )
}

const styles = {
  panel: {
    background: '#fff',
    borderRadius: 14,
    padding: 14,
  },
  label: {
    fontSize: 12, fontWeight: 600,
    color: '#888', marginBottom: 10,
    letterSpacing: '0.04em',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 0', borderBottom: '0.5px solid #f0f0f0',
  },
  itemName: { fontSize: 13, color: COLORS.textDark },
  qty: { fontSize: 13, color: '#888' },
  itemTotal: { fontSize: 13, color: COLORS.primary, minWidth: 55, textAlign: 'right' },
  qtyCtrl: { display: 'flex', alignItems: 'center', gap: 4 },
  qtyBtn: {
    width: 24, height: 24, borderRadius: 6,
    border: '1px solid #ddd', background: '#f5f5f5',
    cursor: 'pointer', fontSize: 14,
  },
  qtyNum: { fontSize: 13, minWidth: 20, textAlign: 'center' },
  empty: { textAlign: 'center', color: '#aaa', fontSize: 13, padding: '24px 0' },
  total: {
    fontWeight: 700, fontSize: 16,
    textAlign: 'right', padding: '10px 0',
    color: COLORS.primary,
  },
  cashBtn: {
    width: '100%', background: COLORS.teal, color: '#fff',
    border: 'none', padding: 11, borderRadius: 10,
    fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 8,
  },
  onlineBtn: {
    width: '100%', background: COLORS.blue, color: '#fff',
    border: 'none', padding: 11, borderRadius: 10,
    fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 8,
  },
  cancelBtn: {
    width: '100%', background: '#f5f5f5', color: '#666',
    border: '1px solid #ddd', padding: 9, borderRadius: 10,
    fontSize: 13, cursor: 'pointer',
  },
}