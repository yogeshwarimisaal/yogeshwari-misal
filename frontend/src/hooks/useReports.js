import { useState } from 'react'
import { supabase } from '../api/supabase'

export function useReports() {
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(false)

  async function loadReport(startDate, endDate) {
    setLoading(true)

    const [ordersRes, expensesRes, shiftsRes, cashRes] = await Promise.all([
      supabase
        .from('orders')
        .select(`*, order_items(*, menu_item:menu_items(*))`)
        .eq('status', 'completed')
        .gte('completed_at', `${startDate}T00:00:00`)
        .lte('completed_at', `${endDate}T23:59:59`),
      supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate),
      supabase
        .from('shifts')
        .select(`*, user:users(name, name_mr, initials)`)
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('cash_balance')
        .select('*')
        .gte('balance_date', startDate)
        .lte('balance_date', endDate)
        .order('balance_date', { ascending: true }),
    ])

    const orders   = ordersRes.data   || []
    const expenses = expensesRes.data || []
    const shifts   = shiftsRes.data   || []
    const cashRows = cashRes.data     || []

    // ── Basic totals ─────────────────────────────────
    const totalRevenue   = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
    const totalExpenses  = expenses.reduce((s, e) => s + (e.amount || 0), 0)
    const totalOrders    = orders.length
    const cashOrders     = orders.filter(o => o.payment_mode === 'cash').length
    const onlineOrders   = orders.filter(o => o.payment_mode === 'online').length
    const zomatoOrders   = orders.filter(o => o.payment_mode === 'zomato').length
    const cashRevenue    = orders.filter(o => o.payment_mode === 'cash').reduce((s,o) => s+(o.total_amount||0),0)
    const onlineRevenue  = orders.filter(o => o.payment_mode === 'online').reduce((s,o) => s+(o.total_amount||0),0)
    const zomatoRevenue  = orders.filter(o => o.payment_mode === 'zomato').reduce((s,o) => s+(o.total_amount||0),0)

    // ── Order type breakdown ──────────────────────────
    const tableOrders   = orders.filter(o => o.order_type === 'table').length
    const parcelOrders  = orders.filter(o => o.order_type === 'parcel').length
    const zomatoTypeOrders = orders.filter(o => o.order_type === 'zomato').length
    const tableRevenue  = orders.filter(o => o.order_type === 'table').reduce((s,o) => s+(o.total_amount||0),0)
    const parcelRevenue = orders.filter(o => o.order_type === 'parcel').reduce((s,o) => s+(o.total_amount||0),0)

    // ── Dish analysis — ALL dishes ────────────────────
    const dishMap = {}
    orders.forEach(order => {
      order.order_items?.forEach(oi => {
        const key    = oi.menu_item?.name_en || 'Unknown'
        const nameMr = oi.menu_item?.name_mr || key
        const price  = oi.unit_price || 0
        if (!dishMap[key]) {
          dishMap[key] = {
            name: key, name_mr: nameMr, count: 0, revenue: 0,
            cashCount: 0, onlineCount: 0, zomatoCount: 0,
            tableCount: 0, parcelCount: 0,
          }
        }
        dishMap[key].count   += oi.quantity
        dishMap[key].revenue += price * oi.quantity
        if (order.payment_mode === 'cash')   dishMap[key].cashCount   += oi.quantity
        if (order.payment_mode === 'online') dishMap[key].onlineCount += oi.quantity
        if (order.payment_mode === 'zomato') dishMap[key].zomatoCount += oi.quantity
        if (order.order_type === 'table')    dishMap[key].tableCount  += oi.quantity
        if (order.order_type === 'parcel')   dishMap[key].parcelCount += oi.quantity
      })
    })
    const allDishes  = Object.values(dishMap).sort((a,b) => b.count - a.count)
    const topDishes  = allDishes.slice(0, 6)

    // ── Daily breakdown ───────────────────────────────
    const dailyMap = {}
    orders.forEach(o => {
      const day = o.completed_at?.split('T')[0]
      if (!day) return
      if (!dailyMap[day]) dailyMap[day] = { revenue: 0, orders: 0, cash: 0, online: 0, zomato: 0 }
      dailyMap[day].revenue += o.total_amount || 0
      dailyMap[day].orders  += 1
      if (o.payment_mode === 'cash')   dailyMap[day].cash   += 1
      if (o.payment_mode === 'online') dailyMap[day].online += 1
      if (o.payment_mode === 'zomato') dailyMap[day].zomato += 1
    })
    const dailyRevenue = {}
    Object.entries(dailyMap).forEach(([d,v]) => { dailyRevenue[d] = v.revenue })

    // ── Daily expense breakdown ───────────────────────
    const dailyExpenseMap = {}
    expenses.forEach(e => {
      const day = e.expense_date
      if (!dailyExpenseMap[day]) dailyExpenseMap[day] = { total: 0, items: [] }
      dailyExpenseMap[day].total += e.amount || 0
      dailyExpenseMap[day].items.push(e)
    })

    // ── Expense by category ───────────────────────────
    const expenseByCategory = {}
    expenses.forEach(e => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount
    })

    // ── Staff performance ─────────────────────────────
    const staffMap = {}
    shifts.forEach(shift => {
      const uid = shift.user_id
      if (!staffMap[uid]) {
        staffMap[uid] = {
          name: shift.user?.name || 'Unknown',
          name_mr: shift.user?.name_mr || '',
          initials: shift.user?.initials || '?',
          totalMins: 0, shifts: 0,
        }
      }
      if (shift.check_in && shift.check_out) {
        const mins = Math.floor((new Date(shift.check_out) - new Date(shift.check_in)) / 60000)
        staffMap[uid].totalMins += mins
        staffMap[uid].shifts    += 1
      }
    })

    // ── Cash balance summary ──────────────────────────
    const cashBalanceDays = cashRows.map(r => ({
      date:         r.balance_date,
      openBalance:  r.open_balance  || 0,
      closeBalance: r.close_balance || 0,
      notes:        r.notes || '',
    }))

    setReport({
      totalRevenue, totalExpenses, totalOrders, profit: totalRevenue - totalExpenses,
      cashOrders, onlineOrders, zomatoOrders,
      cashRevenue, onlineRevenue, zomatoRevenue,
      tableOrders, parcelOrders, zomatoTypeOrders,
      tableRevenue, parcelRevenue,
      topDishes, allDishes,
      dailyRevenue, dailyMap, dailyExpenseMap,
      expenseByCategory,
      staffPerformance: Object.values(staffMap),
      cashBalanceDays,
      startDate, endDate,
    })
    setLoading(false)
  }

  return { report, loading, loadReport }
}