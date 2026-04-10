import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import Header from '../components/Header'
import StatCard from '../components/StatCard'
import PinPad from '../components/PinPad'
import { useAdmin } from '../hooks/useAdmin'
import { useMenu } from '../hooks/useMenu'
import { COLORS, EXPENSE_CATEGORIES, EXPENSE_LABELS } from '../utils/constants'
import { formatCurrency, formatTime, formatShiftDuration, getTodayDate } from '../utils/formatters'

export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  if (!unlocked) return <PinPad onUnlock={() => setUnlocked(true)} />
  return <AdminPanel activeTab={activeTab} setActiveTab={setActiveTab} />
}

function AdminPanel({ activeTab, setActiveTab }) {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const t = (mr, en) => lang === 'mr' ? mr : en

  const {
    todayStats, expenses, todayExpenses,
    inventory, shifts, loading,
    addExpense, updateInventoryItem, addInventoryItem,
  } = useAdmin()

  const { menu } = useMenu(true)

  const tabs = [
    { id: 'dashboard',   label: t('आज',       'Today')    },
    { id: 'expenses',    label: t('खर्च',      'Expenses') },
    { id: 'inventory',   label: t('इन्व्हेंटरी',      'Inventory')},
    { id: 'shifts',      label: t('शिफ्ट',     'Shifts')   },
    { id: 'reports',     label: t('रिपोर्ट्स',     'Reports')  },
    { id: 'menumanager', label: t('मेनू',      'Menu')     },
    { id: 'bulk',        label: t('बल्क',      'Bulk')     },
    { id: 'orders', label: t('ऑर्डर', 'Orders') },
  ]

  return (
    <div style={styles.container}>
      <Toaster position="top-center" />
      <Header
        subtitle={t('अॅडमिन पॅनल', 'Admin Panel')}
        rightContent={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
  <a href="/pos" style={styles.posBtn}>
    {t('POS', 'POS')}
  </a>
  <a href="/" style={styles.homeBtn}>
    {t('बंद करा', 'Close')}
  </a>
</div>
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
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.centered}>
            {t('हॉटेल उघडत आहे...', 'Loading...')}
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardTab
                stats={todayStats}
                todayExpenses={todayExpenses}
                lang={lang}
                t={t}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesTab
                expenses={expenses}
                onAdd={addExpense}
                lang={lang}
                t={t}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryTab
                inventory={inventory}
                onUpdate={updateInventoryItem}
                onAdd={addInventoryItem}
                lang={lang}
                t={t}
              />
            )}

            {activeTab === 'shifts' && (
              <ShiftsTab shifts={shifts} lang={lang} t={t} />
            )}

            {activeTab === 'reports' && (
              <div style={styles.linkTabContent}>
                <div style={styles.linkTabDesc}>
                  {t('दैनिक, साप्ताहिक आणि मासिक व्यावसायिक रिपोर्ट पाहा', 'View daily, weekly and monthly business reports')}
                </div>
                <a href="/reports" style={styles.linkBtn}>
                  {t('रिपोर्ट उघडा', 'Open Reports')}
                </a>
              </div>
            )}

            {activeTab === 'menumanager' && (
              <div style={styles.linkTabContent}>
                <div style={styles.linkTabDesc}>
                  {t('मेनूमध्ये डिश ऍड करा, बदला किंवा बंद करा', 'Add, edit or disable menu items')}
                </div>
                <a href="/menu-manager" style={styles.linkBtn}>
                  {t('मेनू व्यवस्थापन उघडा', 'Open Menu Manager')}
                </a>
              </div>
            )}

            {activeTab === 'bulk' && (
              <div style={styles.linkTabContent}>
                <div style={styles.linkTabDesc}>
                  {t('बल्क आणि स्पेशल ऑर्डर व्यवस्थापित करा', 'Manage bulk and special orders')}
                </div>
                <a href="/bulk" style={styles.linkBtn}>
                  {t('बल्क ऑर्डर उघडा', 'Open Bulk Orders')}
                </a>
              </div>
            )}
            {activeTab === 'orders' && (
  <div style={styles.linkTabContent}>
    <div style={styles.linkTabDesc}>
      {t('सर्व ऑर्डर पाहा, बदला किंवा डिलीट करा', 'View, edit or delete any order')}
    </div>
    <a href="/order-manager" style={styles.linkBtn}>
      {t('ऑर्डर व्यवस्थापन उघडा', 'Open Order Manager')}
    </a>
  </div>
)}
          </>
        )}
      </div>
    </div>
  )
}

