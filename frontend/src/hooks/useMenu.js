import { useEffect, useState } from 'react'
import { supabase } from '../api/supabase'
import toast from 'react-hot-toast'

export function useMenu(includesBulk = false) {
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMenu()
  }, [])

  async function loadMenu() {
    setLoading(true)
    let query = supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (!includesBulk) {
      query = query.eq('is_bulk', false)
    }

    const { data, error } = await query
    if (error) toast.error('Menu load failed')
    else setMenu(data || [])
    setLoading(false)
  }

  async function addMenuItem(item) {
    const { error } = await supabase.from('menu_items').insert(item)
    if (error) { toast.error('Failed to add item'); return false }
    toast.success('Item added!')
    loadMenu()
    return true
  }

  async function updateMenuItem(id, updates) {
    const { error } = await supabase
      .from('menu_items').update(updates).eq('id', id)
    if (error) { toast.error('Failed to update'); return false }
    toast.success('Item updated!')
    loadMenu()
    return true
  }

  async function toggleMenuItem(id, isActive) {
    const { error } = await supabase
      .from('menu_items').update({ is_active: isActive }).eq('id', id)
    if (error) { toast.error('Failed to update'); return false }
    loadMenu()
    return true
  }

  return { menu, loading, addMenuItem, updateMenuItem, toggleMenuItem, reload: loadMenu }
}