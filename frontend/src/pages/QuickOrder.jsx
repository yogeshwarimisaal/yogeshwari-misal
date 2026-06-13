import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { useMenu } from '../hooks/useMenu'
import { supabase } from '../api/supabase'
import { COLORS } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'
import { generateCustomerBill } from '../utils/generateBill'

const ZOMATO_RED   = '#E23744'
const ZOMATO_LIGHT = '#fce8ea'

export default function QuickOrder() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const t    = (mr, en) => lang === 'mr' ? mr : en
  const { menu, loading } = useMenu()

  const [activeTab,     setActiveTab]     = useState('order')
  const [cart,          setCart]          = useState([])
  const [orderType,     setOrderType]     = useState('table')
  const [tableNumber,   setTableNumber]   = useState('')
  const [orderDate,     setOrderDate]     = useState(new Date().toISOString().split('T')[0])
  const [orderTime,     setOrderTime]     = useState(new Date().toTimeString().slice(0, 5))
  const [saving,        setSaving]        = useState(false)
  const [lastOrder,     setLastOrder]     = useState(null)
  const [showContact,   setShowContact]   = useState(false)
  const [contactName,   setContactName]   = useState('')
  const [contactPhone,  setContactPhone]  = useState('')
  const [savingContact, setSavingContact] = useState(false)

  // Expense state
  const [expForm, setExpForm] = useState({
    category:     'raw_material',
    amount:       '',
    description:  '',
    expense_date: new Date().toISOString().split('T')[0],
  })
  const [savingExp, setSavingExp] = useState(false)

  // Cash balance state
  const [cashDate,    setCashDate]    = useState(new Date().toISOString().split('T')[0])
  const [openBal,     setOpenBal]     = useState('')
  const [closeBal,    setCloseBal]    = useState('')
  const [cashNotes,   setCashNotes]   = useState('')
  const [savingCash,  setSavingCash]  = useState(false)

  const isBackdated = orderDate !== new Date().toISOString().split('T')[0]
  const cartCount   = cart.reduce((s, i) => s + i.qty, 0)

  const regular   = menu.filter(i => i.category === 'regular')
  const extras    = menu.filter(i => i.category === 'extras')
  const beverages = menu.filter(i => i.category === 'beverages')

  const EXPENSE_CATS = [
    { id: 'raw_material',      labelMr: 'कच्चा माल',         labelEn: 'Raw Material'     },
    { id: 'vegetables',        labelMr: 'भाजीपाला',           labelEn: 'Vegetables'       },
    { id: 'dairy',             labelMr: 'दूध / दही',          labelEn: 'Dairy'            },
    { id: 'oil_spices',        labelMr: 'तेल व मसाले',        labelEn: 'Oil & Spices'     },
    { id: 'gas',               labelMr: 'गॅस',                labelEn: 'Gas'              },
    { id: 'electricity',       labelMr: 'वीज बिल',            labelEn: 'Electricity'      },
    { id: 'salary',            labelMr: 'पगार',               labelEn: 'Salary'           },
    { id: 'rent',              labelMr: 'भाडे',               labelEn: 'Rent'             },
    { id: 'cleaning_material', labelMr: 'साफसफाई',            labelEn: 'Cleaning'         },
    { id: 'pest_control',      labelMr: 'कीटकनाशक',           labelEn: 'Pest Control'     },
    { id: 'parcel_packing',    labelMr: 'पॅकिंग',             labelEn: 'Packing'          },
    { id: 'water',             labelMr: 'पाणी',               labelEn: 'Water'            },
    { id: 'maintenance',       labelMr: 'दुरुस्ती',            labelEn: 'Maintenance'      },
    { id: 'equipment',         labelMr: 'उपकरण',              labelEn: 'Equipment'        },
    { id: 'advertising',       labelMr: 'जाहिरात',            labelEn: 'Advertising'      },
    { id: 'other',             labelMr: 'इतर',                labelEn: 'Other'            },
  ]

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
    if (cart.length === 0) { toast.error(t('आयटम निवडा', 'Select items first')); return }
    if (orderType === 'table' && !tableNumber) { toast.error(t('टेबल नंबर टाका', 'Enter table number')); return }
    setSaving(true)
    try {
      const total   = getTotal()
      const orderDT = new Date(`${orderDate}T${orderTime}:00`).toISOString()
      const { data: order, error: oe } = await supabase
        .from('orders')
        .insert({
          order_type:   orderType,
          table_number: orderType === 'table' ? tableNumber : null,
          status:       'completed',
          payment_mode: paymentMode,
          total_amount: total,
          created_at:   orderDT,
          completed_at: orderDT,
        })
        .select().single()
      if (oe) throw oe
      const { error: ie } = await supabase.from('order_items').insert(
        cart.map(item => ({ order_id: order.id, menu_item_id: item.id, quantity: item.qty, unit_price: item.price }))
      )
      if (ie) throw ie
      setLastOrder({ ...order, items: [...cart], total })
      setCart([])
      setTableNumber('')
      setShowContact(false)
      setContactName('')
      setContactPhone('')
      if (paymentMode === 'zomato') {
        toast.success(t('Zomato ऑर्डर नोंदवली!', 'Zomato order saved!'),
          { duration: 4000, style: { background: ZOMATO_LIGHT, color: '#c0392b' } })
      } else {
        toast.success(t('ऑर्डर पूर्ण!', 'Order complete!'),
          { style: { background: COLORS.tealLight, color: COLORS.tealDark } })
      }
    } catch (e) { toast.error('Error: ' + e.message) }
    setSaving(false)
  }

  async function saveExpense() {
    if (!expForm.amount) { toast.error(t('रक्कम टाका', 'Enter amount')); return }
    setSavingExp(true)
    try {
      const { error } = await supabase.from('expenses').insert({
        category:     expForm.category,
        amount:       parseInt(expForm.amount),
        description:  expForm.description || null,
        expense_date: expForm.expense_date,
      })
      if (error) throw error
      toast.success(t('खर्च जतन झाला!', 'Expense saved!'),
        { style: { background: COLORS.tealLight, color: COLORS.tealDark } })
      setExpForm({
        category: 'raw_material', amount: '', description: '',
        expense_date: new Date().toISOString().split('T')[0],
      })
    } catch (e) { toast.error('Error: ' + e.message) }
    setSavingExp(false)
  }

  async function saveCashBalance(type) {
    setSavingCash(true)
    try {
      const updates = type === 'open'
        ? { open_balance: parseInt(openBal) || 0 }
        : { close_balance: parseInt(closeBal) || 0 }
      const { error } = await supabase.from('cash_balance').upsert({
        balance_date: cashDate,
        ...updates,
        notes:      cashNotes || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'balance_date' })
      if (error) throw error
      toast.success(
        type === 'open'
          ? t('ओपनिंग बॅलन्स सेव्ह!', 'Opening balance saved!')
          : t('क्लोजिंग बॅलन्स सेव्ह!', 'Closing balance saved!'),
        { style: { background: COLORS.tealLight, color: COLORS.tealDark } }
      )
      if (type === 'open') setOpenBal('')
      else setCloseBal('')
    } catch (e) { toast.error('Error: ' + e.message) }
    setSavingCash(false)
  }

  async function saveCustomerContact() {
    if (!contactPhone && !contactName) { toast.error(t('नाव किंवा नंबर टाका', 'Enter name or phone')); return }
    setSavingContact(true)
    try {
      const { error } = await supabase.from('customers').upsert({
        phone:         contactPhone || null,
        name:          contactName  || null,
        last_order_id: lastOrder?.id || null,
        last_visit:    new Date().toISOString().split('T')[0],
      }, { onConflict: 'phone' })
      if (error) throw error
      toast.success(t('कॉन्टॅक्ट सेव्ह झाला! 🎉', 'Contact saved! 🎉'),
        { style: { background: COLORS.tealLight, color: COLORS.tealDark } })
      setShowContact(false)
      setContactName('')
      setContactPhone('')
    } catch (e) { toast.error('Error: ' + e.message) }
    setSavingContact(false)
  }

  async function printBill() {
    if (!lastOrder) return
    try { await generateCustomerBill(lastOrder, lastOrder.items) }
    catch (e) { toast.error('Bill error: ' + e.message) }
  }

  if (loading) return <div style={s.centered}>{t('लोड होत आहे...', 'Loading...')}</div>

  const tabs = [
    { id: 'order',   labelMr: '🍽️ ऑर्डर',  labelEn: '🍽️ Order'  },
    { id: 'expense', labelMr: '💸 खर्च',    labelEn: '💸 Expense' },
    { id: 'cash',    labelMr: '💵 कॅश',     labelEn: '💵 Cash'    },
  ]

  return (
    <div style={s.container}>
      <Toaster position="top-center" />

      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logo}>YM</div>
          <div>
            <div style={s.title}>{lang === 'mr' ? 'योगेश्वरी मिसळ' : 'Yogeshwari Misal'}</div>
            <div style={s.sub}>{tabs.find(t => t.id === activeTab)?.[lang === 'mr' ? 'labelMr' : 'labelEn']}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={s.langBtn} onClick={() => i18n.changeLanguage(lang === 'mr' ? 'en' : 'mr')}>
            {lang === 'mr' ? 'EN' : 'मराठी'}
          </button>
          <a href="/pos"   style={s.navBtn}>{t('टेबल', 'Tables')}</a>
          <a href="/admin" style={s.navBtn}>{t('ऍडमिन', 'Admin')}</a>
        </div>
      </div>

      <div style={s.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...s.tabBtn,
              background:  activeTab === tab.id ? COLORS.primary : 'transparent',
              color:       activeTab === tab.id ? '#FAF6EC'       : COLORS.inkLight,
              borderBottom: activeTab === tab.id ? `3px solid ${COLORS.gold}` : '3px solid transparent',
            }}
          >
            {lang === 'mr' ? tab.labelMr : tab.labelEn}
            {tab.id === 'order' && cartCount > 0 && (
              <span style={s.tabBadge}>{cartCount}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'order' && (
        <OrderTab
          lang={lang} t={t}
          orderType={orderType} setOrderType={setOrderType}
          tableNumber={tableNumber} setTableNumber={setTableNumber}
          orderDate={orderDate} setOrderDate={setOrderDate}
          orderTime={orderTime} setOrderTime={setOrderTime}
          isBackdated={isBackdated}
          regular={regular} extras={extras} beverages={beverages}
          cart={cart} addItem={addItem} removeItem={removeItem}
          getTotal={getTotal} saving={saving} completeOrder={completeOrder}
          lastOrder={lastOrder} showContact={showContact}
          setShowContact={setShowContact}
          contactName={contactName} setContactName={setContactName}
          contactPhone={contactPhone} setContactPhone={setContactPhone}
          savingContact={savingContact} saveCustomerContact={saveCustomerContact}
          printBill={printBill}
        />
      )}

      {activeTab === 'expense' && (
        <ExpenseTab
          lang={lang} t={t}
          form={expForm} setForm={setExpForm}
          saving={savingExp} onSave={saveExpense}
          EXPENSE_CATS={EXPENSE_CATS}
        />
      )}

      {activeTab === 'cash' && (
        <CashTab
          lang={lang} t={t}
          cashDate={cashDate} setCashDate={setCashDate}
          openBal={openBal} setOpenBal={setOpenBal}
          closeBal={closeBal} setCloseBal={setCloseBal}
          cashNotes={cashNotes} setCashNotes={setCashNotes}
          saving={savingCash} onSave={saveCashBalance}
        />
      )}
    </div>
  )
}

