import { useState } from 'react'
import { supabase } from '../../api/supabase'
import toast from 'react-hot-toast'
import { sharedStyles } from './styles'

export default function MenuTab({ menuItems, setMenuItems }) {
  const styles = sharedStyles
  const [newItemNameEn, setNewItemNameEn] = useState('')
  const [newItemNameMr, setNewItemNameMr] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('regular')
  const [newItemIsBulk, setNewItemIsBulk] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  async function addMenuItem() {
    if (!newItemNameEn || !newItemPrice) {
      toast.error('Name and price required')
      return
    }
    const { error } = await supabase
      .from('menu_items')
      .insert({
        name_en: newItemNameEn,
        name_mr: newItemNameMr || newItemNameEn,
        price: parseInt(newItemPrice),
        category: newItemCategory,
        is_bulk: newItemIsBulk,
        is_active: true,
      })
    if (!error) {
      toast.success('Item added')
      setNewItemNameEn('')
      setNewItemNameMr('')
      setNewItemPrice('')
      setNewItemCategory('regular')
      setNewItemIsBulk(false)
      // refresh
      const { data } = await supabase.from('menu_items').select('*').order('category').order('price')
      setMenuItems(data || [])
    } else {
      toast.error('Failed to add')
    }
  }

  async function updateMenuItem() {
    const { error } = await supabase
      .from('menu_items')
      .update({
        name_en: editingItem.name_en,
        name_mr: editingItem.name_mr,
        price: editingItem.price,
        category: editingItem.category,
        is_bulk: editingItem.is_bulk,
        is_active: editingItem.is_active,
      })
      .eq('id', editingItem.id)
    if (!error) {
      toast.success('Item updated')
      setEditingItem(null)
      const { data } = await supabase.from('menu_items').select('*').order('category').order('price')
      setMenuItems(data || [])
    } else {
      toast.error('Failed to update')
    }
  }

  async function toggleItemActive(id, currentActive) {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_active: !currentActive })
      .eq('id', id)
    if (!error) {
      const { data } = await supabase.from('menu_items').select('*').order('category').order('price')
      setMenuItems(data || [])
    } else toast.error('Failed to update')
  }

  async function deleteMenuItem(id) {
    if (window.confirm('Delete this item permanently?')) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id)
      if (!error) {
        toast.success('Deleted')
        const { data } = await supabase.from('menu_items').select('*').order('category').order('price')
        setMenuItems(data || [])
      } else toast.error('Failed to delete')
    }
  }

  return (
    <div>
      <div style={styles.section}>
        <h3>Add New Item</h3>
        <div style={styles.formRow}>
          <input placeholder="Name (English)" value={newItemNameEn} onChange={e => setNewItemNameEn(e.target.value)} style={styles.input} />
          <input placeholder="Name (Marathi)" value={newItemNameMr} onChange={e => setNewItemNameMr(e.target.value)} style={styles.input} />
          <input placeholder="Price (₹)" type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} style={styles.input} />
          <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} style={styles.select}>
            <option value="regular">Regular</option>
            <option value="bulk">Bulk</option>
          </select>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" checked={newItemIsBulk} onChange={e => setNewItemIsBulk(e.target.checked)} />
            Bulk Item
          </label>
          <button onClick={addMenuItem} style={styles.primaryBtn}>Add Item</button>
        </div>
      </div>

      <div style={styles.section}>
        <h3>Menu Items</h3>
        <div style={styles.menuList}>
          {menuItems.map(item => (
            <div key={item.id} style={styles.menuItemCard}>
              {editingItem?.id === item.id ? (
                <div style={styles.editForm}>
                  <input value={editingItem.name_en} onChange={e => setEditingItem({...editingItem, name_en: e.target.value})} style={styles.inputSmall} />
                  <input value={editingItem.name_mr} onChange={e => setEditingItem({...editingItem, name_mr: e.target.value})} style={styles.inputSmall} />
                  <input type="number" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: parseInt(e.target.value)})} style={styles.inputSmall} />
                  <select value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} style={styles.selectSmall}>
                    <option value="regular">Regular</option>
                    <option value="bulk">Bulk</option>
                  </select>
                  <label><input type="checkbox" checked={editingItem.is_bulk} onChange={e => setEditingItem({...editingItem, is_bulk: e.target.checked})} /> Bulk</label>
                  <button onClick={updateMenuItem} style={styles.saveBtn}>Save</button>
                  <button onClick={() => setEditingItem(null)} style={styles.cancelBtn}>Cancel</button>
                </div>
              ) : (
                <div style={styles.menuItemRow}>
                  <div><strong>{item.name_en}</strong> ({item.name_mr})</div>
                  <div>₹{item.price}</div>
                  <div>{item.category}</div>
                  <div>{item.is_bulk ? 'Bulk' : 'Regular'}</div>
                  <div>
                    <button onClick={() => toggleItemActive(item.id, item.is_active)} style={styles.toggleBtn}>
                      {item.is_active ? '✅' : '⭕'}
                    </button>
                    <button onClick={() => setEditingItem(item)} style={styles.editBtn}>✏️</button>
                    <button onClick={() => deleteMenuItem(item.id)} style={styles.deleteBtn}>🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}