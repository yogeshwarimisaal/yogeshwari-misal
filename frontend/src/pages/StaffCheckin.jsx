import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../api/supabase'
import toast, { Toaster } from 'react-hot-toast'

const AVATAR_COLORS = {
  AS: { bg: '#E6F1FB', text: '#0C447C', border: '#378ADD' },
  MA: { bg: '#FAEEDA', text: '#633806', border: '#BA7517' },
  AW: { bg: '#FAECE7', text: '#712B13', border: '#D85A30' },
  PO: { bg: '#FBEAF0', text: '#72243E', border: '#D4537E' },
  RA: { bg: '#EAF3DE', text: '#27500A', border: '#639922' },
  KE: { bg: '#E1F5EE', text: '#085041', border: '#1D9E75' },
  SA: { bg: '#EEEDFE', text: '#3C3489', border: '#7F77DD' },
  BH: { bg: '#F1EFE8', text: '#444441', border: '#888780' },
}

export default function StaffCheckin() {
  const { t, i18n } = useTranslation()
  const [staff, setStaff] = useState([])
  const [activeShifts, setActiveShifts] = useState({})
  const [loading, setLoading] = useState(true)
  const lang = i18n.language

  useEffect(() => {
    loadStaffAndShifts()
  }, [])

  async function loadStaffAndShifts() {
    setLoading(true)

    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'staff')
      .eq('is_active', true)
      .order('name')

    const today = new Date().toISOString().split('T')[0]
    const { data: shifts } = await supabase
      .from('shifts')
      .select('*')
      .eq('date', today)
      .is('check_out', null)

    const shiftsMap = {}
    if (shifts) {
      shifts.forEach(s => { shiftsMap[s.user_id] = s })
    }

    setStaff(users || [])
    setActiveShifts(shiftsMap)
    setLoading(false)
  }

  async function handleTap(person) {
    const existing = activeShifts[person.id]

    if (existing) {
      const { error } = await supabase
        .from('shifts')
        .update({ check_out: new Date().toISOString() })
        .eq('id', existing.id)

      if (!error) {
        const updated = { ...activeShifts }
        delete updated[person.id]
        setActiveShifts(updated)
        const name = lang === 'mr' ? person.name_mr : person.name
        toast(
          `${name} — ${t('checkin.shiftEnded')}`,
          { icon: '👋', style: { background: '#FAECE7', color: '#712B13' } }
        )
      }
    } else {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          user_id: person.id,
          check_in: new Date().toISOString(),
          date: today
        })
        .select()
        .single()

      if (!error && data) {
        setActiveShifts(prev => ({ ...prev, [person.id]: data }))
        const name = lang === 'mr' ? person.name_mr : person.name
        toast.success(
          `${name} — ${t('checkin.shiftStarted')}`,
          { style: { background: '#E1F5EE', color: '#085041' } }
        )
      }
    }
  }

  function getShiftDuration(shift) {
    if (!shift) return null
    const start = new Date(shift.check_in)
    const now = new Date()
    const mins = Math.floor((now - start) / 60000)
    const hrs = Math.floor(mins / 60)
    const rem = mins % 60
    if (hrs > 0) return `${hrs}h ${rem}m`
    return `${mins}m`
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  if (loading) {
    return (
      <div style={styles.centered}>
        <p style={{ color: '#888' }}>{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <Toaster position="top-center" />

      <div style={styles.header}>
        <div>
          <div style={styles.cafeName}>{t('common.appNameMr')}</div>
          <div style={styles.cafeNameEn}>{t('common.appName')}</div>
        </div>
        <button
          style={styles.langBtn}
          onClick={() => i18n.changeLanguage(lang === 'mr' ? 'en' : 'mr')}
        >
          {lang === 'mr' ? 'EN' : 'मराठी'}
        </button>
      </div>

      <p style={styles.subtitle}>{t('checkin.title')}</p>
      <p style={styles.hint}>{t('checkin.subtitle')}</p>

      <div style={styles.grid}>
        {staff.map(person => {
          const shift = activeShifts[person.id]
          const isActive = !!shift
          const colors = AVATAR_COLORS[person.initials] || AVATAR_COLORS['BH']
          const displayName = lang === 'mr' ? person.name_mr : person.name

          return (
            <div
              key={person.id}
              onClick={() => handleTap(person)}
              style={{
                ...styles.card,
                borderColor: isActive ? colors.border : '#e0e0e0',
                borderWidth: isActive ? 2 : 1,
                background: isActive ? colors.bg : '#fff',
                transform: isActive ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              <div style={{
                ...styles.statusDot,
                background: isActive ? '#1D9E75' : '#ccc'
              }} />

              <div style={{
                ...styles.avatar,
                background: colors.bg,
                color: colors.text,
                borderColor: isActive ? colors.border : 'transparent',
                borderWidth: 2,
                borderStyle: 'solid',
              }}>
                {person.initials}
              </div>

              <div style={styles.name}>{displayName}</div>

              {isActive ? (
                <>
                  <div style={{ ...styles.badge, background: '#E1F5EE', color: '#085041' }}>
                    {t('checkin.checkedIn')}
                  </div>
                  <div style={styles.time}>{formatTime(shift.check_in)}</div>
                  <div style={styles.duration}>{getShiftDuration(shift)}</div>
                  <div style={{ ...styles.actionBtn, background: '#D85A30', color: '#fff' }}>
                    {t('checkin.endShift')}
                  </div>
                </>
              ) : (
                <div style={{ ...styles.actionBtn, background: '#1D9E75', color: '#fff' }}>
                  {t('checkin.startShift')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={styles.footer}>
        <span style={styles.footerText}>
          {Object.keys(activeShifts).length} / {staff.length} on shift today
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/pos" style={{ ...styles.adminLink, color: '#1D9E75' }}>
            POS Screen
          </a>
          <a href="/admin" style={styles.adminLink}>Admin</a>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f9f7f4',
    padding: '0 0 32px',
    fontFamily: 'sans-serif',
  },
  centered: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh',
  },
  header: {
    background: '#D85A30',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cafeName: {
    color: '#fff', fontSize: 18, fontWeight: 700, lineHeight: 1.3,
  },
  cafeNameEn: {
    color: 'rgba(255,255,255,0.8)', fontSize: 12,
  },
  langBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none', color: '#fff',
    padding: '5px 14px', borderRadius: 20,
    fontSize: 13, cursor: 'pointer', fontWeight: 500,
  },
  subtitle: {
    textAlign: 'center', fontSize: 15, fontWeight: 600,
    color: '#1a1a1a', margin: '0 16px 4px',
  },
  hint: {
    textAlign: 'center', fontSize: 12,
    color: '#888', margin: '0 16px 16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12, padding: '0 12px',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    borderStyle: 'solid',
    padding: '16px 12px 12px',
    textAlign: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  statusDot: {
    position: 'absolute', top: 10, right: 10,
    width: 10, height: 10, borderRadius: '50%',
  },
  avatar: {
    width: 56, height: 56, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 700,
    margin: '0 auto 8px',
  },
  name: {
    fontSize: 14, fontWeight: 600,
    color: '#1a1a1a', marginBottom: 6,
  },
  badge: {
    display: 'inline-block',
    fontSize: 10, fontWeight: 600,
    padding: '2px 8px', borderRadius: 20,
    marginBottom: 3,
  },
  time: {
    fontSize: 12, color: '#1D9E75',
    fontWeight: 500, marginBottom: 2,
  },
  duration: {
    fontSize: 11, color: '#888', marginBottom: 8,
  },
  actionBtn: {
    borderRadius: 10, padding: '7px 0',
    fontSize: 12, fontWeight: 600,
    marginTop: 6,
  },
  footer: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 16px 0',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12, color: '#888',
  },
  adminLink: {
    fontSize: 12, color: '#D85A30',
    textDecoration: 'none', fontWeight: 600,
  },
}