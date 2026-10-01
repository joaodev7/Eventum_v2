import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import InvitePage from "./pages/Invite";
import ReconfirmationPage from "./pages/Reconfirmation";
import GiftsPage from "./pages/Gifts";
import EventPage from "./pages/EventPage";
import EventGiftsPage from "./pages/EventGiftsPage";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import GuestsPage from "./pages/admin/Guests";
import TablesPage from "./pages/admin/Tables";
import AdminGiftsPage from "./pages/admin/Gifts";
import AdminPaymentsPage from "./pages/admin/Payments";
import AdminPixConfigPage from "./pages/admin/PixConfig";
import SecondConfirmationPage from "./pages/admin/SecondConfirmation";
import AdminSettingsPage from "./pages/admin/Settings";
import AdminFinancesPage from "./pages/admin/Finances";
import AdminSubscriptionPage from "./pages/admin/Subscription";
import CreateEventPage from "./pages/admin/CreateEvent";
import SuppliersPage from "./pages/admin/Suppliers";
import MercadoPagoConfig from "./pages/admin/MercadoPagoConfig";
import MercadoPagoCallback from "./pages/admin/MercadoPagoCallback";
import PricingPage from "./pages/Pricing";
import ProfilePage from "./pages/Profile";

// Super Admin imports
import SuperAdminLayout from "./pages/superadmin/SuperAdminLayout";
import SuperDashboard from "./pages/superadmin/SuperDashboard";
import UsersManagement from "./pages/superadmin/UsersManagement";
import UserDetail from "./pages/superadmin/UserDetail";
import AllEvents from "./pages/superadmin/AllEvents";
import AllSubscriptions from "./pages/superadmin/AllSubscriptions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/convite/:token" element={<InvitePage />} />
            <Route path="/reconfirmar/:token" element={<ReconfirmationPage />} />
            <Route path="/presentes" element={<GiftsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Event Public Routes */}
            <Route path="/evento/:slug" element={<EventPage />} />
            <Route path="/evento/:slug/presentes" element={<EventGiftsPage />} />
            
            {/* Admin Routes (Ceremonialists) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="guests" element={<GuestsPage />} />
              <Route path="tables" element={<TablesPage />} />
              <Route path="gifts" element={<AdminGiftsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="pix" element={<AdminPixConfigPage />} />
              <Route path="mercadopago" element={<MercadoPagoConfig />} />
              <Route path="finances" element={<AdminFinancesPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="reconfirmation" element={<SecondConfirmationPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="subscription" element={<AdminSubscriptionPage />} />
            </Route>
            <Route path="/admin/events/new" element={<CreateEventPage />} />
            <Route path="/admin/mercadopago/callback" element={<MercadoPagoCallback />} />
            
            {/* Super Admin Routes (Platform Owner) */}
            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route index element={<SuperDashboard />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="users/:id" element={<UserDetail />} />
              <Route path="events" element={<AllEvents />} />
              <Route path="subscriptions" element={<AllSubscriptions />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