function DashboardTab({ stats, todayExpenses, t }) {
  const profit = stats.revenue - todayExpenses
  return (
    <div>
      <div style={styles.sectionTitle}>
        {t('आजचा आढावा', "Today's Overview")}
      </div>
      <div style={styles.statsGrid}>
        <StatCard
          label={t('एकूण रेव्हेन्यू', 'Total Revenue')}
          value={formatCurrency(stats.revenue)}
          sub={`${stats.orders} ${t('ऑर्डर', 'orders')}`}
          accent={COLORS.teal}
        />
        <StatCard
          label={t('एकूण खर्च', 'Total Expenses')}
          value={formatCurrency(todayExpenses)}
          accent={COLORS.primary}
        />
        <StatCard
          label={t('नफा / तोटा', 'Profit / Loss')}
          value={formatCurrency(profit)}
          sub={profit >= 0 ? t('नफा', 'Profit') : t('तोटा', 'Loss')}
          accent={profit >= 0 ? COLORS.teal : '#E24B4A'}
        />
        <StatCard
          label={t('रोख ऑर्डर', 'Cash Orders')}
          value={stats.cashOrders}
          sub={`${stats.onlineOrders} ${t('ऑनलाइन', 'online')}`}
          accent={COLORS.blue}
        />
        <div style={{ ...styles.statsGrid, marginTop: 10 }}>
  <StatCard
    label={t('रोख रक्कम (EOD)', 'Cash in Box (EOD)')}
    value={formatCurrency(stats.cashRevenue || 0)}
    sub={`${stats.cashOrders} ${t('रोख ऑर्डर', 'cash orders')}`}
    accent='#1D9E75'
  />
  <StatCard
    label={t('ऑनलाइन / UPI', 'Online / UPI')}
    value={formatCurrency(stats.onlineRevenue || 0)}
    sub={`${stats.onlineOrders} ${t('ऑनलाइन ऑर्डर', 'online orders')}`}
    accent='#185FA5'
  />
</div>
      </div>
      {stats.topDish && (
        <div style={styles.topDishCard}>
          <div style={styles.topDishLabel}>
            {t('आजची सर्वाधिक विकलेली डिश', "Today's Top Dish")}
          </div>
          <div style={styles.topDishName}>{stats.topDish.name}</div>
          <div style={styles.topDishCount}>
            {stats.topDish.count} {t('वेळा', 'times')}
          </div>
        </div>
      )}
    </div>
  )
}

