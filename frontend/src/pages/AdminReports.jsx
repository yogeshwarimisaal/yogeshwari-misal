import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import Header from '../components/Header'
import StatCard from '../components/StatCard'
import { useReports } from '../hooks/useReports'
import { useAdmin } from '../hooks/useAdmin'
import { COLORS, EXPENSE_LABELS } from '../utils/constants'
import { formatCurrency, getTodayDate, getWeekRange, getMonthRange } from '../utils/formatters'
import { generateBusinessReport } from '../utils/generatePDF'

const PERIODS = [
  { id: 'today',  labelMr: 'आज',     labelEn: 'Today'  },
  { id: 'week',   labelMr: 'आठवडा',  labelEn: 'Week'   },
  { id: 'month',  labelMr: 'महिना',  labelEn: 'Month'  },
  { id: 'custom', labelMr: 'कस्टम',  labelEn: 'Custom' },
]

const REPORT_TABS = [
  { id: 'summary',   labelMr: 'सारांश',     labelEn: 'Summary'   },
  { id: 'dishes',    labelMr: 'डिशेस',      labelEn: 'Dishes'    },
  { id: 'daily',     labelMr: 'दैनिक',      labelEn: 'Daily'     },
  { id: 'expenses',  labelMr: 'खर्च',       labelEn: 'Expenses'  },
  { id: 'cash',      labelMr: 'कॅश बॅलन्स', labelEn: 'Cash'      },
  { id: 'staff',     labelMr: 'स्टाफ',      labelEn: 'Staff'     },
]

function getPeriodDates(period) {
  const today = getTodayDate()
  if (period === 'today') return { start: today, end: today }
  if (period === 'week')  return { start: getWeekRange().start,  end: getWeekRange().end  }
  if (period === 'month') return { start: getMonthRange().start, end: getMonthRange().end }
  return null
}

function getPeriodLabel(period, customStart, customEnd) {
  if (period === 'today')  return `Today ${getTodayDate()}`
  if (period === 'week')   return `Week ${getWeekRange().start} to ${getWeekRange().end}`
  if (period === 'month')  return `Month ${getMonthRange().start} to ${getMonthRange().end}`
  if (period === 'custom') return `${customStart} to ${customEnd}`
  return period
}

