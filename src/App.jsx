import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Index from "./pages/index.jsx";
import BrowseEvents from "./pages/browseEvent.jsx";
import About from "./pages/about.jsx";
import Contact from "./pages/contact.jsx";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import AdminDashboard from "./pages/admin/adminDashboard.jsx";
import UserDashboard from "./pages/users/user.jsx";
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

          //admin routes//
          <Route path="/admin/admindashboard" element={<AdminDashboard />} />
          //user routes//
          <Route path="/user/dashboard" element={<UserDashboard />} />
          //organizer routes//
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
