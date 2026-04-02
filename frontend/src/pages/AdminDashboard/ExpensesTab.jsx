import { useState } from 'react'
import { supabase } from '../../api/supabase'
import toast from 'react-hot-toast'
import { sharedStyles } from './styles'

export default function ExpensesTab({ expenses, setExpenses }) {
  const styles = sharedStyles
  const [expenseCategory, setExpenseCategory] = useState('other')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])

  async function addExpense() {
    if (!expenseAmount) {
      toast.error('Amount required')
      return
    }
    const { error } = await supabase
      .from('expenses')
      .insert({
        category: expenseCategory,
        amount: parseInt(expenseAmount),
        description: expenseDesc,
        expense_date: expenseDate,
      })
    if (!error) {
      toast.success('Expense added')
      setExpenseAmount('')
      setExpenseDesc('')
      const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(20)
      setExpenses(data || [])
    } else {
      toast.error('Failed to add')
    }
  }

  return (
    <div>
      <div style={styles.section}>
        <h3>Add Expense</h3>
        <div style={styles.formRow}>
          <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} style={styles.select}>
            <option value="electricity">⚡ Electricity</option>
            <option value="gas">🔥 Gas</option>
            <option value="salary">👥 Salary</option>
            <option value="raw_material">🥔 Raw Material</option>
            <option value="capex">🏭 Capex</option>
            <option value="opex">📦 Opex</option>
            <option value="other">📝 Other</option>
          </select>
          <input placeholder="Amount (₹)" type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} style={styles.input} />
          <input placeholder="Description" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} style={styles.input} />
          <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} style={styles.input} />
          <button onClick={addExpense} style={styles.primaryBtn}>Add Expense</button>
        </div>
      </div>
      <div style={styles.section}>
        <h3>Recent Expenses</h3>
        <div style={styles.list}>
          {expenses.map(exp => (
            <div key={exp.id} style={styles.listItem}>
              <div>{exp.expense_date}</div>
              <div>{exp.category}</div>
              <div>{exp.description || '-'}</div>
              <div>₹{exp.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}