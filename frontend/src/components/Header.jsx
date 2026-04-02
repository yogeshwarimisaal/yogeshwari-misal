import { useTranslation } from 'react-i18next'
import { COLORS, CAFE } from '../utils/constants'

export default function Header({ subtitle, rightContent }) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  return (
    <div style={styles.header}>
      <div>
        <div style={styles.name}>
          {lang === 'mr' ? CAFE.nameMr : CAFE.nameEn}
        </div>
        {subtitle && (
          <div style={styles.subtitle}>{subtitle}</div>
        )}
      </div>
      <div style={styles.right}>
        <button
          style={styles.langBtn}
          onClick={() => i18n.changeLanguage(lang === 'mr' ? 'en' : 'mr')}
        >
          {lang === 'mr' ? 'EN' : 'मराठी'}
        </button>
        {rightContent}
      </div>
    </div>
  )
}

const styles = {
  header: {
    background: COLORS.primary,
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  langBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    padding: '5px 12px',
    borderRadius: 20,
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 500,
  },
}