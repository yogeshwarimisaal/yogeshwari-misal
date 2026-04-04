import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import Header from '../components/Header'
import StatCard from '../components/StatCard'
import { useReports } from '../hooks/useReports'
import { COLORS, EXPENSE_LABELS } from '../utils/constants'
import { formatCurrency, getTodayDate, getWeekRange, getMonthRange } from '../utils/formatters'

const PERIODS = [
  { id: 'today',   labelMr: 'आज',      labelEn: 'Today'   },
  { id: 'week',    labelMr: 'आठवडा',   labelEn: 'Week'    },
  { id: 'month',   labelMr: 'महिना',   labelEn: 'Month'   },
  { id: 'custom',  labelMr: 'कस्टम',   labelEn: 'Custom'  },
]

function getPeriodDates(period) {
  const today = getTodayDate()
  if (period === 'today') return { start: today, end: today }
  if (period === 'week')  return { start: getWeekRange().start, end: getWeekRange().end }
  if (period === 'month') return { start: getMonthRange().start, end: getMonthRange().end }
  return null
}

export default function AdminReports() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const t = (mr, en) => lang === 'mr' ? mr : en

  const { report, loading, loadReport } = useReports()
  const [period, setPeriod] = useState('today')
  const [customStart, setCustomStart] = useState(getTodayDate())
  const [customEnd, setCustomEnd] = useState(getTodayDate())

  useEffect(() => {
    if (period !== 'custom') {
      const dates = getPeriodDates(period)
      if (dates) loadReport(dates.start, dates.end)
    }
  }, [period])

  function handleCustomLoad() {
    loadReport(customStart, customEnd)
  }

  const maxDailyRevenue = report
    ? Math.max(...Object.values(report.dailyRevenue), 1)
    : 1

  const maxHourly = report
    ? Math.max(...Object.values(report.hourlyOrders), 1)
    : 1

  return (
    <div style={styles.container}>
      <Toaster position="top-center" />
      <Header
        subtitle={t('व्यावसायिक रिपोर्ट', 'Business Reports')}
        rightContent={
          <a href="/admin" style={styles.backBtn}>{t('अॅडमिन', 'Admin')}</a>
        }
      />

      <div style={styles.periodBar}>
        {PERIODS.map(p => (
          <button key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              ...styles.periodBtn,
              background: period === p.id ? COLORS.primary : '#f5f5f5',
              color: period === p.id ? '#fff' : '#555',
              fontWeight: period === p.id ? 700 : 400,
            }}>
            {lang === 'mr' ? p.labelMr : p.labelEn}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div style={styles.customRow}>
          <input type="date" value={customStart}
            onChange={e => setCustomStart(e.target.value)} style={styles.dateInput} />
          <span style={{ color: '#888', fontSize: 13 }}>{t('ते', 'to')}</span>
          <input type="date" value={customEnd}
            onChange={e => setCustomEnd(e.target.value)} style={styles.dateInput} />
          <button onClick={handleCustomLoad} style={styles.loadBtn}>
            {t('पाहा', 'Load')}
          </button>
        </div>
      )}

      <div style={styles.content}>
        {loading ? (
          <div style={styles.centered}>{t('लोड होत आहे...', 'Loading...')}</div>
        ) : !report ? (
          <div style={styles.centered}>{t('कालावधी निवडा', 'Select a period')}</div>
        ) : (
          <>
            <div style={styles.statsGrid}>
              <StatCard
                label={t('एकूण महसूल', 'Total Revenue')}
                value={formatCurrency(report.totalRevenue)}
                sub={`${report.totalOrders} ${t('ऑर्डर', 'orders')}`}
                accent={COLORS.teal}
              />
              <StatCard
                label={t('एकूण खर्च', 'Total Expenses')}
                value={formatCurrency(report.totalExpenses)}
                accent={COLORS.primary}
              />
              <StatCard
                label={t('नफा / तोटा', 'Profit / Loss')}
                value={formatCurrency(report.profit)}
                sub={report.profit >= 0 ? t('नफा', 'Profit') : t('तोटा', 'Loss')}
                accent={report.profit >= 0 ? COLORS.teal : '#E24B4A'}
              />
              <StatCard
                label={t('पेमेंट', 'Payment Split')}
                value={`${report.cashOrders} / ${report.onlineOrders}`}
                sub={t('रोख / ऑनलाइन', 'Cash / Online')}
                accent={COLORS.blue}
              />
            </div>

            {report.topDishes.length > 0 && (
              <>
                <div style={styles.sectionTitle}>
                  {t('सर्वाधिक विकल्या गेलेल्या डिशेस', 'Top Dishes')}
                </div>
                <div style={styles.card}>
                  {report.topDishes.slice(0, 6).map((dish, i) => (
                    <div key={dish.name} style={styles.dishRow}>
                      <div style={styles.dishRank}>#{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={styles.dishName}>
                          {lang === 'mr' ? dish.name_mr : dish.name}
                        </div>
                        <div style={styles.dishBar}>
                          <div style={{
                            ...styles.dishBarFill,
                            width: `${(dish.count / report.topDishes[0].count) * 100}%`,
                          }} />
                        </div>
                      </div>
                      <div style={styles.dishCount}>{dish.count} {t('वेळा', 'sold')}</div>
                      <div style={styles.dishRevenue}>{formatCurrency(dish.revenue)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {Object.keys(report.dailyRevenue).length > 1 && (
              <>
                <div style={styles.sectionTitle}>
                  {t('दैनिक महसूल', 'Daily Revenue')}
                </div>
                <div style={styles.card}>
                  {Object.entries(report.dailyRevenue)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([date, rev]) => (
                      <div key={date} style={styles.barRow}>
                        <div style={styles.barLabel}>
                          {new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                        <div style={styles.barTrack}>
                          <div style={{
                            ...styles.barFill,
                            width: `${(rev / maxDailyRevenue) * 100}%`,
                            background: COLORS.teal,
                          }} />
                        </div>
                        <div style={styles.barValue}>{formatCurrency(rev)}</div>
                      </div>
                    ))}
                </div>
              </>
            )}

            {Object.keys(report.hourlyOrders).length > 0 && (
              <>
                <div style={styles.sectionTitle}>
                  {t('तासानुसार ऑर्डर', 'Orders by Hour')}
                </div>
                <div style={styles.card}>
                  {Object.entries(report.hourlyOrders)
                    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                    .map(([hour, count]) => (
                      <div key={hour} style={styles.barRow}>
                        <div style={styles.barLabel}>{hour}</div>
                        <div style={styles.barTrack}>
                          <div style={{
                            ...styles.barFill,
                            width: `${(count / maxHourly) * 100}%`,
                            background: COLORS.primary,
                          }} />
                        </div>
                        <div style={styles.barValue}>
                          {count} {t('ऑर्डर', 'orders')}
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}

            {Object.keys(report.expenseByCategory).length > 0 && (
              <>
                <div style={styles.sectionTitle}>
                  {t('खर्चाचे प्रकार', 'Expense Breakdown')}
                </div>
                <div style={styles.card}>
                  {Object.entries(report.expenseByCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amount]) => (
                      <div key={cat} style={styles.expRow}>
                        <div style={styles.expCat}>
                          {EXPENSE_LABELS[lang]?.[cat] || EXPENSE_LABELS.en[cat] || cat}
                        </div>
                        <div style={styles.expBar}>
                          <div style={{
                            ...styles.barFill,
                            width: `${(amount / report.totalExpenses) * 100}%`,
                            background: COLORS.primary,
                            height: 8,
                          }} />
                        </div>
                        <div style={styles.expAmount}>{formatCurrency(amount)}</div>
                      </div>
                    ))}
                </div>
              </>
            )}

            {report.staffPerformance.length > 0 && (
              <>
                <div style={styles.sectionTitle}>
                  {t('आपली कामगिरी', 'Staff Performance')}
                </div>
                <div style={styles.card}>
                  {report.staffPerformance
                    .sort((a, b) => b.totalMins - a.totalMins)
                    .map(staff => {
                      const hrs = Math.floor(staff.totalMins / 60)
                      const mins = staff.totalMins % 60
                      return (
                        <div key={staff.name} style={styles.staffRow}>
                          <div style={styles.staffAvatar}>
                            {staff.initials}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={styles.staffName}>
                              {lang === 'mr' ? staff.name_mr : staff.name}
                            </div>
                            <div style={styles.staffSub}>
                              {staff.shifts} {t('शिफ्ट', 'shifts')}
                            </div>
                          </div>
                          <div style={styles.staffHours}>
                            {hrs}h {mins}m
                          </div>
                        </div>
                      )
                    })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: COLORS.bg, fontFamily: 'sans-serif' },
  centered: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#888' },
  backBtn: { background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: 20, color: '#fff', textDecoration: 'none', fontSize: 12 },
  periodBar: { display: 'flex', gap: 8, padding: '12px 14px', background: '#fff', borderBottom: '1px solid #eee', overflowX: 'auto' },
  periodBtn: { padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  customRow: { display: 'flex', gap: 8, padding: '10px 14px', background: '#fff', borderBottom: '1px solid #eee', alignItems: 'center', flexWrap: 'wrap' },
  dateInput: { padding: '7px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 },
  loadBtn: { background: COLORS.primary, color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  content: { padding: 14 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 4 },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: '0.05em' },
  card: { background: '#fff', borderRadius: 12, padding: '10px 14px', border: '1px solid #eee', marginBottom: 4 },
  dishRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '0.5px solid #f5f5f5' },
  dishRank: { fontSize: 12, fontWeight: 700, color: COLORS.primary, minWidth: 24 },
  dishName: { fontSize: 13, fontWeight: 600, marginBottom: 4 },
  dishBar: { height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  dishBarFill: { height: '100%', background: COLORS.teal, borderRadius: 3, transition: 'width 0.3s' },
  dishCount: { fontSize: 12, color: '#888', minWidth: 55, textAlign: 'right' },
  dishRevenue: { fontSize: 12, color: COLORS.primary, fontWeight: 600, minWidth: 65, textAlign: 'right' },
  barRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #f5f5f5' },
  barLabel: { fontSize: 12, color: '#888', minWidth: 45 },
  barTrack: { flex: 1, height: 10, background: '#f0f0f0', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5, transition: 'width 0.4s' },
  barValue: { fontSize: 12, color: '#555', minWidth: 70, textAlign: 'right' },
  expRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '0.5px solid #f5f5f5' },
  expCat: { fontSize: 12, color: '#555', minWidth: 90 },
  expBar: { flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  expAmount: { fontSize: 12, fontWeight: 600, color: COLORS.primary, minWidth: 65, textAlign: 'right' },
  staffRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #f5f5f5' },
  staffAvatar: { width: 36, height: 36, borderRadius: '50%', background: COLORS.primaryLight, color: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
  staffName: { fontSize: 13, fontWeight: 600 },
  staffSub: { fontSize: 11, color: '#aaa' },
  staffHours: { fontSize: 14, fontWeight: 700, color: COLORS.teal },
}