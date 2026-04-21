import Navbar from "../navbar";
import Footer from "../footer";

export default function Cookies() {
  return (
    <div>
      <Navbar />
      <div style={{ backgroundColor: "#1f4e79", padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: "36px", fontWeight: "bold", margin: 0 }}>Cookies Policy</h1>
        <p style={{ color: "#bfdbfe", marginTop: "8px" }}>Last updated: April 2026</p>
      </div>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>1. What Are Cookies</h2>
          <p style={{ color: "#374151" }}>Cookies are small text files stored on your device when you visit a website. The Smart Event Management platform uses cookies to maintain your session and ensure the platform functions correctly and securely.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>2. How We Use Cookies</h2>
          <p style={{ color: "#374151" }}>We use cookies solely to maintain your login session after authentication, store your JWT token securely to keep you logged in, remember your role across page navigations, and preserve your preferences such as theme settings.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>3. Types of Cookies We Use</h2>
          <p style={{ color: "#374151" }}>Session Cookies: Temporary cookies that expire when you close your browser, used to maintain your authenticated session. Authentication Cookies: Store your JWT token to keep you securely logged in across pages. Preference Cookies: Store your UI settings such as theme preferences.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>4. What We Do Not Use</h2>
          <p style={{ color: "#374151" }}>We do not use any third-party advertising or tracking cookies. We do not share cookie data with external marketing platforms. We do not use cookies to track your activity outside of the KOI Smart Events platform.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>5. Managing Cookies</h2>
          <p style={{ color: "#374151" }}>You can control or delete cookies through your browser settings at any time. Please note that disabling cookies will prevent you from logging in and using authenticated features of the platform as session management relies on cookie-stored JWT tokens.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>6. Contact Us</h2>
          <p style={{ color: "#374151" }}>Email: events@koi.edu.au | Phone: +61 2 9283 3583 | Address: Level 1, 545 Kent Street, Sydney NSW 2000</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
