import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { Properties } from '@/pages/Properties';
import { PropertyDetails } from '@/pages/PropertyDetails';
import { ResortDetails } from '@/pages/ResortDetails';
import { AddProperty } from '@/pages/AddProperty';
import { EditProperty } from '@/pages/EditProperty';
import { AgentDashboard } from '@/pages/AgentDashboard';
import { AgentProfile } from '@/pages/AgentProfile';
import { About } from '@/pages/About';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { VerifyEmail } from '@/pages/VerifyEmail';
import { PendingApproval } from '@/pages/PendingApproval';
import { CategoryPage } from '@/pages/CategoryPage';
import { Help } from '@/pages/Help';
import { Terms } from '@/pages/Terms';
import { Privacy } from '@/pages/Privacy';
import { Contact } from '@/pages/Contact';
import { Profile } from '@/pages/Profile';
import { MyFiles } from '@/pages/MyFiles';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ScrollToTop } from '@/components/ScrollToTop';
import { CookieConsent } from '@/components/CookieConsent';

import { Toaster } from 'sonner';

// Admin Pages
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminProperties } from '@/pages/admin/Properties';
import { AdminAgents } from '@/pages/admin/Agents';
import { AdminAgencies } from '@/pages/admin/Agencies';
import { AdminLogin } from '@/pages/admin/AdminLogin';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Secret Admin Login Route */}
            <Route path="/admin-secret-access" element={<AdminLogin />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute requireRole="admin" />}>
              <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
              <Route path="/admin/properties" element={<AdminLayout><AdminProperties /></AdminLayout>} />
              <Route path="/admin/agents" element={<AdminLayout><AdminAgents /></AdminLayout>} />
              <Route path="/admin/agencies" element={<AdminLayout><AdminAgencies /></AdminLayout>} />
            </Route>

            {/* Public and User Routes */}
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/properties/:id" element={<PropertyDetails />} />
                  <Route path="/resort/:id" element={<ResortDetails />} />
                  <Route path="/agent/:name" element={<AgentProfile />} />
                  <Route path="/category/:type" element={<CategoryPage />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/pending-approval" element={<PendingApproval />} />
                  
                  {/* Support & Navigation Pages */}
                  <Route path="/help" element={<Help />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/contact" element={<Contact />} />
                  
                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/add-property" element={<AddProperty />} />
                    <Route path="/dashboard" element={<AgentDashboard />} />
                    <Route path="/edit-property/:id" element={<EditProperty />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/my-files" element={<MyFiles />} />
                  </Route>
                </Routes>
              </Layout>
            } />
          </Routes>
          <CookieConsent />
          <Toaster position="bottom-right" richColors />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
