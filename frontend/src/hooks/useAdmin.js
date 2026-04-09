import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import { getTodayDate } from '../utils/formatters'
import toast from 'react-hot-toast'

export function useAdmin() {
  const [todayStats, setTodayStats] = useState({
    revenue: 0,
    orders: 0,
    cashOrders: 0,
    onlineOrders: 0,
    topDish: null,
  })
  const [expenses, setExpenses] = useState([])
  const [todayExpenses, setTodayExpenses] = useState(0)
  const [inventory, setInventory] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([
      loadTodayStats(),
      loadExpenses(),
      loadInventory(),
      loadTodayShifts(),
    ])
    setLoading(false)
  }

  async function loadTodayStats() {
    const today = getTodayDate()

    const { data: orders } = await supabase
      .from('orders')
      .select(`*, order_items(*, menu_item:menu_items(*))`)
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`)

    if (!orders) return

    const revenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
    const cashOrders = orders.filter(o => o.payment_mode === 'cash').length
    const onlineOrders = orders.filter(o => o.payment_mode === 'online').length

    const dishCount = {}
    orders.forEach(order => {
      order.order_items?.forEach(oi => {
        const name = oi.menu_item?.name_en || 'Unknown'
        dishCount[name] = (dishCount[name] || 0) + oi.quantity
      })
    })
    const topDish = Object.entries(dishCount).sort((a, b) => b[1] - a[1])[0]

    const cashRevenue   = orders.filter(o => o.payment_mode === 'cash').reduce((s,o) => s + (o.total_amount||0), 0)
    const onlineRevenue = orders.filter(o => o.payment_mode === 'online').reduce((s,o) => s + (o.total_amount||0), 0)

setTodayStats({
  revenue,
  orders: orders.length,
  cashOrders,
  onlineOrders,
  cashRevenue,
  onlineRevenue,
  topDish: topDish ? { name: topDish[0], count: topDish[1] } : null,
})
  }

  async function loadExpenses() {
    const today = getTodayDate()
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setExpenses(data)
      const todayTotal = data
        .filter(e => e.expense_date === today)
        .reduce((s, e) => s + (e.amount || 0), 0)
      setTodayExpenses(todayTotal)
    }
  }

  async function loadInventory() {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .order('item_name')
    if (data) setInventory(data)
  }

  async function loadTodayShifts() {
    const today = getTodayDate()
    const { data } = await supabase
      .from('shifts')
      .select(`*, user:users(name, name_mr, initials)`)
      .eq('date', today)
      .order('check_in', { ascending: true })
    if (data) setShifts(data)
  }

  async function addExpense(expense) {
    const { error } = await supabase.from('expenses').insert(expense)
    if (error) { toast.error('Failed to add expense'); return false }
    toast.success('Expense added!')
    loadExpenses()
    return true
  }

  async function updateInventoryItem(id, updates) {
    const { error } = await supabase
      .from('inventory').update(updates).eq('id', id)
    if (error) { toast.error('Update failed'); return false }
    toast.success('Stock updated!')
    loadInventory()
    return true
  }

  async function addInventoryItem(item) {
    const { error } = await supabase.from('inventory').insert(item)
    if (error) { toast.error('Failed to add item'); return false }
    toast.success('Item added!')
    loadInventory()
    return true
  }

  return {
    todayStats, expenses, todayExpenses,
    inventory, shifts, loading,
    addExpense, updateInventoryItem,
    addInventoryItem, reload: loadAll,
  }
}