function OrderTab({
  lang, t, orderType, setOrderType, tableNumber, setTableNumber,
  orderDate, setOrderDate, orderTime, setOrderTime, isBackdated,
  regular, extras, beverages, cart, addItem, removeItem,
  getTotal, saving, completeOrder, lastOrder,
  showContact, setShowContact, contactName, setContactName,
  contactPhone, setContactPhone, savingContact, saveCustomerContact, printBill,
}) {
  return (
    <div>
      <div style={s.typeBar}>
        {[
          { id: 'table',  labelMr: '🪑 टेबल',   labelEn: '🪑 Table',  color: COLORS.primary },
          { id: 'parcel', labelMr: '📦 पार्सल', labelEn: '📦 Parcel', color: COLORS.teal    },
          { id: 'zomato', labelMr: '🛵 झोमॅटो', labelEn: '🛵 Zomato', color: '#E23744'      },
        ].map(ot => (
          <button
            key={ot.id}
            onClick={() => { setOrderType(ot.id); setTableNumber('') }}
            style={{
              ...s.typeBtn,
              background:  orderType === ot.id ? ot.color : COLORS.bgCard,
              color:       orderType === ot.id ? '#FAF6EC' : COLORS.inkLight,
              borderColor: orderType === ot.id ? ot.color  : COLORS.border,
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
          🛵 {t('Zomato — पेमेंट ४-५ दिवसांत येईल', 'Zomato — Payment in 4-5 business days')}
        </div>
      )}

      <div style={s.dateBar}>
        <span style={s.dateLabel}>📅</span>
        <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} style={s.dateInput} />
        <input type="time" value={orderTime} onChange={e => setOrderTime(e.target.value)} style={s.dateInput} />
        {isBackdated
          ? <div style={s.backdatedBadge}>{t('मागील तारीख', 'Backdated')}</div>
          : <span style={s.todayLabel}>{t('आज ✓', 'Today ✓')}</span>
        }
      </div>

      <div style={s.menuSection}>
        {regular.length > 0 && (
          <>
            <div style={s.catLabel}>{t('जेवण', 'Meals')}</div>
            <div style={s.grid}>
              {regular.map(item => <Tile key={item.id} item={item} cart={cart} onAdd={addItem} lang={lang} color={COLORS.primary} />)}
            </div>
          </>
        )}
        {extras.length > 0 && (
          <>
            <div style={{ ...s.catLabel, color: COLORS.gold }}>{t('अतिरिक्त', 'Extras')}</div>
            <div style={s.grid}>
              {extras.map(item => <Tile key={item.id} item={item} cart={cart} onAdd={addItem} lang={lang} color={COLORS.gold} />)}
            </div>
          </>
        )}
        {beverages.length > 0 && (
          <>
            <div style={{ ...s.catLabel, color: COLORS.teal }}>{t('पेय व पाणी', 'Beverages & Water')}</div>
            <div style={s.grid}>
              {beverages.map(item => <Tile key={item.id} item={item} cart={cart} onAdd={addItem} lang={lang} color={COLORS.teal} />)}
            </div>
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div style={s.cartBar}>
          <div style={s.cartList}>
            {cart.map(item => (
              <div key={item.id} style={s.cartRow}>
                <span style={s.cartName}>{lang === 'mr' ? item.name_mr : item.name_en}</span>
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
            <button onClick={() => completeOrder('zomato')} disabled={saving}
              style={{ ...s.zomatoPayBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? t('सेव्ह...', 'Saving...') : `🛵 Zomato — ₹${getTotal()}`}
            </button>
          ) : (
            <div style={s.payBtns}>
              <button onClick={() => completeOrder('cash')} disabled={saving}
                style={{ ...s.cashBtn, opacity: saving ? 0.7 : 1 }}>
                {saving ? '...' : `₹${getTotal()} ${t('रोख', 'Cash')}`}
              </button>
              <button onClick={() => completeOrder('online')} disabled={saving}
                style={{ ...s.onlineBtn, opacity: saving ? 0.7 : 1 }}>
                {saving ? '...' : `₹${getTotal()} UPI`}
              </button>
            </div>
          )}
          <button onClick={() => { }} style={s.clearBtn} onClickCapture={() => { if(window.confirm(t('साफ करायचे?','Clear cart?'))) { removeItem && cart.forEach(i => { for(let q=0;q<i.qty;q++) removeItem(i.id) }) }}}>
            {t('साफ करा', 'Clear')}
          </button>
        </div>
      )}

      {lastOrder && (
        <div style={s.lastOrderSection}>
          <div style={{
            ...s.lastOrderBanner,
            background: lastOrder.payment_mode === 'zomato' ? '#fce8ea' : COLORS.tealLight,
            color:      lastOrder.payment_mode === 'zomato' ? '#c0392b' : COLORS.tealDark,
            border:     `1px solid ${lastOrder.payment_mode === 'zomato' ? '#E23744' : COLORS.teal}`,
          }}>
            {lastOrder.payment_mode === 'zomato' ? '🛵' : '✅'}
            {' '}#{lastOrder.order_number} — ₹{lastOrder.total} —{' '}
            {lastOrder.payment_mode === 'zomato' ? t('Zomato (प्रलंबित)', 'Zomato (pending)')
              : lastOrder.payment_mode === 'cash' ? t('रोख', 'Cash') : 'UPI'}
          </div>
          <div style={s.actionBtns}>
            <button onClick={printBill} style={s.billBtn}>🧾 {t('बिल', 'Bill')}</button>
            <button onClick={() => setShowContact(!showContact)} style={s.contactBtn}>
              📱 {t('संपर्क', 'Contact')}
            </button>
          </div>
          {showContact && (
            <div style={s.contactForm}>
              <div style={s.contactTitle}>
                📱 {t('WhatsApp/FB साठी संपर्क जोडा', 'Add to WhatsApp/FB community')}
              </div>
              <input type="text" placeholder={t('नाव (ऐच्छिक)', 'Name (optional)')}
                value={contactName} onChange={e => setContactName(e.target.value)} style={s.contactInput} />
              <input type="tel" placeholder={t('मोबाईल नंबर (ऐच्छिक)', 'Mobile (optional)')}
                value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={s.contactInput} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveCustomerContact} disabled={savingContact}
                  style={{ ...s.saveContactBtn, flex: 1 }}>
                  {savingContact ? t('सेव्ह होतोय ...', 'Saving...') : t('सेव्ह करा', 'Save')}
                </button>
                <button onClick={() => { setShowContact(false); setContactName(''); setContactPhone('') }}
                  style={{ ...s.skipBtn, flex: 1 }}>
                  {t('वगळा', 'Skip')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ExpenseTab({ lang, t, form, setForm, saving, onSave, EXPENSE_CATS }) {
  return (
    <div style={s.tabContent}>
      <div style={s.sectionCard}>
        <div style={s.sectionTitle}>{t('नवा खर्च जोडा', 'Add Expense')}</div>

        <div style={s.expCatGrid}>
          {EXPENSE_CATS.map(cat => (
            <button
              key={cat.id}
              onClick={() => setForm(f => ({ ...f, category: cat.id }))}
              style={{
                ...s.catChip,
                background:  form.category === cat.id ? COLORS.primary : COLORS.bgCard,
                color:       form.category === cat.id ? '#FAF6EC'       : COLORS.inkLight,
                borderColor: form.category === cat.id ? COLORS.primary  : COLORS.border,
                fontWeight:  form.category === cat.id ? 700              : 400,
              }}
            >
              {lang === 'mr' ? cat.labelMr : cat.labelEn}
            </button>
          ))}
        </div>

        <input
          type="number"
          placeholder={t('रक्कम (Rs.) *', 'Amount (Rs.) *')}
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          style={s.formInput}
        />
        <input
          type="text"
          placeholder={t('नोट (ऐच्छिक)', 'Note (optional)')}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          style={s.formInput}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: COLORS.textGray, fontWeight: 600 }}>
            📅 {t('तारीख', 'Date')}:
          </span>
          <input
            type="date"
            value={form.expense_date}
            onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
            style={{ ...s.formInput, flex: 1, marginBottom: 0 }}
          />
        </div>
        <button
          onClick={onSave}
          disabled={saving || !form.amount}
          style={{ ...s.primaryBtn, opacity: saving || !form.amount ? 0.6 : 1 }}
        >
          {saving ? t('सेव्ह होतोय...', 'Saving...') : t('खर्च जोडा', 'Add Expense')}
        </button>
      </div>
    </div>
  )
}

function CashTab({ lang, t, cashDate, setCashDate, openBal, setOpenBal, closeBal, setCloseBal, cashNotes, setCashNotes, saving, onSave }) {
  return (
    <div style={s.tabContent}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: COLORS.textGray, fontWeight: 600 }}>
          📅 {t('तारीख', 'Date')}:
        </span>
        <input
          type="date"
          value={cashDate}
          onChange={e => setCashDate(e.target.value)}
          style={{ ...s.formInput, flex: 1, marginBottom: 0 }}
        />
      </div>

      <div style={s.sectionCard}>
        <div style={s.cashCardHeader}>
          <span style={s.cashIcon}>🌅</span>
          <div>
            <div style={s.cashCardTitle}>{t('ओपनिंग बॅलन्स', 'Opening Balance')}</div>
            <div style={s.cashCardSub}>{t('दिवस सुरू होताना किती रोख होते', 'Cash at start of day')}</div>
          </div>
        </div>
        <input
          type="number"
          placeholder="₹ 0"
          value={openBal}
          onChange={e => setOpenBal(e.target.value)}
          style={{ ...s.formInput, fontSize: 20, fontWeight: 700, color: COLORS.teal }}
        />
        <button
          onClick={() => onSave('open')}
          disabled={saving || !openBal}
          style={{ ...s.tealBtn, opacity: saving || !openBal ? 0.6 : 1 }}
        >
          {saving ? t('सेव्ह...', 'Saving...') : t('ओपनिंग बॅलन्स सेव्ह करा', 'Save Opening Balance')}
        </button>
      </div>

      <div style={{ ...s.sectionCard, borderColor: COLORS.primary }}>
        <div style={s.cashCardHeader}>
          <span style={s.cashIcon}>🌙</span>
          <div>
            <div style={{ ...s.cashCardTitle, color: COLORS.primary }}>
              {t('क्लोजिंग बॅलन्स (EOD)', 'Closing Balance (EOD)')}
            </div>
            <div style={s.cashCardSub}>
              {t('दिवस संपताना किती रोख drawer मध्ये होते', 'Cash in drawer at end of day')}
            </div>
          </div>
        </div>
        <input
          type="number"
          placeholder="₹ 0"
          value={closeBal}
          onChange={e => setCloseBal(e.target.value)}
          style={{ ...s.formInput, fontSize: 20, fontWeight: 700, color: COLORS.primary }}
        />
        <input
          type="text"
          placeholder={t('नोट (ऐच्छिक)', 'Notes (optional)')}
          value={cashNotes}
          onChange={e => setCashNotes(e.target.value)}
          style={s.formInput}
        />
        <button
          onClick={() => onSave('close')}
          disabled={saving || !closeBal}
          style={{ ...s.primaryBtn, opacity: saving || !closeBal ? 0.6 : 1 }}
        >
          {saving ? t('सेव्ह...', 'Saving...') : t('क्लोज बॅलन्स सेव्ह करा', 'Save Closing Balance')}
        </button>
      </div>

      <div style={s.cashInfoBox}>
        <div style={s.cashInfoTitle}>ℹ️ {t('हे कशासाठी?', 'What is this for?')}</div>
        <div style={s.cashInfoText}>
          {t(
            'हे फक्त नोंदणीसाठी आहे. P&L मध्ये count होत नाही. नंतर Reports मध्ये तारखेनुसार पाहता येईल.',
            'This is for reference only. Not counted in P&L. View by date in Reports later.'
          )}
        </div>
      </div>
    </div>
  )
}

function Tile({ item, cart, onAdd, lang, color }) {
  const inCart  = cart.find(c => c.id === item.id)
  const lightBg = color === COLORS.teal  ? COLORS.tealLight
                : color === COLORS.gold  ? COLORS.goldLight
                : COLORS.primaryLight
  return (
    <div
      onClick={() => onAdd(item)}
      style={{
        ...ts.tile,
        borderColor: inCart ? color : COLORS.border,
        background:  inCart ? lightBg : COLORS.bgCard,
      }}
    >
      {inCart && <div style={{ ...ts.badge, background: color }}>{inCart.qty}</div>}
      <div style={ts.name}>{lang === 'mr' ? item.name_mr : item.name_en}</div>
      <div style={{ ...ts.price, color }}>{formatCurrency(item.price)}</div>
    </div>
  )
}

const ts = {
  tile: {
    borderRadius: 10, border: '1.5px solid',
    padding: '11px 6px', textAlign: 'center',
    cursor: 'pointer', position: 'relative',
    minHeight: 68, display: 'flex',
    flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', transition: 'all 0.1s',
  },
  badge: {
    position: 'absolute', top: -7, right: -7,
    width: 22, height: 22, borderRadius: '50%',
    color: '#fff', fontSize: 12, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  name:  { fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: COLORS.ink },
  price: { fontSize: 13, marginTop: 5, fontWeight: 700 },
}

const s = {
  container:       { minHeight: '100vh', background: COLORS.bg, fontFamily: 'sans-serif', paddingBottom: 20 },
  centered:        { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: COLORS.textGray },
  header:          { background: COLORS.ink, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft:      { display: 'flex', alignItems: 'center', gap: 10 },
  logo:            { width: 38, height: 38, borderRadius: 10, background: COLORS.primary, color: COLORS.goldSoft, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title:           { color: COLORS.goldSoft, fontSize: 16, fontWeight: 700 },
  sub:             { color: 'rgba(226,198,138,0.7)', fontSize: 11 },
  langBtn:         { background: 'rgba(226,198,138,0.15)', border: '1px solid rgba(226,198,138,0.4)', color: COLORS.goldSoft, padding: '5px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer' },
  navBtn:          { background: 'rgba(226,198,138,0.1)', border: '1px solid rgba(226,198,138,0.3)', padding: '5px 10px', borderRadius: 20, color: COLORS.goldSoft, textDecoration: 'none', fontSize: 11 },
  tabBar:          { display: 'flex', background: COLORS.ink, borderBottom: `2px solid ${COLORS.gold}` },
  tabBtn:          { flex: 1, padding: '11px 6px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s', position: 'relative' },
  tabBadge:        { position: 'absolute', top: 6, right: '8%', background: COLORS.primary, color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  typeBar:         { display: 'flex', gap: 8, padding: '10px 12px', background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.borderLight}`, alignItems: 'center', flexWrap: 'wrap' },
  typeBtn:         { padding: '8px 14px', borderRadius: 20, border: '2px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' },
  tableInput:      { padding: '8px 12px', borderRadius: 20, border: `1px solid ${COLORS.border}`, width: 100, fontSize: 14, background: COLORS.bgCard, color: COLORS.ink },
  zomatoBanner:    { background: '#fce8ea', color: '#c0392b', padding: '8px 14px', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #f5c0c4' },
  dateBar:         { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: COLORS.goldLight, borderBottom: `1px solid ${COLORS.goldSoft}`, flexWrap: 'wrap' },
  dateLabel:       { fontSize: 14 },
  dateInput:       { padding: '6px 10px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, background: COLORS.bgCard, color: COLORS.ink },
  backdatedBadge:  { background: COLORS.gold, color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  todayLabel:      { fontSize: 11, color: COLORS.teal, fontWeight: 600 },
  menuSection:     { padding: '10px 12px' },
  catLabel:        { fontSize: 11, fontWeight: 700, color: COLORS.textGray, letterSpacing: '0.05em', marginBottom: 8, marginTop: 10, textTransform: 'uppercase' },
  grid:            { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 6 },
  cartBar:         { position: 'sticky', bottom: 0, background: COLORS.bgCard, borderTop: `2px solid ${COLORS.border}`, padding: '10px 12px', zIndex: 100 },
  cartList:        { marginBottom: 8 },
  cartRow:         { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `0.5px solid ${COLORS.borderLight}` },
  cartName:        { flex: 1, fontSize: 13, color: COLORS.ink },
  qRow:            { display: 'flex', alignItems: 'center', gap: 6 },
  qBtn:            { width: 28, height: 28, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.bg, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.ink },
  qNum:            { fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center', color: COLORS.ink },
  cartAmt:         { fontSize: 13, color: COLORS.primary, fontWeight: 600, minWidth: 45, textAlign: 'right' },
  totalRow:        { display: 'flex', justifyContent: 'space-between', padding: '7px 0 9px', borderTop: `1px solid ${COLORS.border}` },
  totalLabel:      { fontSize: 15, fontWeight: 600, color: COLORS.ink },
  totalVal:        { fontSize: 20, fontWeight: 700, color: COLORS.primary },
  payBtns:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 },
  cashBtn:         { background: COLORS.teal, color: '#FAF6EC', border: 'none', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  onlineBtn:       { background: COLORS.ink, color: COLORS.goldSoft, border: 'none', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  zomatoPayBtn:    { width: '100%', background: '#E23744', color: '#fff', border: 'none', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 6 },
  clearBtn:        { width: '100%', background: 'transparent', color: COLORS.textGray, border: `1px solid ${COLORS.border}`, padding: '8px', borderRadius: 10, fontSize: 13, cursor: 'pointer', marginTop: 4 },
  lastOrderSection:{ margin: '10px 12px 0' },
  lastOrderBanner: { borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 8 },
  actionBtns:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 },
  billBtn:         { background: COLORS.bgCard, border: `2px solid ${COLORS.primary}`, color: COLORS.primary, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  contactBtn:      { background: COLORS.tealLight, border: `2px solid ${COLORS.teal}`, color: COLORS.tealDark, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  contactForm:     { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14 },
  contactTitle:    { fontSize: 12, color: COLORS.tealDark, fontWeight: 600, marginBottom: 10 },
  contactInput:    { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14, marginBottom: 8, boxSizing: 'border-box', background: COLORS.bg, color: COLORS.ink },
  saveContactBtn:  { background: COLORS.teal, color: '#FAF6EC', border: 'none', padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  skipBtn:         { background: COLORS.bg, color: COLORS.textGray, border: `1px solid ${COLORS.border}`, padding: '11px', borderRadius: 10, fontSize: 13, cursor: 'pointer' },
  tabContent:      { padding: '12px' },
  sectionCard:     { background: COLORS.bgCard, borderRadius: 14, padding: 16, marginBottom: 14, border: `1px solid ${COLORS.border}` },
  sectionTitle:    { fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 12, letterSpacing: '0.03em' },
  expCatGrid:      { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 },
  catChip:         { padding: '7px 4px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 11, fontWeight: 500, textAlign: 'center' },
  formInput:       { width: '100%', padding: '11px 12px', borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14, marginBottom: 10, boxSizing: 'border-box', background: COLORS.bg, color: COLORS.ink },
  primaryBtn:      { width: '100%', background: COLORS.primary, color: '#FAF6EC', border: 'none', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  tealBtn:         { width: '100%', background: COLORS.teal, color: '#FAF6EC', border: 'none', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  cashCardHeader:  { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  cashIcon:        { fontSize: 28 },
  cashCardTitle:   { fontSize: 14, fontWeight: 700, color: COLORS.teal },
  cashCardSub:     { fontSize: 11, color: COLORS.textGray, marginTop: 2 },
  cashInfoBox:     { background: COLORS.goldLight, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.goldSoft}` },
  cashInfoTitle:   { fontSize: 12, fontWeight: 700, color: COLORS.gold, marginBottom: 6 },
  cashInfoText:    { fontSize: 12, color: COLORS.inkLight, lineHeight: 1.5 },
}