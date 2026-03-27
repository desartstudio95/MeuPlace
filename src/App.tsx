import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { Properties } from '@/pages/Properties';
import { PropertyDetails } from '@/pages/PropertyDetails';
import { ResortDetails } from '@/pages/ResortDetails';
import { AddProperty } from '@/pages/AddProperty';
import { AddAccommodation } from '@/pages/AddAccommodation';
import { EditProperty } from '@/pages/EditProperty';
import { Dashboard } from '@/pages/dashboard';
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
import { Plans } from '@/pages/Plans';
import { Profile } from '@/pages/Profile';
import { MyFiles } from '@/pages/MyFiles';
import { Maintenance } from '@/pages/Maintenance';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ScrollToTop } from '@/components/ScrollToTop';
import { CookieConsent } from '@/components/CookieConsent';
import { HelmetProvider } from 'react-helmet-async';

import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { doc, getDocFromServer, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Admin Pages
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminProperties } from '@/pages/admin/Properties';
import { AdminAgents } from '@/pages/admin/Agents';
import { AdminAgencies } from '@/pages/admin/Agencies';
import { AdminResorts } from '@/pages/admin/Resorts';
import { AdminPlans } from '@/pages/admin/Plans';
import { AdminSettings } from '@/pages/admin/Settings';
import { AdminStatistics } from '@/pages/admin/Statistics';
import { AdminPages } from '@/pages/admin/Pages';
import { AdminLogin } from '@/pages/admin/AdminLogin';

export default function App() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    // Connection test to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, '_connection_test_', 'ping'));
        console.log("Firestore connection successful.");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Firestore connection failed: The client is offline. Check your Firebase configuration.");
        } else {
          console.log("Firestore backend reached (though maybe with permissions issues):", error);
        }
      }
    };
    testConnection();

    // Listen to maintenance mode setting
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsMaintenance(data.maintenanceMode === true);
      }
      setLoadingConfig(false);
    }, (error) => {
      console.error("Error fetching maintenance setting:", error);
      setLoadingConfig(false);
    });

    return () => unsubscribe();
  }, []);

  if (loadingConfig) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando...</div>;
  }

  // Allow admin routes even in maintenance mode
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  if (isMaintenance && !isAdminRoute) {
    return (
      <HelmetProvider>
        <Maintenance />
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
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
              <Route path="/admin/resorts" element={<AdminLayout><AdminResorts /></AdminLayout>} />
              <Route path="/admin/plans" element={<AdminLayout><AdminPlans /></AdminLayout>} />
              <Route path="/admin/statistics" element={<AdminLayout><AdminStatistics /></AdminLayout>} />
              <Route path="/admin/pages" element={<AdminLayout><AdminPages /></AdminLayout>} />
              <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
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
                  <Route path="/plans" element={<Plans />} />
                  
                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/add-property" element={<AddProperty />} />
                    <Route path="/add-accommodation" element={<AddAccommodation />} />
                    <Route path="/dashboard" element={<Dashboard />} />
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
    </HelmetProvider>
  );
}
