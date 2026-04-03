import { useState } from 'react'
import { supabase } from '../api/supabase'

export function useReports() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  async function loadReport(startDate, endDate) {
    setLoading(true)

    const { data: orders } = await supabase
      .from('orders')
      .select(`*, order_items(*, menu_item:menu_items(*))`)
      .eq('status', 'completed')
      .gte('completed_at', `${startDate}T00:00:00`)
      .lte('completed_at', `${endDate}T23:59:59`)

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)

    const { data: shifts } = await supabase
      .from('shifts')
      .select(`*, user:users(name, name_mr, initials)`)
      .gte('date', startDate)
      .lte('date', endDate)

    const totalRevenue = (orders || []).reduce((s, o) => s + (o.total_amount || 0), 0)
    const totalExpenses = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0)
    const totalOrders = (orders || []).length
    const cashOrders = (orders || []).filter(o => o.payment_mode === 'cash').length
    const onlineOrders = (orders || []).filter(o => o.payment_mode === 'online').length

    const dishCount = {}
    ;(orders || []).forEach(order => {
      order.order_items?.forEach(oi => {
        const name = oi.menu_item?.name_en || 'Unknown'
        const nameMr = oi.menu_item?.name_mr || name
        if (!dishCount[name]) dishCount[name] = { name, name_mr: nameMr, count: 0, revenue: 0 }
        dishCount[name].count += oi.quantity
        dishCount[name].revenue += oi.unit_price * oi.quantity
      })
    })
    const topDishes = Object.values(dishCount).sort((a, b) => b.count - a.count)

    const expenseByCategory = {}
    ;(expenses || []).forEach(e => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount
    })

    const dailyRevenue = {}
    ;(orders || []).forEach(o => {
      const day = o.completed_at?.split('T')[0]
      if (day) dailyRevenue[day] = (dailyRevenue[day] || 0) + (o.total_amount || 0)
    })

    const hourlyOrders = {}
    ;(orders || []).forEach(o => {
      if (o.completed_at) {
        const hour = new Date(o.completed_at).getHours()
        const slot = `${hour}:00`
        hourlyOrders[slot] = (hourlyOrders[slot] || 0) + 1
      }
    })

    const staffPerformance = {}
    ;(shifts || []).forEach(shift => {
      const uid = shift.user_id
      if (!staffPerformance[uid]) {
        staffPerformance[uid] = {
          name: shift.user?.name || 'Unknown',
          name_mr: shift.user?.name_mr || '',
          initials: shift.user?.initials || '?',
          totalMins: 0,
          shifts: 0,
        }
      }
      if (shift.check_in && shift.check_out) {
        const mins = Math.floor(
          (new Date(shift.check_out) - new Date(shift.check_in)) / 60000
        )
        staffPerformance[uid].totalMins += mins
        staffPerformance[uid].shifts += 1
      }
    })

    setReport({
      totalRevenue, totalExpenses, totalOrders,
      profit: totalRevenue - totalExpenses,
      cashOrders, onlineOrders,
      topDishes,
      expenseByCategory,
      dailyRevenue,
      hourlyOrders,
      staffPerformance: Object.values(staffPerformance),
      startDate, endDate,
    })
    setLoading(false)
  }

  return { report, loading, loadReport }
}