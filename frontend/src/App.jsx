import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import StaffCheckin    from './pages/StaffCheckin'
import StaffPOS        from './pages/StaffPOS'
import AdminDashboard  from './pages/AdminDashboard'
import BulkOrders      from './pages/BulkOrders'
import AdminMenuManager from './pages/AdminMenuManager'
import AdminReports    from './pages/AdminReports'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<StaffCheckin />}     />
        <Route path="/pos"          element={<StaffPOS />}         />
        <Route path="/admin"        element={<AdminDashboard />}   />
        <Route path="/bulk"         element={<BulkOrders />}       />
        <Route path="/menu-manager" element={<AdminMenuManager />} />
        <Route path="/reports"      element={<AdminReports />}     />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App