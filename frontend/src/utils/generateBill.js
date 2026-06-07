import jsPDF from 'jspdf'

export async function generateCustomerBill(order, orderItems) {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 150] })
  const PW   = 80
  const M    = 6
  let y      = 6

  function text(str, x, ty, size, color, align, bold) {
    doc.setFontSize(size)
    doc.setTextColor(color || '#1a1a1a')
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(String(str || ''), x, ty, { align: align || 'left' })
  }

  function line(y1) {
    doc.setDrawColor('#dddddd')
    doc.setLineWidth(0.2)
    doc.line(M, y1, PW - M, y1)
  }

  // Watermark logo (light background)
  try {
    const img    = new Image()
    img.src      = '/logo.jpeg'
    await new Promise(r => { img.onload = r; img.onerror = r })
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.08 }))
    doc.addImage(img, 'JPEG', 15, 35, 50, 40)
    doc.restoreGraphicsState()
  } catch (e) {
    console.log('Logo not loaded:', e)
  }

  // Header
  doc.setFillColor('#D85A30')
  doc.rect(0, 0, PW, 20, 'F')
  text('Yogeshwari Misal',     PW/2, 8,  11, '#ffffff', 'center', true)
  text('Customer Bill',        PW/2, 14, 7,  '#ffddcc', 'center', false)
  y = 24

  // Order info
  text(`Bill No: #${order.order_number}`, M, y, 8, '#1a1a1a', 'left', true)
  text(
    new Date(order.completed_at || order.created_at).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }),
    PW - M, y, 7, '#888', 'right', false
  )
  y += 5

  if (order.order_type === 'table') {
    text(`Table: ${order.table_number}`, M, y, 8, '#555', 'left', false)
    y += 5
  } else {
    text(order.order_type === 'zomato' ? 'Zomato Order' : 'Parcel', M, y, 8, '#555', 'left', false)
    y += 5
  }

  line(y); y += 4

  // Items header
  text('Item',    M,       y, 7, '#888', 'left',  true)
  text('Qty',     PW/2,    y, 7, '#888', 'center',true)
  text('Amount',  PW - M,  y, 7, '#888', 'right', true)
  y += 4
  line(y); y += 3

  // Items
  orderItems.forEach(oi => {
    const name   = oi.menu_item?.name_en || oi.name_en || 'Item'
    const qty    = oi.quantity || oi.qty || 1
    const price  = oi.unit_price || oi.price || 0
    const amount = price * qty
    text(name,          M,        y, 8, '#1a1a1a', 'left',   false)
    text(`x${qty}`,     PW/2,     y, 8, '#555',    'center', false)
    text(`Rs.${amount}`,PW - M,   y, 8, '#D85A30', 'right',  true)
    y += 6
  })

  line(y); y += 4

  // Total
  doc.setFillColor('#FAECE7')
  doc.rect(M, y - 2, PW - M*2, 10, 'F')
  text('TOTAL',       M + 2,   y + 5, 9, '#712B13', 'left',  true)
  text(`Rs.${order.total_amount}`, PW - M - 2, y + 5, 12, '#D85A30', 'right', true)
  y += 14

  // Payment mode
  const pm = order.payment_mode
  text(
    `Payment: ${pm === 'cash' ? 'Cash' : pm === 'online' ? 'UPI/Online' : pm === 'zomato' ? 'Zomato' : pm}`,
    PW/2, y, 8, '#555', 'center', false
  )
  y += 8

  // Footer
  line(y); y += 4
  text('Thank you for visiting!',  PW/2, y,   8,  '#D85A30', 'center', true)
  text('Yogeshwari Misal',          PW/2, y+5, 7,  '#888',    'center', false)
  text('Come again soon! 🙏',       PW/2, y+10, 7, '#888',    'center', false)

  doc.save(`Bill_${order.order_number}.pdf`)
}