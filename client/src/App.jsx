import { Routes, Route, Navigate } from 'react-router-dom'
import LoginNew from './pages/LoginNew'
import RegisterNew from './pages/RegisterNew'
import ProfileNew from './pages/ProfileNew'
import AdminDashboard from './pages/AdminDashboard'
import Payment from './pages/Payment'
import PaymentResult from './pages/PaymentResult'
import RechargeNew from './pages/RechargeNew'
import ApiListNew from './pages/ApiListNew'
import ApiDetailNew from './pages/ApiDetailNew'
import GenerateNew from './pages/GenerateNew'
import GenerateHistoryNew from './pages/GenerateHistoryNew'
import Assets from './pages/Assets'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<GenerateNew />} />
      <Route path="generate" element={<GenerateNew />} />
      <Route path="generate/history" element={<ProtectedRoute><GenerateHistoryNew /></ProtectedRoute>} />
      <Route path="api-market" element={<ApiListNew />} />
      <Route path="api-market/:id" element={<ApiDetailNew />} />
      <Route path="profile" element={<ProtectedRoute><ProfileNew /></ProtectedRoute>} />
      <Route path="recharge" element={<ProtectedRoute><RechargeNew /></ProtectedRoute>} />
      <Route path="login" element={<LoginNew />} />
      <Route path="register" element={<RegisterNew />} />
      <Route path="payment/:orderNo" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
      <Route path="payment/result" element={<ProtectedRoute><PaymentResult /></ProtectedRoute>} />
      <Route path="assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
      <Route path="admin/*" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  )
}

export default App