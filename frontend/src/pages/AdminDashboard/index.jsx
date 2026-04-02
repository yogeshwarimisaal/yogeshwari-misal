import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../api/supabase'
import toast, { Toaster } from 'react-hot-toast'
import PinPad from '../../components/PinPad'
import DashboardTab from './DashboardTab'
import MenuTab from './MenuTab'
import ExpensesTab from './ExpensesTab'
import RevenueTab from './RevenueTab'
import ReportsTab from './ReportsTab'
import { sharedStyles } from './styles'

const ADMIN_PIN = '9999'

export default function AdminDashboard() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [unlocked, setUnlocked] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const [todayRevenue, setTodayRevenue] = useState(0)
  const [todayOrders, setTodayOrders] = useState(0)
  const [activeStaff, setActiveStaff] = useState(0)
  const [menuItems, setMenuItems] = useState([])
  const [expenses, setExpenses] = useState([])
  const [completedOrders, setCompletedOrders] = useState([])

  const styles = sharedStyles

  const loadDashboardData = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data: ordersToday } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'completed')
      .gte('completed_at', today)
    const rev = ordersToday?.reduce((sum, o) => sum + o.total_amount, 0) || 0
    setTodayRevenue(rev)

    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', today)
    setTodayOrders(orderCount || 0)

    const { count: staffCount } = await supabase
      .from('shifts')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)
      .is('check_out', null)
    setActiveStaff(staffCount || 0)
  }

  const loadMenuItems = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('category').order('price')
    setMenuItems(data || [])
  }

  const loadExpenses = async () => {
    const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(20)
    setExpenses(data || [])
  }

  const loadCompletedOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, payment_mode, completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(50)
    setCompletedOrders(data || [])
  }

  useEffect(() => {
    if (unlocked) {
      loadDashboardData()
      loadMenuItems()
      loadExpenses()
      loadCompletedOrders()
    }
  }, [unlocked])

  const handlePinSuccess = (pin) => {
    if (pin === ADMIN_PIN) {
      setUnlocked(true)
      return true
    }
    return false
  }

  if (!unlocked) {
    return <PinPad onSuccess={handlePinSuccess} onCancel title="Admin Login" />
  }

  return (
    <div style={styles.container}>
      <Toaster position="top-center" />
      <div style={styles.header}>
        <div>
          <div style={styles.cafeName}>योगेश्वरी मिसळ</div>
          <div style={styles.cafeNameEn}>Admin Panel</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button style={styles.langBtn} onClick={() => i18n.changeLanguage(lang === 'mr' ? 'en' : 'mr')}>
            {lang === 'mr' ? 'EN' : 'मराठी'}
          </button>
          <a href="/" style={styles.homeLink}>← Staff Screen</a>
        </div>
      </div>

      <div style={styles.tabs}>
        {['dashboard', 'menu', 'expenses', 'revenue', 'reports'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabBtn,
              background: activeTab === tab ? '#D85A30' : '#fff',
              color: activeTab === tab ? '#fff' : '#333',
            }}
          >
            {tab === 'dashboard' && '📊 Dashboard'}
            {tab === 'menu' && '🍽️ Menu'}
            {tab === 'expenses' && '💰 Expenses'}
            {tab === 'revenue' && '📈 Revenue'}
            {tab === 'reports' && '📄 Reports'}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'dashboard' && (
          <DashboardTab
            todayRevenue={todayRevenue}
            todayOrders={todayOrders}
            activeStaff={activeStaff}
            onQuickAction={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'menu' && (
          <MenuTab menuItems={menuItems} setMenuItems={setMenuItems} />
        )}
        {activeTab === 'expenses' && (
          <ExpensesTab expenses={expenses} setExpenses={setExpenses} />
        )}
        {activeTab === 'revenue' && (
          <RevenueTab
            completedOrders={completedOrders}
            setCompletedOrders={setCompletedOrders}
            onManualRevenueAdded={() => {
              loadDashboardData()
              loadCompletedOrders()
            }}
          />
        )}
        {activeTab === 'reports' && <ReportsTab />}
      </div>
    </div>
  )
}