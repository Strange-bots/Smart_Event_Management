import Navbar from "../navbar";
import Footer from "../footer";

export default function PrivacyPolicy() {
  return (
    <div>
      <Navbar />
      <div style={{ backgroundColor: "#1f4e79", padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: "36px", fontWeight: "bold", margin: 0 }}>Privacy Policy</h1>
        <p style={{ color: "#bfdbfe", marginTop: "8px" }}>Last updated: April 2026</p>
      </div>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>1. About This Policy</h2>
          <p style={{ color: "#374151" }}>This Privacy Policy explains how the Smart Event Management Web Application, developed for King's Own Institute (KOI), collects, uses, and protects your personal information.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>2. Who Can Register</h2>
          <p style={{ color: "#374151" }}>Only users with a valid @koi.edu.au email address may create an account. Non-KOI emails are automatically rejected at the backend level.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>3. Information We Collect</h2>
          <p style={{ color: "#374151" }}>We collect your full name, KOI email address, phone number, profile photo, event registration history, feedback and ratings, and payment transaction records.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>4. Data Security</h2>
          <p style={{ color: "#374151" }}>All data is stored in MongoDB Atlas. Passwords are hashed with bcrypt. Sessions use JWT tokens. All data in transit is encrypted with TLS 1.2 or higher.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>5. Contact Us</h2>
          <p style={{ color: "#374151" }}>Email: events@koi.edu.au | Phone: +61 2 9283 3583 | Address: Level 1, 545 Kent Street, Sydney NSW 2000</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
