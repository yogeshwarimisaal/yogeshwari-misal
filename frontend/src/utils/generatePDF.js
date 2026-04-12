import jsPDF from 'jspdf'

const ORANGE = '#D85A30'
const TEAL   = '#1D9E75'
const BLUE   = '#185FA5'
const DARK   = '#1a1a1a'
const GRAY   = '#888888'
const LIGHT  = '#f5f5f5'
const RED    = '#E24B4A'

function formatRs(n) {
  return `Rs.${Number(n || 0).toLocaleString('en-IN')}`
}

function drawRect(doc, x, y, w, h, color, radius = 4) {
  doc.setFillColor(color)
  doc.roundedRect(x, y, w, h, radius, radius, 'F')
}

function drawText(doc, text, x, y, size, color, align = 'left', bold = false) {
  doc.setFontSize(size)
  doc.setTextColor(color)
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.text(String(text), x, y, { align })
}

function drawBar(doc, x, y, w, h, value, maxValue, color, label, valueLabel) {
  drawRect(doc, x, y, w, h, '#eeeeee', 2)
  const fill = maxValue > 0 ? (value / maxValue) * w : 0
  if (fill > 0) drawRect(doc, x, y, fill, h, color, 2)
  drawText(doc, label, x, y - 2, 7, GRAY)
  drawText(doc, valueLabel, x + w, y + h / 2 + 2, 7, color, 'right', true)
}

