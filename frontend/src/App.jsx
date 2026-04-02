import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import StaffCheckin from './pages/StaffCheckin'
import StaffPOS from './pages/StaffPOS'
import AdminDashboard from './pages/AdminDashboard'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StaffCheckin />} />
        <Route path="/pos" element={<StaffPOS />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App