function ExpensesTab({ expenses, onAdd, lang, t }) {
  const [form, setForm] = useState({
    category: 'raw_material',
    amount: '',
    description: '',
    expense_date: getTodayDate(),
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!form.amount) return
    setSaving(true)
    await onAdd({ ...form, amount: parseInt(form.amount) })
    setForm({
      category: 'raw_material',
      amount: '',
      description: '',
      expense_date: getTodayDate(),
    })
    setSaving(false)
  }

  return (
    <div>
      <div style={styles.sectionTitle}>
        {t('नवा खर्च जोडा', 'Add Expense')}
      </div>
      <div style={styles.formCard}>
        <select
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          style={styles.input}
        >
          {EXPENSE_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>
              {EXPENSE_LABELS[lang]?.[cat] || EXPENSE_LABELS.en[cat]}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder={t('रक्कम (Rs.)', 'Amount (Rs.)')}
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          style={styles.input}
        />
        <input
          type="text"
          placeholder={t('वर्णन (ऐच्छिक)', 'Description (optional)')}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          style={styles.input}
        />
        <input
          type="date"
          value={form.expense_date}
          onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
          style={styles.input}
        />
        <button
          onClick={handleSubmit}
          disabled={saving || !form.amount}
          style={styles.submitBtn}
        >
          {saving
            ? t('सेव्ह होत आहे...', 'Saving...')
            : t('खर्च जोडा', 'Add Expense')}
        </button>
      </div>

      <div style={styles.sectionTitle}>
        {t('अलीकडील खर्च', 'Recent Expenses')}
      </div>
      {expenses.length === 0 ? (
        <div style={styles.empty}>
          {t('कोणताही खर्च नाही', 'No expenses yet')}
        </div>
      ) : (
        expenses.map(exp => (
          <div key={exp.id} style={styles.expenseRow}>
            <div style={{ flex: 1 }}>
              <div style={styles.expenseCat}>
                {EXPENSE_LABELS[lang]?.[exp.category] || exp.category}
              </div>
              {exp.description && (
                <div style={styles.expenseDesc}>{exp.description}</div>
              )}
              <div style={styles.expenseDate}>{exp.expense_date}</div>
            </div>
            <div style={styles.expenseAmount}>
              {formatCurrency(exp.amount)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function InventoryTab({ inventory, onUpdate, onAdd, lang, t }) {
  const [editingId, setEditingId] = useState(null)
  const [editStock, setEditStock] = useState('')
  const [newItem, setNewItem] = useState({
    item_name: '', unit: 'kg',
    current_stock: '', min_stock_level: '',
  })

  async function handleUpdateStock(id) {
    await onUpdate(id, {
      current_stock: parseFloat(editStock),
      last_updated: new Date().toISOString(),
    })
    setEditingId(null)
    setEditStock('')
  }

  async function handleAddItem() {
    if (!newItem.item_name || !newItem.current_stock) return
    await onAdd({
      ...newItem,
      current_stock: parseFloat(newItem.current_stock),
      min_stock_level: parseFloat(newItem.min_stock_level) || 1,
    })
    setNewItem({ item_name: '', unit: 'kg', current_stock: '', min_stock_level: '' })
  }

  return (
    <div>
      <div style={styles.sectionTitle}>
        {t('इन्व्हेंटरीची परिस्थिती', 'Stock Status')}
      </div>
      {inventory.length === 0 ? (
        <div style={styles.empty}>
          {t('काहीच शिल्लक नाही', 'No inventory items yet')}
        </div>
      ) : (
        inventory.map(item => {
          const isLow = item.current_stock <= item.min_stock_level
          return (
            <div key={item.id} style={{
              ...styles.inventoryRow,
              borderLeft: `4px solid ${isLow ? '#E24B4A' : COLORS.teal}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={styles.inventoryName}>{item.item_name}</div>
                <div style={{ fontSize: 12, color: isLow ? '#E24B4A' : '#888' }}>
                  {item.current_stock} {item.unit}
                  {isLow && ` — ${t('रॉ-मटेरियल कमी आहे!!!', 'Low Stock!')}`}
                </div>
              </div>
              {editingId === item.id ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="number"
                    value={editStock}
                    onChange={e => setEditStock(e.target.value)}
                    style={{ ...styles.input, width: 80, margin: 0 }}
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => handleUpdateStock(item.id)}
                    style={styles.smallBtn}
                  >
                    {t('सेव्ह', 'Save')}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={styles.smallBtnGray}
                  >
                    {t('रद्द', 'Cancel')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingId(item.id); setEditStock(item.current_stock) }}
                  style={styles.smallBtn}
                >
                  {t('बदल', 'Update')}
                </button>
              )}
            </div>
          )
        })
      )}

      <div style={styles.sectionTitle}>
        {t('नवीन वस्तू जोडा', 'Add New Item')}
      </div>
      <div style={styles.formCard}>
        <input
          type="text"
          placeholder={t('वस्तूचे नाव', 'Item name')}
          value={newItem.item_name}
          onChange={e => setNewItem(n => ({ ...n, item_name: e.target.value }))}
          style={styles.input}
        />
        <select
          value={newItem.unit}
          onChange={e => setNewItem(n => ({ ...n, unit: e.target.value }))}
          style={styles.input}
        >
          {['kg', 'g', 'litre', 'piece', 'packet', 'dozen'].map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder={t('सध्याची इन्व्हेंटरीची परिस्थिती', 'Current stock')}
          value={newItem.current_stock}
          onChange={e => setNewItem(n => ({ ...n, current_stock: e.target.value }))}
          style={styles.input}
        />
        <input
          type="number"
          placeholder={t('किमान साठा मर्यादा', 'Minimum stock level')}
          value={newItem.min_stock_level}
          onChange={e => setNewItem(n => ({ ...n, min_stock_level: e.target.value }))}
          style={styles.input}
        />
        <button onClick={handleAddItem} style={styles.submitBtn}>
          {t('वस्तू जोडा', 'Add Item')}
        </button>
      </div>
    </div>
  )
}

function ShiftsTab({ shifts, lang, t }) {
  return (
    <div>
      <div style={styles.sectionTitle}>
        {t('आजच्या शिफ्ट', "Today's Shifts")}
      </div>
      {shifts.length === 0 ? (
        <div style={styles.empty}>
          {t('आज कोणी चेक इन केले नाही', 'No shifts today yet')}
        </div>
      ) : (
        shifts.map(shift => (
          <div key={shift.id} style={styles.shiftRow}>
            <div style={styles.shiftAvatar}>
              {shift.user?.initials || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.shiftName}>
                {lang === 'mr' ? shift.user?.name_mr : shift.user?.name}
              </div>
              <div style={styles.shiftTime}>
                {formatTime(shift.check_in)}
                {shift.check_out
                  ? ` → ${formatTime(shift.check_out)}`
                  : ` → ${t('अजून सुरू', 'Still on shift')}`
                }
              </div>
            </div>
            <div style={{
              ...styles.shiftDuration,
              color: shift.check_out ? COLORS.teal : COLORS.primary,
            }}>
              {formatShiftDuration(shift.check_in, shift.check_out)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

const styles = {
  container:     { minHeight: '100vh', background: COLORS.bg, fontFamily: 'sans-serif' },
  centered:      { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#888' },
  homeBtn:       { background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: 20, color: '#fff', textDecoration: 'none', fontSize: 12 },
  tabBar:        { display: 'flex', background: '#fff', borderBottom: '1px solid #eee', overflowX: 'auto' },
  tab:           { padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.15s' },
  content:       { padding: 14 },
  sectionTitle:  { fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: '0.05em' },
  statsGrid:     { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 4 },
  topDishCard:   { background: COLORS.primaryLight, borderRadius: 12, padding: '14px 16px', border: `1px solid ${COLORS.primary}20`, marginTop: 12 },
  topDishLabel:  { fontSize: 11, color: COLORS.primaryDark, fontWeight: 600, marginBottom: 4 },
  topDishName:   { fontSize: 20, fontWeight: 700, color: COLORS.primary },
  topDishCount:  { fontSize: 12, color: COLORS.primaryDark, marginTop: 2 },
  formCard:      { background: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid #eee' },
  input:         { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' },
  submitBtn:     { width: '100%', background: COLORS.primary, color: '#fff', border: 'none', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  expenseRow:    { display: 'flex', alignItems: 'center', padding: '10px 12px', background: '#fff', borderRadius: 10, marginBottom: 8, border: '1px solid #eee' },
  expenseCat:    { fontSize: 13, fontWeight: 600, color: '#1a1a1a' },
  expenseDesc:   { fontSize: 12, color: '#888', marginTop: 2 },
  expenseDate:   { fontSize: 11, color: '#aaa', marginTop: 2 },
  expenseAmount: { fontSize: 15, fontWeight: 700, color: COLORS.primary },
  inventoryRow:  { display: 'flex', alignItems: 'center', padding: '10px 12px', background: '#fff', borderRadius: 10, marginBottom: 8, border: '1px solid #eee' },
  inventoryName: { fontSize: 13, fontWeight: 600, marginBottom: 2 },
  shiftRow:      { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#fff', borderRadius: 10, marginBottom: 8, border: '1px solid #eee' },
  shiftAvatar:   { width: 40, height: 40, borderRadius: '50%', background: COLORS.primaryLight, color: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  shiftName:     { fontSize: 13, fontWeight: 600 },
  shiftTime:     { fontSize: 12, color: '#888', marginTop: 2 },
  shiftDuration: { fontSize: 13, fontWeight: 700 },
  smallBtn:      { background: COLORS.teal, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' },
  smallBtnGray:  { background: '#f0f0f0', color: '#555', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' },
  empty:         { textAlign: 'center', color: '#aaa', fontSize: 13, padding: '24px 0' },
  linkTabContent:{ textAlign: 'center', padding: '40px 20px' },
  linkTabDesc:   { fontSize: 14, color: '#888', marginBottom: 20 },
  linkBtn:       { background: COLORS.primary, color: '#fff', padding: '12px 32px', borderRadius: 12, textDecoration: 'none', fontSize: 15, fontWeight: 600 },
  posBtn:        {background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', padding: '5px 12px', borderRadius: 20,color: '#fff', textDecoration: 'none', fontSize: 12,},
}