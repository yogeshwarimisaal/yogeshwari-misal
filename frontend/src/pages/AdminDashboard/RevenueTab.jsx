import { useState } from 'react'
import { supabase } from '../../api/supabase'
import toast from 'react-hot-toast'
import { sharedStyles } from './styles'

export default function RevenueTab({ completedOrders, setCompletedOrders, onManualRevenueAdded }) {
  const styles = sharedStyles
  const [manualRevenueAmount, setManualRevenueAmount] = useState('')
  const [manualRevenueNote, setManualRevenueNote] = useState('')

  async function addManualRevenue() {
    if (!manualRevenueAmount) {
      toast.error('Amount required')
      return
    }
    const { error } = await supabase
      .from('revenue')
      .insert({
        source: 'manual',
        amount: parseInt(manualRevenueAmount),
        notes: manualRevenueNote,
        revenue_date: new Date().toISOString().split('T')[0],
      })
    if (!error) {
      toast.success('Revenue added')
      setManualRevenueAmount('')
      setManualRevenueNote('')
      if (onManualRevenueAdded) onManualRevenueAdded()
    } else {
      toast.error('Failed to add')
    }
  }

  return (
    <div>
      <div style={styles.section}>
        <h3>Add Manual Revenue</h3>
        <div style={styles.formRow}>
          <input placeholder="Amount (₹)" type="number" value={manualRevenueAmount} onChange={e => setManualRevenueAmount(e.target.value)} style={styles.input} />
          <input placeholder="Note (e.g., catering)" value={manualRevenueNote} onChange={e => setManualRevenueNote(e.target.value)} style={styles.input} />
          <button onClick={addManualRevenue} style={styles.primaryBtn}>Add Revenue</button>
        </div>
      </div>
      <div style={styles.section}>
        <h3>Recent Completed Orders</h3>
        <div style={styles.list}>
          {completedOrders.map(order => (
            <div key={order.id} style={styles.listItem}>
              <div>#{order.order_number}</div>
              <div>₹{order.total_amount}</div>
              <div>{order.payment_mode === 'cash' ? '💰 Cash' : '📱 Online'}</div>
              <div>{new Date(order.completed_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}