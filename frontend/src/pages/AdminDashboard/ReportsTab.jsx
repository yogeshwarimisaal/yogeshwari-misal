import { sharedStyles } from './styles'

export default function ReportsTab() {
  const styles = sharedStyles

  return (
    <div style={styles.section}>
      <h3>Reports (Coming Soon)</h3>
      <p>Daily/Weekly/Monthly sales, profit/loss, PDF export will be added in next phase.</p>
      <div style={styles.reportButtons}>
        <button style={styles.reportBtn}>📊 Daily Sales</button>
        <button style={styles.reportBtn}>📈 Monthly P&L</button>
        <button style={styles.reportBtn}>📄 Export PDF</button>
      </div>
    </div>
  )
}