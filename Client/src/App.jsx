import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Index from "./pages/index.jsx";
import BrowseEvents from "./pages/browseEvent.jsx";
import About from "./pages/about.jsx";
import Contact from "./pages/contact.jsx";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import AdminDashboard from "./pages/admin/adminDashboard.jsx";
import AdminEvents from "./pages/admin/adminEvents.jsx";
import AdminGallery from "./pages/admin/adminGallery.jsx";
import AdminUsers from "./pages/admin/adminUsers.jsx";
import AdminMessage from "./pages/admin/adminMessage.jsx";
import AdminSettings from "./pages/admin/adminSettings.jsx";
import UserDashboard from "./pages/users/userDashboard.jsx";
import BrowseEventsPage from "./pages/users/browseEvents.jsx";
import UserEvents from "./pages/users/userEvents.jsx";
import UserNotifications from "./pages/users/userNotifications.jsx";
import UserProfile from "./pages/users/userProfile.jsx";
import UserPayments from "./pages/users/userPayments.jsx";
import PaymentPage from "./pages/users/paymentPage.jsx";
import OrganizerDashboard from "./pages/organizer/organizerDasboard.jsx";
import OrganizerEmailLog from "./pages/organizer/organizerEmailLog.jsx";
import OrganizerEvents from "./pages/organizer/organizerEvents.jsx";
import OrganizerFeedback from "./pages/organizer/organizerFeedback.jsx";
import OrganizerMessages from "./pages/organizer/organizerMessages.jsx";
import OrganizerNotifications from "./pages/organizer/organizerNotifications.jsx";
import OrganizerProfile from "./pages/organizer/organizerProfile.jsx";
import OrganizerRegistrations from "./pages/organizer/organizerRegistrations.jsx";
import HelpCenter from "./pages/helpCenter.jsx";
import FAQs from "./pages/faqs.jsx";
import ReportIssue from "./pages/reportIssue.jsx";
import Feedback from "./pages/feedback.jsx";
import TermsOfService from "./components/layout/legal/terms";
import PrivacyPolicy from "./components/layout/legal/privacy";

function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    window.requestAnimationFrame(() => {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }, [location.hash]);

  return null;
}

function App() {
  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";

    fetch(`${apiBaseUrl}/api`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        return response.text();
      })
      .then((message) => {
        console.log("Server message:", message);
      })
      .catch((error) => {
        console.error("Failed to fetch server message:", error);
      });
  }, []);

  return (
    <BrowserRouter>
      <div className="App">
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/browse-events" element={<BrowseEvents />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          //AdminRoutes//
          <Route path="/admin/admindashboard" element={<AdminDashboard />} />
          <Route path="/admin/adminevents" element={<AdminEvents />} />
          <Route path="/admin/admingallery" element={<AdminGallery />} />
          <Route path="/admin/adminusers" element={<AdminUsers />} />
          <Route path="/admin/adminmessage" element={<AdminMessage />} />
          <Route path="/admin/adminsettings" element={<AdminSettings />} />

          //UsersRoutes//
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/browseEvents" element={<BrowseEventsPage />} />
          <Route path="/userEvents" element={<UserEvents />} />
          <Route path="/userNotifications" element={<UserNotifications />} />
          <Route path="/userProfile" element={<UserProfile />} />
          <Route path="/userPayments" element={<UserPayments />} />
          <Route path="/payment" element={<PaymentPage />} />

          //OrganizerRoutes//
          <Route
            path="/organizer/organizerdashboard"
            element={<OrganizerDashboard />}
          />
          <Route
            path="/organizer/create"
            element={<OrganizerDashboard />}
          />
          <Route
            path="/organizer/events"
            element={<OrganizerEvents />}
          />
          <Route
            path="/organizer/email-log"
            element={<OrganizerEmailLog />}
          />
          <Route
            path="/organizer/feedback"
            element={<OrganizerFeedback />}
          />
          <Route
            path="/organizer/messages"
            element={<OrganizerMessages />}
          />
          <Route
            path="/organizer/notifications"
            element={<OrganizerNotifications />}
          />
          <Route
            path="/organizer/profile"
            element={<OrganizerProfile />}
          />
          <Route
            path="/organizer/registrations"
            element={<OrganizerRegistrations />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