export default function AdminReports() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const t = (mr, en) => lang === 'mr' ? mr : en

  const { report, loading, loadReport } = useReports()
  const { inventory }                   = useAdmin()

  const [period,      setPeriod]      = useState('today')
  const [customStart, setCustomStart] = useState(getTodayDate())
  const [customEnd,   setCustomEnd]   = useState(getTodayDate())
  const [activeTab,   setActiveTab]   = useState('summary')
  const [downloading, setDownloading] = useState(false)
  const [dishSearch,  setDishSearch]  = useState('')

  useEffect(() => {
    if (period !== 'custom') {
      const dates = getPeriodDates(period)
      if (dates) loadReport(dates.start, dates.end)
    }
  }, [period])

  async function handleDownloadPDF() {
    if (!report) return
    setDownloading(true)
    try {
      await generateBusinessReport(
        { ...report, inventory: inventory || [], cashRevenue: report.cashRevenue || 0, onlineRevenue: report.onlineRevenue || 0 },
        getPeriodLabel(period, customStart, customEnd)
      )
    } catch (e) { console.error(e) }
    setDownloading(false)
  }

  return (
    <div style={s.container}>
      <Toaster position="top-center" />
      <Header
        subtitle={t('व्यवसाय अहवाल', 'Business Reports')}
        rightContent={<a href="/admin" style={s.backBtn}>{t('अॅडमिन', 'Admin')}</a>}
      />

      <div style={s.periodBar}>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            ...s.periodBtn,
            background: period === p.id ? COLORS.primary : COLORS.bgCard,
            color:      period === p.id ? '#FAF6EC'       : COLORS.inkLight,
            fontWeight: period === p.id ? 700 : 400,
          }}>
            {lang === 'mr' ? p.labelMr : p.labelEn}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div style={s.customRow}>
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={s.dateInput} />
          <span style={{ color: COLORS.textGray, fontSize: 13 }}>{t('ते', 'to')}</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={s.dateInput} />
          <button onClick={() => loadReport(customStart, customEnd)} style={s.loadBtn}>
            {t('पाहा', 'Load')}
          </button>
        </div>
      )}

      {report && !loading && (
        <button onClick={handleDownloadPDF} disabled={downloading} style={s.downloadBtn}>
          {downloading ? t('PDF तयार होत आहे...', 'Generating PDF...') : t('PDF डाउनलोड करा', 'Download PDF')}
        </button>
      )}

      <div style={s.tabBar}>
        {REPORT_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            ...s.tabBtn,
            color:       activeTab === tab.id ? COLORS.primary : COLORS.textGray,
            fontWeight:  activeTab === tab.id ? 700 : 400,
            borderBottom: activeTab === tab.id ? `3px solid ${COLORS.primary}` : '3px solid transparent',
          }}>
            {lang === 'mr' ? tab.labelMr : tab.labelEn}
          </button>
        ))}
      </div>

      <div style={s.content}>
        {loading ? (
          <div style={s.centered}>{t('लोड होत आहे...', 'Loading...')}</div>
        ) : !report ? (
          <div style={s.centered}>{t('वरून कालावधी निवडा', 'Select a period above')}</div>
        ) : (
          <>
            {activeTab === 'summary'  && <SummaryTab  report={report} t={t} lang={lang} />}
            {activeTab === 'dishes'   && <DishesTab   report={report} t={t} lang={lang} search={dishSearch} setSearch={setDishSearch} />}
            {activeTab === 'daily'    && <DailyTab    report={report} t={t} lang={lang} />}
            {activeTab === 'expenses' && <ExpensesTab report={report} t={t} lang={lang} />}
            {activeTab === 'cash'     && <CashTab     report={report} t={t} lang={lang} />}
            {activeTab === 'staff'    && <StaffTab    report={report} t={t} lang={lang} />}
          </>
        )}
      </div>
    </div>
  )
}

function SummaryTab({ report, t, lang }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const existing = window.__ymSummaryChart
    if (existing) existing.destroy()

    const ctx = canvasRef.current.getContext('2d')
    window.__ymSummaryChart = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Cash', 'UPI/Online', 'Zomato'],
        datasets: [{
          data: [report.cashRevenue || 0, report.onlineRevenue || 0, report.zomatoRevenue || 0],
          backgroundColor: ['#6B8E4E', '#8B6914', '#E23744'],
          borderWidth: 2,
          borderColor: '#FAF6EC',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16 } } },
      },
    })
  }, [report])

  const orderTypeCanvas = useRef(null)
  useEffect(() => {
    if (!orderTypeCanvas.current) return
    const existing = window.__ymTypeChart
    if (existing) existing.destroy()
    const ctx = orderTypeCanvas.current.getContext('2d')
    window.__ymTypeChart = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Table', 'Parcel', 'Zomato'],
        datasets: [{
          label: 'Orders',
          data: [report.tableOrders || 0, report.parcelOrders || 0, report.zomatoTypeOrders || 0],
          backgroundColor: ['#B5421F', '#6B8E4E', '#E23744'],
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    })
  }, [report])

  return (
    <div>
      <div style={s.statsGrid}>
        <StatCard label={t('एकूण महसूल','Total Revenue')}  value={formatCurrency(report.totalRevenue)}  sub={`${report.totalOrders} orders`} accent={COLORS.teal} />
        <StatCard label={t('एकूण खर्च','Total Expenses')}  value={formatCurrency(report.totalExpenses)} accent={COLORS.primary} />
        <StatCard label={t('नफा / तोटा','Profit / Loss')}  value={formatCurrency(report.profit)} sub={report.profit >= 0 ? t('नफा','Profit') : t('तोटा','Loss')} accent={report.profit >= 0 ? COLORS.teal : '#E24B4A'} />
        <StatCard label={t('सरासरी ऑर्डर','Avg Order')}    value={formatCurrency(Math.round(report.totalRevenue / Math.max(report.totalOrders,1)))} accent={COLORS.gold} />
      </div>

      <div style={s.statsGrid} >
        <StatCard label={t('रोख','Cash')}    value={formatCurrency(report.cashRevenue)}   sub={`${report.cashOrders} orders`}   accent={COLORS.teal}    />
        <StatCard label='UPI / Online'        value={formatCurrency(report.onlineRevenue)} sub={`${report.onlineOrders} orders`} accent={COLORS.blue}    />
        <StatCard label='Zomato'              value={formatCurrency(report.zomatoRevenue)} sub={`${report.zomatoOrders} orders`} accent='#E23744'        />
        <StatCard label={t('टेबल','Table')}  value={`${report.tableOrders}`}              sub={formatCurrency(report.tableRevenue)} accent={COLORS.primary} />
      </div>

      <div style={s.chartsRow}>
        <div style={s.chartCard}>
          <div style={s.chartTitle}>{t('पेमेंट पद्धत','Payment Method')}</div>
          <div style={{ height: 200, position: 'relative' }}>
            <canvas ref={canvasRef} role="img" aria-label="Payment method donut chart showing Cash, UPI and Zomato revenue breakdown" />
          </div>
        </div>
        <div style={s.chartCard}>
          <div style={s.chartTitle}>{t('ऑर्डर प्रकार','Order Type')}</div>
          <div style={{ height: 200, position: 'relative' }}>
            <canvas ref={orderTypeCanvas} role="img" aria-label="Order type bar chart showing Table, Parcel and Zomato order counts" />
          </div>
        </div>
      </div>

      {report.topDish && (
        <div style={s.topDishCard}>
          <div style={s.topDishLabel}>{t('सर्वाधिक विकलेली डिश','Top Dish')}</div>
          <div style={s.topDishName}>{report.topDish.name}</div>
          <div style={s.topDishCount}>{report.topDish.count} {t('वेळा','times')}</div>
        </div>
      )}
    </div>
  )
}