export async function generateBusinessReport(reportData, period) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210
  const PH = 297
  const M  = 14
  const CW = PW - M * 2

  // ── HEADER ─────────────────────────────────────────────────────
  drawRect(doc, 0, 0, PW, 36, ORANGE, 0)
  drawText(doc, 'Yogeshwari Misal', M, 13, 20, '#ffffff', 'left', true)
  drawText(doc, 'योगेश्वरी मिसळ', M, 21, 11, '#ffddcc)')
  drawText(doc, `Business Report — ${period}`, M, 29, 9, '#ffddcc')
  drawText(doc, new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
    PW - M, 29, 9, '#ffddcc', 'right')

  let y = 44

  // ── STAT CARDS ─────────────────────────────────────────────────
  const stats = [
    { label: 'Total Revenue',    value: formatRs(reportData.totalRevenue),   color: TEAL  },
    { label: 'Total Expenses',   value: formatRs(reportData.totalExpenses),  color: ORANGE},
    { label: 'Net Profit/Loss',  value: formatRs(reportData.profit),         color: reportData.profit >= 0 ? TEAL : RED },
    { label: 'Total Orders',     value: String(reportData.totalOrders),      color: BLUE  },
  ]
  const cw4 = (CW - 9) / 4
  stats.forEach((s, i) => {
    const cx = M + i * (cw4 + 3)
    drawRect(doc, cx, y, cw4, 22, LIGHT, 4)
    doc.setDrawColor(s.color)
    doc.setLineWidth(0.8)
    doc.line(cx, y, cx, y + 22)
    drawText(doc, s.label, cx + 4, y + 7,  7, GRAY)
    drawText(doc, s.value,  cx + 4, y + 15, 9, s.color, 'left', true)
  })
  y += 28

  // ── REVENUE vs EXPENSE BAR ──────────────────────────────────────
  drawText(doc, 'Revenue vs Expenses', M, y, 10, DARK, 'left', true)
  y += 5
  const maxRE = Math.max(reportData.totalRevenue, reportData.totalExpenses, 1)
  drawBar(doc, M, y,      CW, 7, reportData.totalRevenue,  maxRE, TEAL,   'Revenue',  formatRs(reportData.totalRevenue))
  y += 11
  drawBar(doc, M, y,      CW, 7, reportData.totalExpenses, maxRE, ORANGE, 'Expenses', formatRs(reportData.totalExpenses))
  y += 11
  drawBar(doc, M, y,      CW, 7, Math.max(reportData.profit,0), maxRE,
    reportData.profit >= 0 ? TEAL : RED, 'Profit/Loss', formatRs(reportData.profit))
  y += 16

  // ── TOP DISHES ──────────────────────────────────────────────────
  if (reportData.topDishes && reportData.topDishes.length > 0) {
    drawText(doc, 'Top Dishes', M, y, 10, DARK, 'left', true)
    y += 5
    const maxDish = reportData.topDishes[0].count
    reportData.topDishes.slice(0, 5).forEach((dish, i) => {
      const bw = CW - 40
      drawRect(doc, M, y, bw, 6, '#eeeeee', 2)
      const fill = (dish.count / maxDish) * bw
      drawRect(doc, M, y, fill, 6, i === 0 ? ORANGE : '#fab895', 2)
      drawText(doc, `#${i+1} ${dish.name}`, M + 2, y + 4.5, 7, i === 0 ? '#fff' : DARK)
      drawText(doc, `${dish.count}x  ${formatRs(dish.revenue)}`, M + CW, y + 4.5, 7, ORANGE, 'right', true)
      y += 9
    })
    y += 4
  }

  // ── DAILY REVENUE CHART ─────────────────────────────────────────
  if (reportData.dailyRevenue && Object.keys(reportData.dailyRevenue).length > 1) {
    drawText(doc, 'Daily Revenue', M, y, 10, DARK, 'left', true)
    y += 5
    const days = Object.entries(reportData.dailyRevenue).sort((a,b) => a[0].localeCompare(b[0]))
    const maxDay = Math.max(...days.map(d => d[1]), 1)
    const bw = Math.min((CW - (days.length-1)*2) / days.length, 18)
    const chartH = 28
    days.forEach(([date, rev], i) => {
      const bx = M + i * (bw + 2)
      const bh = Math.max((rev / maxDay) * chartH, 1)
      drawRect(doc, bx, y + chartH - bh, bw, bh, TEAL, 2)
      drawText(doc,
        new Date(date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }),
        bx + bw/2, y + chartH + 5, 6, GRAY, 'center')
    })
    y += chartH + 12
  }

  // ── HOURLY HEATMAP ──────────────────────────────────────────────
  if (reportData.hourlyOrders && Object.keys(reportData.hourlyOrders).length > 0) {
    drawText(doc, 'Busiest Hours', M, y, 10, DARK, 'left', true)
    y += 5
    const hours = Object.entries(reportData.hourlyOrders).sort((a,b) => parseInt(a[0])-parseInt(b[0]))
    const maxH = Math.max(...hours.map(h => h[1]), 1)
    const hw = (CW - (hours.length-1)*1.5) / hours.length
    hours.forEach(([hr, cnt], i) => {
      const hx = M + i * (hw + 1.5)
      const intensity = cnt / maxH
      const r = Math.round(216 + (intensity * 39))
      const g = Math.round(90 + (intensity * -40))
      const b = Math.round(48 + (intensity * -30))
      doc.setFillColor(r, g, b)
      doc.roundedRect(hx, y, hw, 10, 1, 1, 'F')
      drawText(doc, hr.replace(':00',''), hx + hw/2, y + 7, 6, '#fff', 'center')
      drawText(doc, String(cnt), hx + hw/2, y + 16, 6, GRAY, 'center')
    })
    y += 22
  }

  // ── EXPENSE BREAKDOWN ───────────────────────────────────────────
  if (reportData.expenseByCategory && Object.keys(reportData.expenseByCategory).length > 0) {
    drawText(doc, 'Expense Breakdown', M, y, 10, DARK, 'left', true)
    y += 5
    const cats = Object.entries(reportData.expenseByCategory).sort((a,b) => b[1]-a[1])
    const maxCat = Math.max(...cats.map(c => c[1]), 1)
    const LABELS = { raw_material:'Raw Material', electricity:'Electricity', gas:'Gas',
      salary:'Salary', rent:'Rent', maintenance:'Maintenance', capex:'Capital', other:'Other' }
    cats.forEach(([cat, amt]) => {
      const bw = CW - 42
      drawRect(doc, M, y, bw, 5, '#eeeeee', 1)
      drawRect(doc, M, y, (amt/maxCat)*bw, 5, ORANGE, 1)
      drawText(doc, LABELS[cat] || cat, M + 1, y + 4, 7, '#fff')
      drawText(doc, formatRs(amt), M + CW, y + 4, 7, ORANGE, 'right', true)
      y += 8
    })
    y += 2
  }

  // ── STAFF PERFORMANCE ───────────────────────────────────────────
  if (reportData.staffPerformance && reportData.staffPerformance.length > 0) {
    if (y > PH - 60) { doc.addPage(); y = 14 }
    drawText(doc, 'Staff Performance', M, y, 10, DARK, 'left', true)
    y += 5
    const sorted = [...reportData.staffPerformance].sort((a,b) => b.totalMins - a.totalMins)
    const maxMins = Math.max(...sorted.map(s => s.totalMins), 1)
    sorted.forEach(staff => {
      const hrs = Math.floor(staff.totalMins / 60)
      const mins = staff.totalMins % 60
      const bw = CW - 35
      drawRect(doc, M, y, bw, 5, '#eeeeee', 1)
      drawRect(doc, M, y, (staff.totalMins/maxMins)*bw, 5, BLUE, 1)
      drawText(doc, staff.name, M + 1, y + 4, 7, '#fff')
      drawText(doc, `${hrs}h ${mins}m`, M + CW, y + 4, 7, BLUE, 'right', true)
      y += 8
    })
    y += 2
  }

  // ── INVENTORY STATUS ────────────────────────────────────────────
  if (reportData.inventory && reportData.inventory.length > 0) {
    if (y > PH - 50) { doc.addPage(); y = 14 }
    drawText(doc, 'Inventory Status', M, y, 10, DARK, 'left', true)
    y += 5
    const half = Math.ceil(reportData.inventory.length / 2)
    reportData.inventory.forEach((item, i) => {
      const col = i < half ? 0 : 1
      const row = i < half ? i : i - half
      const ix = M + col * (CW/2 + 3)
      const iy = y + row * 8
      const isLow = item.current_stock <= item.min_stock_level
      drawRect(doc, ix, iy, CW/2 - 3, 6, isLow ? '#FCEBEB' : '#E1F5EE', 2)
      drawText(doc, item.item_name, ix + 2, iy + 4.5, 7, isLow ? RED : TEAL)
      drawText(doc, `${item.current_stock} ${item.unit}${isLow?' LOW':''}`,
        ix + CW/2 - 5, iy + 4.5, 7, isLow ? RED : GRAY, 'right', true)
    })
    y += Math.ceil(reportData.inventory.length / 2) * 8 + 4
  }

  // ── FOOTER ──────────────────────────────────────────────────────
  const footerY = PH - 10
  doc.setDrawColor('#dddddd')
  doc.setLineWidth(0.3)
  doc.line(M, footerY - 4, PW - M, footerY - 4)
  drawText(doc, 'Yogeshwari Misal — Confidential Business Report', M, footerY, 7, GRAY)
  drawText(doc, `Generated: ${new Date().toLocaleString('en-IN')}`, PW - M, footerY, 7, GRAY, 'right')

  doc.save(`YM_Report_${period.replace(/\s+/g,'_')}.pdf`)
}