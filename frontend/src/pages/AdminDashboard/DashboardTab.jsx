import { sharedStyles } from './styles'

export default function DashboardTab({ todayRevenue, todayOrders, activeStaff, onQuickAction }) {
  const styles = sharedStyles

  return (
    <div>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>₹{todayRevenue}</div>
          <div style={styles.statLabel}>Today's Revenue</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{todayOrders}</div>
          <div style={styles.statLabel}>Today's Orders</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{activeStaff}</div>
          <div style={styles.statLabel}>Staff on Shift</div>
        </div>
      </div>
      <div style={styles.section}>
        <h3>Quick Actions</h3>
        <div style={styles.quickActions}>
          <button onClick={() => onQuickAction('menu')} style={styles.quickBtn}>➕ Add Menu Item</button>
          <button onClick={() => onQuickAction('expenses')} style={styles.quickBtn}>💰 Add Expense</button>
          <button onClick={() => onQuickAction('revenue')} style={styles.quickBtn}>📈 Add Manual Revenue</button>
        </div>
      </div>
    </div>
  )
}