function DishesTab({ report, t, lang, search, setSearch }) {
  const canvasRef = useRef(null)
  const top10 = report.allDishes.slice(0, 10)

  useEffect(() => {
    if (!canvasRef.current || top10.length === 0) return
    const existing = window.__ymDishChart
    if (existing) existing.destroy()
    const ctx = canvasRef.current.getContext('2d')
    window.__ymDishChart = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: top10.map(d => d.name.length > 14 ? d.name.slice(0,14)+'…' : d.name),
        datasets: [
          { label: 'Cash',   data: top10.map(d => d.cashCount),   backgroundColor: '#6B8E4E' },
          { label: 'Online', data: top10.map(d => d.onlineCount), backgroundColor: '#8B6914' },
          { label: 'Zomato', data: top10.map(d => d.zomatoCount), backgroundColor: '#E23744' },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { stacked: true, beginAtZero: true }, y: { stacked: true } },
      },
    })
  }, [report])

  const filtered = search
    ? report.allDishes.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    : report.allDishes

  return (
    <div>
      <div style={s.sectionTitle}>{t('टॉप 10 डिशेस','Top 10 Dishes by Payment Type')}</div>
      <div style={{ height: Math.max(top10.length * 42 + 80, 300), position: 'relative', marginBottom: 16 }}>
        <canvas ref={canvasRef} role="img" aria-label="Horizontal stacked bar chart showing top 10 dishes by cash, online and zomato order counts" />
      </div>

      <div style={s.sectionTitle}>{t('सर्व डिशेस','All Dishes Detail')}</div>
      <input
        type="text"
        placeholder={t('डिश शोधा...', 'Search dish...')}
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...s.dateInput, width: '100%', marginBottom: 10 }}
      />
      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead>
            <tr style={s.th}>
              <td style={s.td}>{t('डिश','Dish')}</td>
              <td style={{ ...s.td, textAlign: 'right' }}>{t('एकूण','Total')}</td>
              <td style={{ ...s.td, textAlign: 'right' }}>{t('रोख','Cash')}</td>
              <td style={{ ...s.td, textAlign: 'right' }}>UPI</td>
              <td style={{ ...s.td, textAlign: 'right' }}>Zomato</td>
              <td style={{ ...s.td, textAlign: 'right' }}>{t('टेबल','Table')}</td>
              <td style={{ ...s.td, textAlign: 'right' }}>{t('पार्सल','Parcel')}</td>
              <td style={{ ...s.td, textAlign: 'right' }}>{t('महसूल','Revenue')}</td>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={d.name} style={{ background: i % 2 === 0 ? COLORS.bgCard : COLORS.bg }}>
                <td style={{ ...s.td, fontWeight: i < 3 ? 600 : 400 }}>
                  {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i+1}. `}
                  {d.name}
                </td>
                <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, color: COLORS.primary }}>{d.count}</td>
                <td style={{ ...s.td, textAlign: 'right', color: COLORS.teal }}>{d.cashCount}</td>
                <td style={{ ...s.td, textAlign: 'right', color: COLORS.blue }}>{d.onlineCount}</td>
                <td style={{ ...s.td, textAlign: 'right', color: '#E23744' }}>{d.zomatoCount}</td>
                <td style={{ ...s.td, textAlign: 'right' }}>{d.tableCount}</td>
                <td style={{ ...s.td, textAlign: 'right' }}>{d.parcelCount}</td>
                <td style={{ ...s.td, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DailyTab({ report, t, lang }) {
  const canvasRef = useRef(null)
  const days = Object.entries(report.dailyRevenue).sort((a,b) => a[0].localeCompare(b[0]))

  useEffect(() => {
    if (!canvasRef.current || days.length === 0) return
    const existing = window.__ymDailyChart
    if (existing) existing.destroy()
    const ctx = canvasRef.current.getContext('2d')
    window.__ymDailyChart = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: days.map(([d]) => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })),
        datasets: [
          {
            label: 'Revenue',
            data: days.map(([d]) => report.dailyMap[d]?.revenue || 0),
            backgroundColor: '#B5421F',
            yAxisID: 'y',
          },
          {
            label: 'Expenses',
            data: days.map(([d]) => report.dailyExpenseMap[d]?.total || 0),
            backgroundColor: '#C7973F',
            yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: { beginAtZero: true },
          x: { ticks: { autoSkip: true, maxRotation: 45 } },
        },
      },
    })
  }, [report])

  return (
    <div>
      <div style={s.sectionTitle}>{t('दैनिक महसूल व खर्च','Daily Revenue vs Expenses')}</div>
      <div style={{ height: 260, position: 'relative', marginBottom: 16 }}>
        <canvas ref={canvasRef} role="img" aria-label="Bar chart comparing daily revenue and expenses" />
      </div>

      <div style={s.sectionTitle}>{t('दिवसनिहाय तपशील','Day-wise Detail')}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead>
            <tr style={s.th}>
              <td style={s.td}>{t('तारीख','Date')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('ऑर्डर','Orders')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('महसूल','Revenue')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('खर्च','Expenses')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('नफा','Profit')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('रोख','Cash')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>UPI</td>
              <td style={{ ...s.td, textAlign:'right' }}>Zomato</td>
            </tr>
          </thead>
          <tbody>
            {days.map(([date, rev], i) => {
              const dm    = report.dailyMap[date]        || {}
              const expD  = report.dailyExpenseMap[date] || { total: 0 }
              const profit= (dm.revenue||0) - expD.total
              return (
                <tr key={date} style={{ background: i % 2 === 0 ? COLORS.bgCard : COLORS.bg }}>
                  <td style={{ ...s.td, fontWeight: 600 }}>
                    {new Date(date).toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short' })}
                  </td>
                  <td style={{ ...s.td, textAlign:'right' }}>{dm.orders||0}</td>
                  <td style={{ ...s.td, textAlign:'right', color: COLORS.teal, fontWeight:600 }}>{formatCurrency(dm.revenue||0)}</td>
                  <td style={{ ...s.td, textAlign:'right', color: COLORS.primary }}>{formatCurrency(expD.total)}</td>
                  <td style={{ ...s.td, textAlign:'right', fontWeight:600, color: profit>=0 ? COLORS.teal : '#E24B4A' }}>
                    {formatCurrency(profit)}
                  </td>
                  <td style={{ ...s.td, textAlign:'right', color: COLORS.teal }}>{dm.cash||0}</td>
                  <td style={{ ...s.td, textAlign:'right', color: COLORS.blue }}>{dm.online||0}</td>
                  <td style={{ ...s.td, textAlign:'right', color: '#E23744' }}>{dm.zomato||0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExpensesTab({ report, t, lang }) {
  const canvasRef = useRef(null)
  const cats = Object.entries(report.expenseByCategory).sort((a,b) => b[1]-a[1])

  useEffect(() => {
    if (!canvasRef.current || cats.length === 0) return
    const existing = window.__ymExpChart
    if (existing) existing.destroy()
    const ctx = canvasRef.current.getContext('2d')
    const PALETTE = ['#B5421F','#C7973F','#6B8E4E','#8B6914','#5C4A30','#A05C3A','#7A8E4E','#C7B73F','#4E6B8E','#8E4E6B']
    window.__ymExpChart = new window.Chart(ctx, {
      type: 'pie',
      data: {
        labels: cats.map(([c]) => EXPENSE_LABELS.en[c] || c),
        datasets: [{
          data: cats.map(([,v]) => v),
          backgroundColor: PALETTE.slice(0, cats.length),
          borderWidth: 2,
          borderColor: '#FAF6EC',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { font: { size: 11 }, padding: 10 } } },
      },
    })
  }, [report])

  // Daily expense table
  const dailyExpDays = Object.entries(report.dailyExpenseMap)
    .sort((a,b) => a[0].localeCompare(b[0]))

  return (
    <div>
      <div style={s.sectionTitle}>{t('खर्च विभाजन','Expense Breakdown')}</div>
      <div style={{ height: 280, position: 'relative', marginBottom: 16 }}>
        <canvas ref={canvasRef} role="img" aria-label="Pie chart showing expense breakdown by category" />
      </div>

      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table style={s.table}>
          <thead>
            <tr style={s.th}>
              <td style={s.td}>{t('प्रकार','Category')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('रक्कम','Amount')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>%</td>
            </tr>
          </thead>
          <tbody>
            {cats.map(([cat, amt], i) => (
              <tr key={cat} style={{ background: i % 2 === 0 ? COLORS.bgCard : COLORS.bg }}>
                <td style={s.td}>{EXPENSE_LABELS[lang]?.[cat] || EXPENSE_LABELS.en[cat] || cat}</td>
                <td style={{ ...s.td, textAlign:'right', fontWeight:600, color: COLORS.primary }}>{formatCurrency(amt)}</td>
                <td style={{ ...s.td, textAlign:'right', color: COLORS.textGray }}>
                  {Math.round((amt / report.totalExpenses) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={s.sectionTitle}>{t('दैनिक खर्च','Daily Expenses')}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead>
            <tr style={s.th}>
              <td style={s.td}>{t('तारीख','Date')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('एकूण खर्च','Total')}</td>
              <td style={s.td}>{t('तपशील','Details')}</td>
            </tr>
          </thead>
          <tbody>
            {dailyExpDays.map(([date, expData], i) => (
              <tr key={date} style={{ background: i % 2 === 0 ? COLORS.bgCard : COLORS.bg }}>
                <td style={{ ...s.td, fontWeight:600 }}>
                  {new Date(date).toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short' })}
                </td>
                <td style={{ ...s.td, textAlign:'right', fontWeight:600, color: COLORS.primary }}>
                  {formatCurrency(expData.total)}
                </td>
                <td style={{ ...s.td, fontSize: 11, color: COLORS.textGray }}>
                  {expData.items.map(e => `${EXPENSE_LABELS.en[e.category]||e.category}: Rs.${e.amount}`).join(' · ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CashTab({ report, t, lang }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || report.cashBalanceDays.length === 0) return
    const existing = window.__ymCashChart
    if (existing) existing.destroy()
    const ctx = canvasRef.current.getContext('2d')
    window.__ymCashChart = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: report.cashBalanceDays.map(d =>
          new Date(d.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })
        ),
        datasets: [
          { label: 'Opening',  data: report.cashBalanceDays.map(d => d.openBalance),  backgroundColor: '#6B8E4E' },
          { label: 'Closing',  data: report.cashBalanceDays.map(d => d.closeBalance), backgroundColor: '#B5421F' },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } },
      },
    })
  }, [report])

  if (report.cashBalanceDays.length === 0) {
    return (
      <div style={s.centered}>
        {t('या कालावधीत कोणताही कॅश बॅलन्स नोंद नाही', 'No cash balance entries for this period')}
      </div>
    )
  }

  const totalOpen  = report.cashBalanceDays.reduce((s,d) => s+d.openBalance, 0)
  const totalClose = report.cashBalanceDays.reduce((s,d) => s+d.closeBalance, 0)
  const lastClose  = report.cashBalanceDays[report.cashBalanceDays.length-1]?.closeBalance || 0

  return (
    <div>
      <div style={s.statsGrid}>
        <StatCard label={t('शेवटची बंद शिल्लक','Last Closing')} value={formatCurrency(lastClose)} accent={COLORS.primary} />
        <StatCard label={t('एकूण उघडणी','Total Opening')} value={formatCurrency(totalOpen)} accent={COLORS.teal} />
      </div>

      <div style={s.sectionTitle}>{t('उघडणी व बंद शिल्लक','Opening & Closing Balance')}</div>
      <div style={{ height: 240, position: 'relative', marginBottom: 16 }}>
        <canvas ref={canvasRef} role="img" aria-label="Bar chart showing daily opening and closing cash balances" />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead>
            <tr style={s.th}>
              <td style={s.td}>{t('तारीख','Date')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('उघडणी','Opening')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('बंद','Closing')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('फरक','Diff')}</td>
              <td style={s.td}>{t('नोट','Notes')}</td>
            </tr>
          </thead>
          <tbody>
            {report.cashBalanceDays.map((d, i) => {
              const diff = d.closeBalance - d.openBalance
              return (
                <tr key={d.date} style={{ background: i % 2 === 0 ? COLORS.bgCard : COLORS.bg }}>
                  <td style={{ ...s.td, fontWeight:600 }}>
                    {new Date(d.date).toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short' })}
                  </td>
                  <td style={{ ...s.td, textAlign:'right', color: COLORS.teal, fontWeight:600 }}>
                    {formatCurrency(d.openBalance)}
                  </td>
                  <td style={{ ...s.td, textAlign:'right', color: COLORS.primary, fontWeight:600 }}>
                    {formatCurrency(d.closeBalance)}
                  </td>
                  <td style={{ ...s.td, textAlign:'right', color: diff >= 0 ? COLORS.teal : '#E24B4A', fontWeight:600 }}>
                    {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                  </td>
                  <td style={{ ...s.td, fontSize:11, color: COLORS.textGray }}>{d.notes || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StaffTab({ report, t, lang }) {
  const canvasRef = useRef(null)
  const sorted = [...report.staffPerformance].sort((a,b) => b.totalMins - a.totalMins)

  useEffect(() => {
    if (!canvasRef.current || sorted.length === 0) return
    const existing = window.__ymStaffChart
    if (existing) existing.destroy()
    const ctx = canvasRef.current.getContext('2d')
    window.__ymStaffChart = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(s => s.name),
        datasets: [{
          label: 'Hours worked',
          data: sorted.map(s => Math.round(s.totalMins / 60 * 10) / 10),
          backgroundColor: ['#B5421F','#C7973F','#6B8E4E','#8B6914'],
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Hours' } } },
      },
    })
  }, [report])

  if (sorted.length === 0) {
    return <div style={s.centered}>{t('या कालावधीत शिफ्ट नाही','No shifts in this period')}</div>
  }

  return (
    <div>
      <div style={s.sectionTitle}>{t('स्टाफ कामगिरी','Staff Performance')}</div>
      <div style={{ height: 220, position: 'relative', marginBottom: 16 }}>
        <canvas ref={canvasRef} role="img" aria-label="Bar chart showing hours worked by each staff member" />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead>
            <tr style={s.th}>
              <td style={s.td}>{t('नाव','Name')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('शिफ्ट','Shifts')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('एकूण वेळ','Total Hours')}</td>
              <td style={{ ...s.td, textAlign:'right' }}>{t('सरासरी','Avg/shift')}</td>
            </tr>
          </thead>
          <tbody>
            {sorted.map((staff, i) => {
              const hrs  = Math.floor(staff.totalMins / 60)
              const mins = staff.totalMins % 60
              const avgMins = staff.shifts > 0 ? Math.round(staff.totalMins / staff.shifts) : 0
              const avgH    = Math.floor(avgMins/60)
              const avgM    = avgMins % 60
              return (
                <tr key={staff.name} style={{ background: i % 2 === 0 ? COLORS.bgCard : COLORS.bg }}>
                  <td style={s.td}>
                    <div style={s.staffAvatar}>{staff.initials}</div>
                    {lang === 'mr' ? staff.name_mr : staff.name}
                  </td>
                  <td style={{ ...s.td, textAlign:'right' }}>{staff.shifts}</td>
                  <td style={{ ...s.td, textAlign:'right', fontWeight:600, color: COLORS.teal }}>{hrs}h {mins}m</td>
                  <td style={{ ...s.td, textAlign:'right', color: COLORS.textGray }}>{avgH}h {avgM}m</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const s = {
  container:     { minHeight: '100vh', background: COLORS.bg, fontFamily: 'sans-serif' },
  centered:      { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: COLORS.textGray },
  backBtn:       { background: 'rgba(226,198,138,0.2)', padding: '5px 12px', borderRadius: 20, color: '#FAF6EC', textDecoration: 'none', fontSize: 12 },
  periodBar:     { display: 'flex', gap: 8, padding: '10px 12px', background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`, flexWrap: 'wrap' },
  periodBtn:     { padding: '7px 14px', borderRadius: 20, border: `1px solid ${COLORS.border}`, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  customRow:     { display: 'flex', gap: 8, padding: '10px 12px', background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`, alignItems: 'center', flexWrap: 'wrap' },
  dateInput:     { padding: '7px 10px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, background: COLORS.bg, color: COLORS.ink },
  loadBtn:       { background: COLORS.primary, color: '#FAF6EC', border: 'none', padding: '7px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  downloadBtn:   { width: 'calc(100% - 24px)', margin: '10px 12px 0', background: COLORS.teal, color: '#FAF6EC', border: 'none', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'block' },
  tabBar:        { display: 'flex', background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto', marginTop: 10 },
  tabBtn:        { padding: '10px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', transition: 'all 0.15s' },
  content:       { padding: 12 },
  statsGrid:     { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 10 },
  chartsRow:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 },
  chartCard:     { background: COLORS.bgCard, borderRadius: 12, padding: 12, border: `1px solid ${COLORS.border}` },
  chartTitle:    { fontSize: 12, fontWeight: 600, color: COLORS.textGray, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' },
  topDishCard:   { background: COLORS.primaryLight, borderRadius: 12, padding: '14px 16px', border: `1px solid ${COLORS.primary}40` },
  topDishLabel:  { fontSize: 11, color: COLORS.primaryDark, fontWeight: 600, marginBottom: 4 },
  topDishName:   { fontSize: 20, fontWeight: 700, color: COLORS.primary },
  topDishCount:  { fontSize: 12, color: COLORS.primaryDark, marginTop: 2 },
  sectionTitle:  { fontSize: 12, fontWeight: 700, color: COLORS.inkLight, marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.05em' },
  table:         { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th:            { background: COLORS.ink, color: COLORS.goldSoft },
  td:            { padding: '7px 10px', borderBottom: `0.5px solid ${COLORS.borderLight}`, color: COLORS.ink },
  staffAvatar:   { display: 'inline-flex', width: 24, height: 24, borderRadius: '50%', background: COLORS.primaryLight, color: COLORS.primary, alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginRight: 8, verticalAlign: 'middle' },
}