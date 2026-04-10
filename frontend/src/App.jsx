import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import StaffCheckin     from './pages/StaffCheckin'
import StaffPOS         from './pages/StaffPOS'
import AdminDashboard   from './pages/AdminDashboard'
import BulkOrders       from './pages/BulkOrders'
import AdminMenuManager from './pages/AdminMenuManager'
import AdminReports     from './pages/AdminReports'
import QuickOrder       from './pages/QuickOrder'
import AdminOrderManager from './pages/AdminOrderManager'

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on  = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online',  on)
      window.removeEventListener('offline', off)
    }
  }, [])
  if (!offline) return null
  return (
    <div style={{
      background: '#E24B4A', color: '#fff',
      textAlign: 'center', padding: '8px',
      fontSize: 13, fontWeight: 600,
      position: 'sticky', top: 0, zIndex: 9999,
    }}>
      इंटरनेट नाही — ऑर्डर सेव्ह होणार नाहीत! / No internet — orders will not save!
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <Routes>
        <Route path="/"             element={<StaffCheckin />}     />
        <Route path="/pos"          element={<StaffPOS />}         />
        <Route path="/admin"        element={<AdminDashboard />}   />
        <Route path="/bulk"         element={<BulkOrders />}       />
        <Route path="/menu-manager" element={<AdminMenuManager />} />
        <Route path="/reports"      element={<AdminReports />}     />
        <Route path="*"             element={<Navigate to="/" replace />} />
        <Route path="/quick" element={<QuickOrder />} />
        <Route path="/order-manager" element={<AdminOrderManager />} />
        
      </Routes>
    </BrowserRouter>
  )
}

export default App