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
import AdminUsers from "./pages/admin/adminUsers.jsx";
import AdminMessage from "./pages/admin/adminMessage.jsx";
import AdminSettings from "./pages/admin/adminSettings.jsx";
import UserDashboard from "./pages/users/userDashboard.jsx";
import BrowseEventsPage from "./pages/users/BrowseEvents.jsx";
import UserEvents from "./pages/users/UserEvents.jsx";
import UserNotifications from "./pages/users/UserNotifications.jsx";
import UserProfile from "./pages/users/UserProfile.jsx";
import UserPayments from "./pages/users/UserPayments.jsx";
import PaymentPage from "./pages/users/paymentPage.jsx";
import OrganizerDashboard from "./pages/organizer/organizerDasboard.jsx";

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
  return (
    <BrowserRouter>
      <div className="App">
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/browse-events" element={<BrowseEvents />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          //AdminRoutes//
          <Route path="/admin/admindashboard" element={<AdminDashboard />} />
          <Route path="/admin/adminevents" element={<AdminEvents />} />
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
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
