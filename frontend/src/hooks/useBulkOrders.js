import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import { getTodayDate } from '../utils/formatters'
import toast from 'react-hot-toast'

export function useBulkOrders() {
  const [bulkOrders, setBulkOrders] = useState([])
  const [todayBulkOrders, setTodayBulkOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBulkOrders()
  }, [])

  async function loadBulkOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('bulk_orders')
      .select('*')
      .order('delivery_date', { ascending: true })
    if (!error && data) {
      setBulkOrders(data)
      const today = getTodayDate()
      setTodayBulkOrders(data.filter(o => o.delivery_date === today))
    }
    setLoading(false)
  }

  async function createBulkOrder(order) {
    const { error } = await supabase
      .from('bulk_orders')
      .insert(order)
    if (error) { toast.error('Failed to create order'); return false }
    toast.success('Bulk order created!')
    loadBulkOrders()
    return true
  }

  async function updateBulkOrderStatus(id, status) {
    const { error } = await supabase
      .from('bulk_orders')
      .update({ status })
      .eq('id', id)
    if (error) { toast.error('Update failed'); return false }
    toast.success('Status updated!')
    loadBulkOrders()
    return true
  }

  async function deleteBulkOrder(id) {
    const { error } = await supabase
      .from('bulk_orders')
      .delete()
      .eq('id', id)
    if (error) { toast.error('Delete failed'); return false }
    toast('Order deleted', { icon: '🗑️' })
    loadBulkOrders()
    return true
  }

  function getUpcomingOrders() {
    const today = getTodayDate()
    return bulkOrders.filter(o =>
      o.delivery_date >= today && o.status !== 'delivered'
    )
  }

  function getOrdersByStatus(status) {
    return bulkOrders.filter(o => o.status === status)
  }

  function getDaysUntilDelivery(deliveryDate) {
    const today = new Date(getTodayDate())
    const delivery = new Date(deliveryDate)
    const diff = Math.ceil((delivery - today) / (1000 * 60 * 60 * 24))
    return diff
  }

  return {
    bulkOrders, todayBulkOrders, loading,
    createBulkOrder, updateBulkOrderStatus,
    deleteBulkOrder, getUpcomingOrders,
    getOrdersByStatus, getDaysUntilDelivery,
    reload: loadBulkOrders,
  }
}