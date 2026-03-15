import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomeNew from './pages/HomeNew'
import LoginNew from './pages/LoginNew'
import RegisterNew from './pages/RegisterNew'
import SkillDetailNew from './pages/SkillDetailNew'
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
      {/* AI 创作页面 - 统一顶部导航布局 */}
      <Route path="generate" element={<GenerateNew />} />
      <Route path="generate/history" element={<GenerateHistoryNew />} />
      
      {/* 技能页面 - 统一顶部导航布局 */}
      <Route path="/" element={<HomeNew />} />
      <Route path="skills/:id" element={<SkillDetailNew />} />
      
      {/* API 市场 - 统一顶部导航布局 */}
      <Route path="api-market" element={<ApiListNew />} />
      <Route path="api-market/:id" element={<ApiDetailNew />} />
      
      {/* 个人中心 - 统一顶部导航布局 */}
      <Route path="profile" element={<ProfileNew />} />
      <Route path="recharge" element={<RechargeNew />} />
      
      {/* 登录注册 - 统一顶部导航布局 */}
      <Route path="login" element={<LoginNew />} />
      <Route path="register" element={<RegisterNew />} />
      
      {/* 其他页面 - 使用原始布局 */}
      <Route element={<Layout />}>
        <Route path="payment/:orderNo" element={<Payment />} />
        <Route path="payment/result" element={<PaymentResult />} />
        <Route path="assets" element={<Assets />} />
        <Route path="admin/*" element={<AdminDashboard />} />
      </Route>
    </Routes>
  )
}

export default App