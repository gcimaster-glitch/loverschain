import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Certificate from "./pages/Certificate";
import InviteAccept from "./pages/InviteAccept";
import Verify from "./pages/Verify";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminNotifications from "./pages/AdminNotifications";
import AdminSingleCertificates from "./pages/AdminSingleCertificates";
import AdminPartnerStatusInquiries from "./pages/AdminPartnerStatusInquiries";
import Plans from "./pages/Plans";
import Checkout from "./pages/Checkout";
import RankCertificate from "./pages/RankCertificate";
import Affiliates from "./pages/Affiliates";
import Referral from "./pages/Referral";
import Kyc from "./pages/Kyc";
import Why from "./pages/Why";
import ForBusiness from "./pages/ForBusiness";
import Faq from "./pages/Faq";
import ForHighschool from "./pages/ForHighschool";
import ForCollege from "./pages/ForCollege";
import ForKonkatsu from "./pages/ForKonkatsu";
import ForAgency from "./pages/ForAgency";
import ForNaien from "./pages/ForNaien";
import ForLgbt from "./pages/ForLgbt";
import ForNokekkon from "./pages/ForNokekkon";
import PartnerStatusConsent from "./pages/PartnerStatusConsent";
import Tokusho from "./pages/legal/Tokusho";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";

function Router() {
  return (
    <>
    <ScrollToTop />
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/plans" component={Plans} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/affiliates" component={Affiliates} />
      <Route path="/referral" component={Referral} />
      <Route path="/certificate/:id" component={Certificate} />
      <Route path="/certificate/:id/rank" component={RankCertificate} />
      <Route path="/invite/:key" component={InviteAccept} />
      <Route path="/invite" component={InviteAccept} />
      <Route path="/verify" component={Verify} />
      <Route path="/kyc" component={Kyc} />
      <Route path="/why" component={Why} />
      <Route path="/for-business" component={ForBusiness} />
      <Route path="/faq" component={Faq} />
      <Route path="/for/highschool" component={ForHighschool} />
      <Route path="/for/college" component={ForCollege} />
      <Route path="/for/konkatsu" component={ForKonkatsu} />
      <Route path="/for/agency" component={ForAgency} />
      <Route path="/for/naien" component={ForNaien} />
      <Route path="/for/lgbt" component={ForLgbt} />
      <Route path="/for/nokekkon" component={ForNokekkon} />
      <Route path="/partner-status-consent" component={PartnerStatusConsent} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/notifications" component={AdminNotifications} />
      <Route path="/admin/single-certificates" component={AdminSingleCertificates} />
      <Route path="/admin/partner-status-inquiries" component={AdminPartnerStatusInquiries} />
      <Route path="/legal/tokusho" component={Tokusho} />
      <Route path="/legal/privacy" component={Privacy} />
      <Route path="/legal/terms" component={Terms} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
