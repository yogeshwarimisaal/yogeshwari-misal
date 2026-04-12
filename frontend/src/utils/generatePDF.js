import jsPDF from 'jspdf'

const ORANGE = '#D85A30'
const TEAL   = '#1D9E75'
const BLUE   = '#185FA5'
const DARK   = '#1a1a1a'
const GRAY   = '#888888'
const RED    = '#E24B4A'

function rs(n) {
  return `Rs.${Number(n || 0).toLocaleString('en-IN')}`
}

export async function generateBusinessReport(reportData, period) {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const PW  = 210
    const M   = 14
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
      if (fill > 0) {
        doc.setFillColor(color)
        doc.rect(x, by, fill, h, 'F')
      }
      drawText(label,    x,     by - 1.5,    7, GRAY,  'left',  false)
      drawText(valLabel, x + w, by + h/2 + 1.5, 7, color, 'right', true)
    }

    function newPageIfNeeded(needed) {
      if (y + needed > 275) {
        doc.addPage()
        y = 14
      }
    }

    // ── HEADER ──────────────────────────────────────────────────
    fillRect(0, 0, PW, 34, ORANGE)
    drawText('Yogeshwari Misal',      M,       12, 20, '#ffffff', 'left', true)
    drawText('Yogeshwari Misal Cafe', M,       21, 11, '#ffddcc', 'left', false)
    drawText(`Report: ${period}`,     M,       28,  9, '#ffddcc', 'left', false)
    drawText(
      new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      PW - M, 28, 9, '#ffddcc', 'right', false
    )
    y = 40

    // ── SUMMARY STAT CARDS ───────────────────────────────────────
    const stats = [
      { label: 'Revenue',     value: rs(reportData.totalRevenue),  color: TEAL   },
      { label: 'Expenses',    value: rs(reportData.totalExpenses), color: ORANGE },
      { label: 'Profit/Loss', value: rs(reportData.profit),        color: (reportData.profit || 0) >= 0 ? TEAL : RED },
      { label: 'Orders',      value: String(reportData.totalOrders || 0), color: BLUE },
    ]
    const cw4 = (CW - 9) / 4
    stats.forEach((st, i) => {
      const cx = M + i * (cw4 + 3)
      doc.setFillColor('#f5f5f5')
      doc.rect(cx, y, cw4, 20, 'F')
      doc.setFillColor(st.color)
      doc.rect(cx, y, 2, 20, 'F')
      drawText(st.label, cx + 4, y + 7,  7, GRAY,    'left', false)
      drawText(st.value, cx + 4, y + 15, 9, st.color,'left', true)
    })
    y += 26

    // ── CASH vs ONLINE ───────────────────────────────────────────
    if (reportData.cashOrders !== undefined) {
      doc.setFillColor('#f5f5f5')
      doc.rect(M, y, CW/2 - 4, 14, 'F')
      doc.setFillColor(TEAL)
      doc.rect(M, y, 2, 14, 'F')
      drawText('Cash Orders',  M + 4, y + 5,  7, GRAY, 'left', false)
      drawText(
        `${reportData.cashOrders} orders  ${rs(reportData.cashRevenue || 0)}`,
        M + 4, y + 11, 8, TEAL, 'left', true
      )

      doc.setFillColor('#f5f5f5')
      doc.rect(M + CW/2, y, CW/2 - 4, 14, 'F')
      doc.setFillColor(BLUE)
      doc.rect(M + CW/2, y, 2, 14, 'F')
      drawText('Online / UPI', M + CW/2 + 4, y + 5,  7, GRAY, 'left', false)
      drawText(
        `${reportData.onlineOrders} orders  ${rs(reportData.onlineRevenue || 0)}`,
        M + CW/2 + 4, y + 11, 8, BLUE, 'left', true
      )
      y += 20
    }

    // ── REVENUE vs EXPENSE BARS ──────────────────────────────────
    drawText('Revenue vs Expenses', M, y, 10, DARK, 'left', true)
    y += 6
    const maxRE = Math.max(reportData.totalRevenue || 0, reportData.totalExpenses || 0, 1)
    drawBar(M, y, CW, 7, reportData.totalRevenue  || 0, maxRE, TEAL,   'Revenue',  rs(reportData.totalRevenue))
    y += 11
    drawBar(M, y, CW, 7, reportData.totalExpenses || 0, maxRE, ORANGE, 'Expenses', rs(reportData.totalExpenses))
    y += 11
    drawBar(M, y, CW, 7, Math.max(reportData.profit || 0, 0), maxRE,
      (reportData.profit || 0) >= 0 ? TEAL : RED,
      'Net Profit', rs(reportData.profit))
    y += 16

    // ── TOP DISHES ───────────────────────────────────────────────
    if (reportData.topDishes && reportData.topDishes.length > 0) {
      newPageIfNeeded(60)
      drawText('Top Selling Dishes', M, y, 10, DARK, 'left', true)
      y += 6
      const maxDish = reportData.topDishes[0].count || 1
      reportData.topDishes.slice(0, 6).forEach((dish, i) => {
        newPageIfNeeded(10)
        const bw      = CW - 44
        const fill    = (dish.count / maxDish) * bw
        const name    = dish.name_en || dish.name || 'Item'
        doc.setFillColor('#eeeeee')
        doc.rect(M, y, bw, 6, 'F')
        doc.setFillColor(i === 0 ? ORANGE : '#f0a080')
        if (fill > 0) doc.rect(M, y, fill, 6, 'F')
        drawText(`#${i+1} ${name}`, M + 2,     y + 4.5, 7, fill > 20 ? '#fff' : DARK, 'left', i === 0)
        drawText(`${dish.count}x`,  M + bw + 2, y + 4.5, 7, ORANGE, 'left', true)
        drawText(rs(dish.revenue),   M + CW,     y + 4.5, 7, GRAY, 'right', false)
        y += 9
      })
      y += 4
    }

    // ── DAILY REVENUE CHART ──────────────────────────────────────
    if (reportData.dailyRevenue && Object.keys(reportData.dailyRevenue).length > 1) {
      newPageIfNeeded(55)
      drawText('Daily Revenue', M, y, 10, DARK, 'left', true)
      y += 5
      const days   = Object.entries(reportData.dailyRevenue).sort((a,b) => a[0].localeCompare(b[0]))
      const maxDay = Math.max(...days.map(d => d[1]), 1)
      const chartH = 28
      const bw     = Math.min((CW - (days.length - 1) * 2) / Math.max(days.length, 1), 20)
      days.forEach(([date, rev], i) => {
        const bx = M + i * (bw + 2)
        const bh = Math.max((rev / maxDay) * chartH, 1)
        doc.setFillColor('#e0e0e0')
        doc.rect(bx, y, bw, chartH, 'F')
        doc.setFillColor(TEAL)
        doc.rect(bx, y + chartH - bh, bw, bh, 'F')
        drawText(
          new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          bx + bw / 2, y + chartH + 5, 6, GRAY, 'center', false
        )
      })
      y += chartH + 12
    }

    // ── HOURLY ORDERS HEATMAP ────────────────────────────────────
    if (reportData.hourlyOrders && Object.keys(reportData.hourlyOrders).length > 0) {
      newPageIfNeeded(40)
      drawText('Busiest Hours', M, y, 10, DARK, 'left', true)
      y += 5
      const hours  = Object.entries(reportData.hourlyOrders).sort((a,b) => parseInt(a[0]) - parseInt(b[0]))
      const maxH   = Math.max(...hours.map(h => h[1]), 1)
      const hw     = (CW - (hours.length - 1)) / Math.max(hours.length, 1)
      hours.forEach(([hr, cnt], i) => {
        const hx        = M + i * (hw + 1)
        const intensity = cnt / maxH
        const rv = Math.round(216 * intensity + 240 * (1 - intensity))
        const gv = Math.round(90  * intensity + 240 * (1 - intensity))
        const bv = Math.round(48  * intensity + 240 * (1 - intensity))
        doc.setFillColor(rv, gv, bv)
        doc.rect(hx, y, hw, 10, 'F')
        drawText(hr.replace(':00', ''), hx + hw / 2, y + 7,  6, intensity > 0.5 ? '#ffffff' : DARK,  'center', false)
        drawText(String(cnt),           hx + hw / 2, y + 16, 6, GRAY, 'center', false)
      })
      y += 22
    }

    // ── EXPENSE BREAKDOWN ────────────────────────────────────────
    if (reportData.expenseByCategory && Object.keys(reportData.expenseByCategory).length > 0) {
      newPageIfNeeded(50)
      drawText('Expense Breakdown', M, y, 10, DARK, 'left', true)
      y += 6
      const LABELS = {
        raw_material:      'Raw Material',
        vegetables:        'Vegetables',
        dairy:             'Dairy',
        oil_spices:        'Oil & Spices',
        electricity:       'Electricity',
        gas:               'Gas',
        salary:            'Salary',
        rent:              'Rent',
        cleaning_material: 'Cleaning',
        pest_control:      'Pest Control',
        parcel_packing:    'Packing',
        water:             'Water',
        maintenance:       'Maintenance',
        equipment:         'Equipment',
        advertising:       'Advertising',
        capex:             'Capital',
        other:             'Other',
      }
      const cats   = Object.entries(reportData.expenseByCategory).sort((a,b) => b[1] - a[1])
      const maxCat = Math.max(...cats.map(c => c[1]), 1)
      cats.forEach(([cat, amt]) => {
        newPageIfNeeded(10)
        const bw   = CW - 48
        const fill = (amt / maxCat) * bw
        doc.setFillColor('#eeeeee')
        doc.rect(M, y, bw, 5, 'F')
        if (fill > 0) {
          doc.setFillColor(ORANGE)
          doc.rect(M, y, fill, 5, 'F')
        }
        drawText(LABELS[cat] || cat, M + 1,  y + 3.8, 7, fill > 15 ? '#ffffff' : DARK, 'left',  false)
        drawText(rs(amt),             M + CW, y + 3.8, 7, ORANGE, 'right', true)
        y += 8
      })
      y += 4
    }

    // ── STAFF PERFORMANCE ────────────────────────────────────────
    if (reportData.staffPerformance && reportData.staffPerformance.length > 0) {
      newPageIfNeeded(50)
      drawText('Staff Performance', M, y, 10, DARK, 'left', true)
      y += 6
      const sorted  = [...reportData.staffPerformance].sort((a,b) => b.totalMins - a.totalMins)
      const maxMins = Math.max(...sorted.map(s => s.totalMins), 1)
      sorted.forEach(staff => {
        newPageIfNeeded(10)
        const hrs  = Math.floor(staff.totalMins / 60)
        const mins = staff.totalMins % 60
        const bw   = CW - 32
        const fill = (staff.totalMins / maxMins) * bw
        doc.setFillColor('#eeeeee')
        doc.rect(M, y, bw, 5, 'F')
        if (fill > 0) {
          doc.setFillColor(BLUE)
          doc.rect(M, y, fill, 5, 'F')
        }
        const staffName = staff.name || 'Staff'
        drawText(staffName,       M + 1,  y + 3.8, 7, fill > 15 ? '#ffffff' : DARK, 'left',  false)
        drawText(`${hrs}h ${mins}m`, M + CW, y + 3.8, 7, BLUE, 'right', true)
        y += 8
      })
      y += 4
    }

    // ── INVENTORY STATUS ─────────────────────────────────────────
    if (reportData.inventory && reportData.inventory.length > 0) {
      newPageIfNeeded(30)
      drawText('Inventory Status', M, y, 10, DARK, 'left', true)
      y += 6
      const half = Math.ceil(reportData.inventory.length / 2)
      reportData.inventory.forEach((item, i) => {
        const col   = i < half ? 0 : 1
        const row   = i < half ? i : i - half
        const ix    = M + col * (CW / 2 + 3)
        const iy    = y + row * 8
        const isLow = item.current_stock <= item.min_stock_level
        doc.setFillColor(isLow ? '#FCEBEB' : '#E1F5EE')
        doc.rect(ix, iy, CW / 2 - 3, 6, 'F')
        drawText(item.item_name,  ix + 2,          iy + 4.5, 7, isLow ? RED : TEAL, 'left',  false)
        drawText(
          `${item.current_stock} ${item.unit}${isLow ? ' LOW' : ''}`,
          ix + CW/2 - 5, iy + 4.5, 7, isLow ? RED : GRAY, 'right', isLow
        )
      })
      y += Math.ceil(reportData.inventory.length / 2) * 8 + 6
    }

    // ── FOOTER ON ALL PAGES ──────────────────────────────────────
    const totalPages = doc.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      drawLine(M, 285, PW - M, 285, '#dddddd', 0.3)
      drawText('Yogeshwari Misal — Confidential Business Report', M, 290, 7, GRAY, 'left', false)
      drawText(
        `Page ${p} of ${totalPages}  |  ${new Date().toLocaleString('en-IN')}`,
        PW - M, 290, 7, GRAY, 'right', false
      )
    }

    const filename = `YM_Report_${period.replace(/[\s/\\:*?"<>|]/g, '_')}.pdf`
    doc.save(filename)
    return true

  } catch (err) {
    console.error('PDF error:', err)
    throw err
  }
}