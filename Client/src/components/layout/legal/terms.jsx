import Navbar from "../navbar";
import Footer from "../footer";

export default function TermsOfService() {
  return (
    <div>
      <Navbar />
      <div style={{ backgroundColor: "#1f4e79", padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: "36px", fontWeight: "bold", margin: 0 }}>Terms of Service</h1>
        <p style={{ color: "#bfdbfe", marginTop: "8px" }}>Last updated: April 2026</p>
      </div>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>1. Acceptance of Terms</h2>
          <p style={{ color: "#374151" }}>By accessing or using the Smart Event Management Web Application at King's Own Institute, you agree to be bound by these Terms of Service. If you do not agree, you must not use this platform.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>2. Eligibility</h2>
          <p style={{ color: "#374151" }}>This platform is exclusively available to current KOI students, staff, event organisers, and administrators. Registration requires a valid @koi.edu.au email address. Accounts found in violation of this requirement will be permanently deactivated without notice.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>3. User Roles and Responsibilities</h2>
          <p style={{ color: "#374151" }}>The platform supports three roles: Attendee, Event Organiser, and Administrator. Each role has specific permissions enforced by our backend Role-Based Access Control system. You are responsible for maintaining the confidentiality of your login credentials and all activity that occurs under your account.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>4. Event Creation and Approval</h2>
          <p style={{ color: "#374151" }}>Event Organisers may submit events for creation. All submitted events are reviewed and approved by an Administrator before becoming publicly visible on the platform. Rejected events will be returned to the organiser with a reason for rejection.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>5. Prohibited Conduct</h2>
          <p style={{ color: "#374151" }}>You must not use the platform outside of KOI academic and professional events, attempt to access other users accounts, submit false or misleading event information, or bypass authentication and role-based access controls.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>6. Payments and Refunds</h2>
          <p style={{ color: "#374151" }}>Paid event registrations are processed through a PCI-DSS compliant payment gateway. Refund eligibility is determined by the event organiser's stated refund policy at the time of registration. KOI Smart Events is not responsible for payment disputes.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>7. Account Deactivation</h2>
          <p style={{ color: "#374151" }}>Administrators reserve the right to deactivate any account that violates these Terms of Service. Deactivated accounts are immediately blocked from logging in. Users may appeal by contacting events@koi.edu.au.</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", marginBottom: "24px" }}>
          <h2 style={{ color: "#f36f21", marginBottom: "12px" }}>8. Contact Us</h2>
          <p style={{ color: "#374151" }}>Email: events@koi.edu.au | Phone: +61 2 9283 3583 | Address: Level 1, 545 Kent Street, Sydney NSW 2000</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
