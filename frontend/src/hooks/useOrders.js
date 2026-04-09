import { useEffect, useState } from 'react'
import { supabase } from '../api/supabase'
import toast from 'react-hot-toast'

export function useOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  loadOpenOrders()

  const subscription = supabase
    .channel('orders-realtime')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => { loadOpenOrders() }
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'order_items' },
      () => { loadOpenOrders() }
    )
    .subscribe()

  return () => { supabase.removeChannel(subscription) }
}, [])

  async function loadOpenOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items(*, menu_item:menu_items(*))`)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    if (!error && data) setOrders(data)
    setLoading(false)
  }

  async function createOrder(cart, orderType, tableNumber) {
    if (cart.length === 0) return null
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_type: orderType,
        table_number: orderType === 'table' ? tableNumber : null,
        status: 'open',
        total_amount: total,
      })
      .select()
      .single()

    if (orderError) { toast.error('Failed to create order'); return null }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      })))

    if (itemsError) { toast.error('Failed to add items'); return null }

    toast.success('Order created!')
    loadOpenOrders()
    return order
  }

  async function updateOrder(orderId, cart) {
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
    await supabase.from('order_items').delete().eq('order_id', orderId)

    const { error } = await supabase.from('order_items').insert(
      cart.map(item => ({
        order_id: orderId,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }))
    )

    if (error) { toast.error('Update failed'); return false }
    await supabase.from('orders').update({ total_amount: total }).eq('id', orderId)
    toast.success('Order updated!')
    loadOpenOrders()
    return true
  }

  async function completeOrder(orderId, paymentMode) {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        payment_mode: paymentMode,
        completed_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) { toast.error('Failed to complete'); return false }
    toast.success('Order complete!')
    loadOpenOrders()
    return true
  }

  async function cancelOrder(orderId) {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)

    if (error) { toast.error('Failed to cancel'); return false }
    toast('Order cancelled', { icon: '❌' })
    loadOpenOrders()
    return true
  }

  return {
    orders, loading,
    createOrder, updateOrder,
    completeOrder, cancelOrder,
    reload: loadOpenOrders,
  }
}