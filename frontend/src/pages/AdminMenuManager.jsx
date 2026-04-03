import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import Header from '../components/Header'
import { useMenu } from '../hooks/useMenu'
import { COLORS } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'

export default function AdminMenuManager() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const t = (mr, en) => lang === 'mr' ? mr : en
  const { menu, loading, addMenuItem, updateMenuItem, toggleMenuItem } = useMenu(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({
    name_en: '', name_mr: '', price: '',
    category: 'regular', is_bulk: false,
  })
  const [saving, setSaving] = useState(false)

  function resetForm() {
    setForm({ name_en: '', name_mr: '', price: '', category: 'regular', is_bulk: false })
    setShowAdd(false)
    setEditingItem(null)
  }

  function startEdit(item) {
    setEditingItem(item)
    setForm({
      name_en: item.name_en,
      name_mr: item.name_mr || '',
      price: item.price,
      category: item.category || 'regular',
      is_bulk: item.is_bulk || false,
    })
    setShowAdd(false)
  }

  async function handleSave() {
    if (!form.name_en || !form.price) return
    setSaving(true)
    const data = {
      name_en: form.name_en,
      name_mr: form.name_mr,
      price: parseInt(form.price),
      category: form.category,
      is_bulk: form.is_bulk,
    }
    if (editingItem) {
      await updateMenuItem(editingItem.id, data)
    } else {
      await addMenuItem({ ...data, is_active: true })
    }
    resetForm()
    setSaving(false)
  }

  const regularItems = menu.filter(i => !i.is_bulk)
  const bulkItems = menu.filter(i => i.is_bulk)

  if (loading) return <div style={styles.centered}>Loading...</div>

  return (
    <div style={styles.container}>
      <Toaster position="top-center" />
      <Header
        subtitle={t('मेनू व्यवस्थापन', 'Menu Manager')}
        rightContent={
          <a href="/admin" style={styles.backBtn}>{t('अॅडमिन', 'Admin')}</a>
        }
      />

      <div style={styles.content}>
        {(showAdd || editingItem) ? (
          <div style={styles.formCard}>
            <div style={styles.sectionTitle}>
              {editingItem ? t('आयटम बदला', 'Edit Item') : t('नवीन आयटम', 'New Item')}
            </div>
            <input style={styles.input} placeholder="Name in English *"
              value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
            <input style={styles.input} placeholder="मराठी नाव"
              value={form.name_mr} onChange={e => setForm(f => ({ ...f, name_mr: e.target.value }))} />
            <input style={styles.input} placeholder={t('किंमत (Rs.) *', 'Price (Rs.) *')}
              type="number" value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <select style={styles.input} value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="regular">{t('नियमित', 'Regular')}</option>
              <option value="bulk">{t('बल्क', 'Bulk')}</option>
              <option value="special">{t('स्पेशल', 'Special')}</option>
            </select>
            <label style={styles.checkRow}>
              <input type="checkbox" checked={form.is_bulk}
                onChange={e => setForm(f => ({ ...f, is_bulk: e.target.checked }))} />
              <span style={{ fontSize: 14, marginLeft: 8 }}>
                {t('बल्क ऑर्डर आयटम', 'Bulk order item')}
              </span>
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ ...styles.saveBtn, flex: 1 }}>
                {saving ? t('सेव्ह...', 'Saving...') : t('सेव्ह करा', 'Save')}
              </button>
              <button onClick={resetForm} style={{ ...styles.cancelBtn, flex: 1 }}>
                {t('रद्द करा', 'Cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} style={styles.addBtn}>
            + {t('नवीन आयटम जोडा', 'Add New Item')}
          </button>
        )}

        <div style={styles.sectionTitle}>{t('नियमित मेनू', 'Regular Menu')} ({regularItems.length})</div>
        {regularItems.map(item => (
          <MenuItemRow key={item.id} item={item} lang={lang} t={t}
            onEdit={startEdit} onToggle={toggleMenuItem} />
        ))}

        <div style={styles.sectionTitle}>{t('बल्क आयटम', 'Bulk Items')} ({bulkItems.length})</div>
        {bulkItems.map(item => (
          <MenuItemRow key={item.id} item={item} lang={lang} t={t}
            onEdit={startEdit} onToggle={toggleMenuItem} />
        ))}
      </div>
    </div>
  )
}

function MenuItemRow({ item, lang, t, onEdit, onToggle }) {
  return (
    <div style={{
      ...styles.itemRow,
      opacity: item.is_active ? 1 : 0.5,
      borderLeft: `4px solid ${item.is_active ? COLORS.teal : '#ccc'}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={styles.itemName}>
          {lang === 'mr' ? (item.name_mr || item.name_en) : item.name_en}
        </div>
        <div style={styles.itemSub}>
          {item.name_en} · {item.is_bulk ? 'Bulk' : 'Regular'}
        </div>
      </div>
      <div style={styles.itemPrice}>{formatCurrency(item.price)}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onEdit(item)} style={styles.editBtn}>
          {t('बदल', 'Edit')}
        </button>
        <button
          onClick={() => onToggle(item.id, !item.is_active)}
          style={{
            ...styles.toggleBtn,
            background: item.is_active ? '#FCEBEB' : '#E1F5EE',
            color: item.is_active ? '#791F1F' : '#085041',
          }}>
          {item.is_active ? t('बंद', 'Off') : t('चालू', 'On')}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: COLORS.bg, fontFamily: 'sans-serif' },
  centered: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  backBtn: { background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: 20, color: '#fff', textDecoration: 'none', fontSize: 12 },
  content: { padding: 14 },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: '0.05em' },
  formCard: { background: '#fff', borderRadius: 12, padding: 14, marginBottom: 14, border: '1px solid #eee' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' },
  checkRow: { display: 'flex', alignItems: 'center', marginBottom: 12, cursor: 'pointer' },
  saveBtn: { background: COLORS.primary, color: '#fff', border: 'none', padding: 11, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { background: '#f5f5f5', color: '#666', border: '1px solid #ddd', padding: 11, borderRadius: 10, fontSize: 14, cursor: 'pointer' },
  addBtn: { width: '100%', background: COLORS.primaryLight, color: COLORS.primary, border: `2px dashed ${COLORS.primary}`, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 4 },
  itemRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', borderRadius: 10, marginBottom: 8, border: '1px solid #eee' },
  itemName: { fontSize: 13, fontWeight: 600 },
  itemSub: { fontSize: 11, color: '#aaa', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: 700, color: COLORS.primary, minWidth: 55, textAlign: 'right' },
  editBtn: { background: '#E6F1FB', color: '#0C447C', border: 'none', padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' },
  toggleBtn: { border: 'none', padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 },
}