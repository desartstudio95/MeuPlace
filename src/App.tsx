import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { Properties } from '@/pages/Properties';
import { PropertyDetails } from '@/pages/PropertyDetails';
import { AddProperty } from '@/pages/AddProperty';
import { EditProperty } from '@/pages/EditProperty';
import { AgentDashboard } from '@/pages/AgentDashboard';
import { About } from '@/pages/About';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { PendingApproval } from '@/pages/PendingApproval';
import { CategoryPage } from '@/pages/CategoryPage';
import { Help } from '@/pages/Help';
import { Terms } from '@/pages/Terms';
import { Privacy } from '@/pages/Privacy';
import { Contact } from '@/pages/Contact';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ScrollToTop } from '@/components/ScrollToTop';
import { CookieConsent } from '@/components/CookieConsent';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            <Route path="/category/:type" element={<CategoryPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
            </Route>
          </Routes>
        </Layout>
        <CookieConsent />
      </Router>
    </AuthProvider>
  );
}
