import jsPDF from 'jspdf'

const ORANGE = '#B5421F'
const TEAL   = '#6B8E4E'
const GOLD   = '#C7973F'
const BLUE   = '#8B6914'
const DARK   = '#2C2418'
const GRAY   = '#7A6648'
const RED    = '#E24B4A'
const CREAM  = '#FAF6EC'

const EXPENSE_LABELS_EN = {
  raw_material: 'Raw Material', vegetables: 'Vegetables', dairy: 'Dairy',
  oil_spices: 'Oil & Spices', electricity: 'Electricity', gas: 'Gas',
  salary: 'Salary', rent: 'Rent', cleaning_material: 'Cleaning',
  pest_control: 'Pest Control', parcel_packing: 'Packing', water: 'Water',
  maintenance: 'Maintenance', equipment: 'Equipment',
  advertising: 'Advertising', capex: 'Capital', other: 'Other',
}

function rs(n) {
  return `Rs.${Number(n || 0).toLocaleString('en-IN')}`
}

export async function generateBusinessReport(reportData, period) {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const PW  = 210
    const M   = 12
    const CW  = PW - M * 2
    let y     = 0

    function fillRect(x, ry, w, h, color) {
      doc.setFillColor(color)
      doc.rect(x, ry, w, h, 'F')
    }

    function drawText(str, x, ty, size, color, align, bold) {
      doc.setFontSize(size)
      doc.setTextColor(color)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.text(String(str || ''), x, ty, { align: align || 'left' })
    }

    function drawLine(x1, y1, x2, y2, color, width) {
      doc.setDrawColor(color || '#dddddd')
      doc.setLineWidth(width || 0.3)
      doc.line(x1, y1, x2, y2)
    }

    function drawBar(x, by, w, h, value, maxVal, color, label, valLabel) {
      doc.setFillColor('#eeeeee')
      doc.rect(x, by, w, h, 'F')
      const fill = maxVal > 0 ? Math.max((value / maxVal) * w, 0) : 0
      if (fill > 0) { doc.setFillColor(color); doc.rect(x, by, fill, h, 'F') }
      if (label)    drawText(label,    x,     by - 2,      7, GRAY, 'left',  false)
      if (valLabel) drawText(valLabel, x + w, by + h/2+1.5, 7, color,'right', true)
    }

    function newPage() {
      doc.addPage()
      y = 14
    }

    function checkPage(needed) {
      if (y + needed > 275) newPage()
    }

    function sectionHeader(title) {
      checkPage(16)
      fillRect(M, y, CW, 10, DARK)
      drawText(title, M + 4, y + 7, 10, CREAM, 'left', true)
      y += 14
    }

    function statBox(x, by, w, label, value, color) {
      doc.setFillColor('#f5f0e8')
      doc.rect(x, by, w, 18, 'F')
      doc.setFillColor(color)
      doc.rect(x, by, 2.5, 18, 'F')
      drawText(label, x + 5, by + 6,  7, GRAY,  'left', false)
      drawText(value, x + 5, by + 14, 9, color, 'left', true)
    }

    // ══════════════════════════════════════════════════
    // PAGE 1 — COVER HEADER
    // ══════════════════════════════════════════════════
    fillRect(0, 0, PW, 38, DARK)
    drawText('Yogeshwari Misal',      M, 13, 20, CREAM,  'left', true)
    drawText('Business Report',       M, 22, 11, '#C7973F', 'left', false)
    drawText(period,                  M, 30, 9,  '#A08050', 'left', false)
    drawText(
      new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
      PW - M, 30, 9, '#A08050', 'right', false
    )
    y = 44

    // ══════════════════════════════════════════════════
    // SECTION 1 — SUMMARY
    // ══════════════════════════════════════════════════
    sectionHeader('1. Summary')

    const cw4 = (CW - 9) / 4
    const summaryStats = [
      { label: 'Total Revenue',  value: rs(reportData.totalRevenue),  color: TEAL   },
      { label: 'Total Expenses', value: rs(reportData.totalExpenses), color: ORANGE },
      { label: 'Net Profit',     value: rs(reportData.profit),        color: (reportData.profit||0) >= 0 ? TEAL : RED },
      { label: 'Total Orders',   value: String(reportData.totalOrders||0), color: GOLD },
    ]
    summaryStats.forEach((st, i) => {
      statBox(M + i*(cw4+3), y, cw4, st.label, st.value, st.color)
    })
    y += 24

    // Payment split
    const cw3 = (CW - 6) / 3
    const payStats = [
      { label: `Cash (${reportData.cashOrders||0} orders)`,   value: rs(reportData.cashRevenue),   color: TEAL   },
      { label: `UPI (${reportData.onlineOrders||0} orders)`,  value: rs(reportData.onlineRevenue), color: BLUE   },
      { label: `Zomato (${reportData.zomatoOrders||0} orders)`, value: rs(reportData.zomatoRevenue||0), color: '#E23744' },
    ]
    payStats.forEach((st, i) => {
      statBox(M + i*(cw3+3), y, cw3, st.label, st.value, st.color)
    })
    y += 24

    // Order type
    const typeStats = [
      { label: `Table Orders`,  value: String(reportData.tableOrders||0),       color: ORANGE },
      { label: 'Parcel Orders', value: String(reportData.parcelOrders||0),      color: TEAL   },
      { label: 'Avg Order Val', value: rs(Math.round((reportData.totalRevenue||0)/Math.max(reportData.totalOrders||1,1))), color: GOLD },
    ]
    typeStats.forEach((st, i) => {
      statBox(M + i*(cw3+3), y, cw3, st.label, st.value, st.color)
    })
    y += 24

    // Revenue vs Expense bars
    drawText('Revenue vs Expenses', M, y, 10, DARK, 'left', true)
    y += 6
    const maxRE = Math.max(reportData.totalRevenue||0, reportData.totalExpenses||0, 1)
    drawBar(M, y, CW, 7, reportData.totalRevenue||0,  maxRE, TEAL,   'Revenue',  rs(reportData.totalRevenue))
    y += 11
    drawBar(M, y, CW, 7, reportData.totalExpenses||0, maxRE, ORANGE, 'Expenses', rs(reportData.totalExpenses))
    y += 11
    const profit = reportData.profit || 0
    drawBar(M, y, CW, 7, Math.max(profit,0), maxRE, profit>=0?TEAL:RED, 'Net Profit', rs(profit))
    y += 16

    // ══════════════════════════════════════════════════
    // SECTION 2 — ALL DISHES
    // ══════════════════════════════════════════════════
    newPage()
    sectionHeader('2. Dish Analysis — All Items')

    // Top dishes bars
    const dishes = reportData.allDishes || reportData.topDishes || []
    if (dishes.length > 0) {
      drawText('Top Dishes by Orders', M, y, 9, DARK, 'left', true)
      y += 5
      const maxDish = dishes[0]?.count || 1
      dishes.slice(0, 8).forEach((dish, i) => {
        checkPage(10)
        const bw   = CW - 48
        const fill = (dish.count / maxDish) * bw
        const name = (dish.name_en || dish.name || 'Item').slice(0, 22)
        doc.setFillColor('#eeeeee')
        doc.rect(M, y, bw, 6, 'F')
        if (fill > 0) { doc.setFillColor(i===0?ORANGE:i===1?GOLD:TEAL); doc.rect(M, y, fill, 6, 'F') }
        drawText(`#${i+1} ${name}`, M+2, y+4.5, 7, fill>20?'#fff':DARK, 'left', i<3)
        drawText(`${dish.count}x`, M+bw+2, y+4.5, 7, ORANGE, 'left', true)
        drawText(rs(dish.revenue), M+CW, y+4.5, 7, GRAY, 'right', false)
        y += 8
      })
      y += 4
    }

    // Full dish table
    checkPage(20)
    drawText('Complete Dish Report (Cash / Online / Zomato / Table / Parcel)', M, y, 9, DARK, 'left', true)
    y += 5

    // Table header
    fillRect(M, y, CW, 8, DARK)
    const dishCols = [
      { label: 'Dish',    x: M+2,      w: 42 },
      { label: 'Total',   x: M+44,     w: 14 },
      { label: 'Cash',    x: M+60,     w: 14 },
      { label: 'Online',  x: M+76,     w: 16 },
      { label: 'Zomato',  x: M+94,     w: 16 },
      { label: 'Table',   x: M+112,    w: 14 },
      { label: 'Parcel',  x: M+128,    w: 16 },
      { label: 'Revenue', x: M+CW-2,   w: 0  },
    ]
    dishCols.forEach(col => {
      drawText(col.label, col.x, y+5.5, 7, CREAM, col.label==='Revenue'?'right':'left', true)
    })
    y += 10

    dishes.forEach((dish, i) => {
      checkPage(8)
      if (i % 2 === 0) { doc.setFillColor('#f5f0e8'); doc.rect(M, y, CW, 7, 'F') }
      const name = (dish.name_en || dish.name || 'Item').slice(0, 24)
      drawText(name,                    M+2,      y+5, 7, DARK,  'left',  i<3)
      drawText(String(dish.count),      M+44,     y+5, 7, ORANGE,'left',  true)
      drawText(String(dish.cashCount||0),   M+60, y+5, 7, TEAL,  'left',  false)
      drawText(String(dish.onlineCount||0), M+76, y+5, 7, BLUE,  'left',  false)
      drawText(String(dish.zomatoCount||0), M+94, y+5, 7, '#E23744','left',false)
      drawText(String(dish.tableCount||0),  M+112,y+5, 7, DARK,  'left',  false)
      drawText(String(dish.parcelCount||0), M+128,y+5, 7, DARK,  'left',  false)
      drawText(rs(dish.revenue),        M+CW-2,   y+5, 7, ORANGE,'right', true)
      y += 7
    })
    y += 6

    // ══════════════════════════════════════════════════
    // SECTION 3 — DAILY REPORT
    // ══════════════════════════════════════════════════
    newPage()
    sectionHeader('3. Daily Revenue & Expenses')

    const dailyMap    = reportData.dailyMap        || {}
    const dailyExpMap = reportData.dailyExpenseMap || {}
    const days = Object.keys(dailyMap).sort()

    if (days.length > 0) {
      // Daily chart bars
      const maxDay = Math.max(...days.map(d => dailyMap[d]?.revenue || 0), 1)
      const chartH = 32
      const bw = Math.min((CW - (days.length-1)*1.5) / Math.max(days.length,1), 16)
      checkPage(chartH + 20)
      days.forEach((date, i) => {
        const bx  = M + i*(bw+1.5)
        const rev = dailyMap[date]?.revenue || 0
        const bh  = Math.max((rev/maxDay)*chartH, 1)
        doc.setFillColor('#e0dbd0')
        doc.rect(bx, y, bw, chartH, 'F')
        doc.setFillColor(ORANGE)
        doc.rect(bx, y+chartH-bh, bw, bh, 'F')
        if (bw > 8) {
          drawText(
            new Date(date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}),
            bx+bw/2, y+chartH+5, 5.5, GRAY, 'center', false
          )
        }
      })
      y += chartH + 12

      // Daily table
      fillRect(M, y, CW, 8, DARK)
      drawText('Date',     M+2,    y+5.5, 7, CREAM, 'left',  true)
      drawText('Orders',   M+44,   y+5.5, 7, CREAM, 'left',  true)
      drawText('Revenue',  M+68,   y+5.5, 7, CREAM, 'left',  true)
      drawText('Expenses', M+100,  y+5.5, 7, CREAM, 'left',  true)
      drawText('Profit',   M+CW-2, y+5.5, 7, CREAM, 'right', true)
      y += 10

      days.forEach((date, i) => {
        checkPage(8)
        const dm   = dailyMap[date]    || {}
        const expD = dailyExpMap[date] || { total: 0 }
        const prof = (dm.revenue||0) - expD.total
        if (i % 2 === 0) { doc.setFillColor('#f5f0e8'); doc.rect(M, y, CW, 7, 'F') }
        drawText(
          new Date(date).toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short'}),
          M+2, y+5, 7, DARK, 'left', false
        )
        drawText(String(dm.orders||0),   M+44,   y+5, 7, DARK,                   'left',  false)
        drawText(rs(dm.revenue||0),      M+68,   y+5, 7, TEAL,                   'left',  true)
        drawText(rs(expD.total),         M+100,  y+5, 7, ORANGE,                 'left',  false)
        drawText(rs(prof),               M+CW-2, y+5, 7, prof>=0?TEAL:RED,       'right', true)
        y += 7
      })
      y += 6
    } else {
      drawText('No daily data for this period', M, y, 9, GRAY, 'left', false)
      y += 10
    }

    // ══════════════════════════════════════════════════
    // SECTION 4 — EXPENSES
    // ══════════════════════════════════════════════════
    newPage()
    sectionHeader('4. Expense Breakdown')

    const expCats = Object.entries(reportData.expenseByCategory||{}).sort((a,b) => b[1]-a[1])
    if (expCats.length > 0) {
      const maxCat = Math.max(...expCats.map(c => c[1]), 1)
      drawText('Expenses by Category', M, y, 9, DARK, 'left', true)
      y += 5
      expCats.forEach(([cat, amt]) => {
        checkPage(10)
        const bw   = CW - 52
        const fill = (amt/maxCat)*bw
        doc.setFillColor('#eeeeee')
        doc.rect(M, y, bw, 6, 'F')
        if (fill>0) { doc.setFillColor(ORANGE); doc.rect(M, y, fill, 6, 'F') }
        drawText(EXPENSE_LABELS_EN[cat]||cat, M+1, y+4.5, 7, fill>20?'#fff':DARK, 'left', false)
        drawText(rs(amt), M+CW, y+4.5, 7, ORANGE, 'right', true)
        const pct = Math.round((amt/reportData.totalExpenses)*100)
        drawText(`${pct}%`, M+bw+2, y+4.5, 7, GRAY, 'left', false)
        y += 8
      })
      y += 4

      // Daily expense table
      checkPage(20)
      drawText('Daily Expenses', M, y, 9, DARK, 'left', true)
      y += 5
      fillRect(M, y, CW, 8, DARK)
      drawText('Date',    M+2,    y+5.5, 7, CREAM, 'left',  true)
      drawText('Total',   M+44,   y+5.5, 7, CREAM, 'left',  true)
      drawText('Details', M+72,   y+5.5, 7, CREAM, 'left',  true)
      y += 10

      Object.entries(reportData.dailyExpenseMap||{}).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([date, expData], i) => {
        checkPage(10)
        if (i%2===0) { doc.setFillColor('#f5f0e8'); doc.rect(M, y, CW, 8, 'F') }
        drawText(
          new Date(date).toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short'}),
          M+2, y+5.5, 7, DARK, 'left', false
        )
        drawText(rs(expData.total), M+44, y+5.5, 7, ORANGE, 'left', true)
        const detail = expData.items.map(e=>`${EXPENSE_LABELS_EN[e.category]||e.category}:Rs.${e.amount}`).join(' · ')
        drawText(detail.slice(0,70), M+72, y+5.5, 6.5, GRAY, 'left', false)
        y += 8
      })
      y += 4
    } else {
      drawText('No expenses for this period', M, y, 9, GRAY, 'left', false)
      y += 10
    }

    // ══════════════════════════════════════════════════
    // SECTION 5 — CASH BALANCE
    // ══════════════════════════════════════════════════
    checkPage(30)
    sectionHeader('5. Cash Balance (Opening & Closing)')

    const cashDays = reportData.cashBalanceDays || []
    if (cashDays.length > 0) {
      fillRect(M, y, CW, 8, DARK)
      drawText('Date',    M+2,    y+5.5, 7, CREAM, 'left',  true)
      drawText('Opening', M+55,   y+5.5, 7, CREAM, 'left',  true)
      drawText('Closing', M+95,   y+5.5, 7, CREAM, 'left',  true)
      drawText('Diff',    M+CW-2, y+5.5, 7, CREAM, 'right', true)
      y += 10
      cashDays.forEach((d, i) => {
        checkPage(8)
        const diff = d.closeBalance - d.openBalance
        if (i%2===0) { doc.setFillColor('#f5f0e8'); doc.rect(M, y, CW, 7, 'F') }
        drawText(
          new Date(d.date).toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short'}),
          M+2, y+5, 7, DARK, 'left', false
        )
        drawText(rs(d.openBalance),  M+55,   y+5, 7, TEAL,               'left',  true)
        drawText(rs(d.closeBalance), M+95,   y+5, 7, ORANGE,             'left',  true)
        drawText(`${diff>=0?'+':''}${rs(diff)}`, M+CW-2, y+5, 7, diff>=0?TEAL:RED, 'right', true)
        y += 7
      })
      y += 6
    } else {
      drawText('No cash balance entries for this period', M, y, 9, GRAY, 'left', false)
      y += 10
    }

    // ══════════════════════════════════════════════════
    // SECTION 6 — STAFF PERFORMANCE
    // ══════════════════════════════════════════════════
    checkPage(30)
    sectionHeader('6. Staff Performance')

    const staff = (reportData.staffPerformance||[]).sort((a,b) => b.totalMins-a.totalMins)
    if (staff.length > 0) {
      const maxMins = Math.max(...staff.map(s=>s.totalMins), 1)
      staff.forEach(st => {
        checkPage(10)
        const hrs  = Math.floor(st.totalMins/60)
        const mins = st.totalMins%60
        const bw   = CW-32
        const fill = (st.totalMins/maxMins)*bw
        doc.setFillColor('#eeeeee')
        doc.rect(M, y, bw, 6, 'F')
        if (fill>0) { doc.setFillColor(TEAL); doc.rect(M, y, fill, 6, 'F') }
        drawText(st.name, M+1, y+4.5, 7, fill>20?'#fff':DARK, 'left', false)
        drawText(`${hrs}h ${mins}m`, M+CW, y+4.5, 7, TEAL, 'right', true)
        y += 8
      })
      y += 4
    } else {
      drawText('No shift data for this period', M, y, 9, GRAY, 'left', false)
      y += 10
    }

    // ══════════════════════════════════════════════════
    // FOOTER ON ALL PAGES
    // ══════════════════════════════════════════════════
    const totalPages = doc.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      drawLine(M, 285, PW-M, 285, '#C7973F', 0.5)
      drawText('Yogeshwari Misal — Confidential', M, 291, 7, GRAY, 'left', false)
      drawText(`Page ${p} of ${totalPages}  |  ${new Date().toLocaleString('en-IN')}`, PW-M, 291, 7, GRAY, 'right', false)
    }

    const filename = `YM_Report_${period.replace(/[\s/\\:*?"<>|]/g,'_')}.pdf`
    doc.save(filename)
    return true

  } catch (err) {
    console.error('PDF error:', err)
    throw err
  }
}