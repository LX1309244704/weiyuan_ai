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

function App() {
  return (
    <Routes>
      <Route path="/" element={<GenerateNew />} />
      <Route path="generate" element={<GenerateNew />} />
      <Route path="generate/history" element={<GenerateHistoryNew />} />
      <Route path="api-market" element={<ApiListNew />} />
      <Route path="api-market/:id" element={<ApiDetailNew />} />
      <Route path="profile" element={<ProfileNew />} />
      <Route path="recharge" element={<RechargeNew />} />
      <Route path="login" element={<LoginNew />} />
      <Route path="register" element={<RegisterNew />} />
      <Route path="payment/:orderNo" element={<Payment />} />
      <Route path="payment/result" element={<PaymentResult />} />
      <Route path="assets" element={<Assets />} />
      <Route path="admin/*" element={<AdminDashboard />} />
    </Routes>
  )
}

export default App