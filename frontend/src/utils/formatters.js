export function formatCurrency(amount) {
  return `Rs.${Number(amount).toLocaleString('en-IN')}`
}

export function formatTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatShiftDuration(checkIn, checkOut) {
  const start = new Date(checkIn)
  const end = checkOut ? new Date(checkOut) : new Date()
  const mins = Math.floor((end - start) / 60000)
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  if (hrs > 0) return `${hrs}h ${rem}m`
  return `${mins}m`
}

export function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

export function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const start = new Date(now)
  start.setDate(now.getDate() - day)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}