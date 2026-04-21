import { useState } from "react";
import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";

const faqs = [
  {
    section: "Account & Registration",
    items: [
      { q: "Who can register on the platform?", a: "Only users with a valid @koi.edu.au email address can register. The platform is exclusively for King's Own Institute students, staff, and authorised event organisers." },
      { q: "How do I verify my account?", a: "After registering, a One-Time Password (OTP) will be sent to your KOI email address. Enter the OTP on the verification screen to activate your account." },
      { q: "What should I do if I forget my password?", a: "Click the Forgot Password link on the login page. A password reset link will be sent to your registered KOI email address." },
      { q: "Can I change my role on the platform?", a: "Roles are assigned by the Administrator. If you need a role change, contact the admin team at events@koi.edu.au." },
    ]
  },
  {
    section: "Events",
    items: [
      { q: "How do I register for an event?", a: "Browse events on the Browse Events page, click on the event you are interested in, and click the Register button. You will receive a confirmation email after successful registration." },
      { q: "How do I create an event as an organiser?", a: "Log in with your organiser account, go to your Organiser Dashboard, and click Create Event. Fill in the event details and submit for admin approval." },
      { q: "Why is my event not visible to attendees?", a: "All events must be reviewed and approved by an Administrator before they become publicly visible. You will be notified once your event is approved or rejected." },
      { q: "Can I cancel my event registration?", a: "Yes. Go to My Events in your dashboard and select the event you wish to cancel. Refund eligibility depends on the organiser's stated refund policy." },
    ]
  },
  {
    section: "Payments",
    items: [
      { q: "How are payments processed?", a: "Payments are processed through a secure PCI-DSS compliant payment gateway such as Stripe or PayPal. We do not store your card details on our servers." },
      { q: "Can I get a refund?", a: "Refund eligibility is determined by the event organiser's refund policy stated at the time of registration. Contact the organiser directly for refund requests." },
    ]
  },
  {
    section: "Technical Support",
    items: [
      { q: "The page is not loading. What should I do?", a: "Try refreshing the page or clearing your browser cache. If the problem persists, contact us at events@koi.edu.au." },
      { q: "I am not receiving OTP emails. What should I do?", a: "Check your spam or junk folder. Make sure you are using your @koi.edu.au email. If the issue continues, contact support at events@koi.edu.au." },
      { q: "Which browsers are supported?", a: "The platform works best on modern browsers including Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari." },
    ]
  },
];

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  let counter = 0;

  return (
    <div>
      <Navbar />
      <div style={{ backgroundColor: "#1f4e79", padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: "36px", fontWeight: "bold", margin: 0 }}>Frequently Asked Questions</h1>
        <p style={{ color: "#bfdbfe", marginTop: "8px" }}>Find answers to the most common questions about Smart Events</p>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
        {faqs.map((section) => (
          <div key={section.section} style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#1f4e79", fontSize: "22px", fontWeight: "bold", marginBottom: "16px", paddingBottom: "8px", borderBottom: "2px solid #f36f21" }}>
              {section.section}
            </h2>
            {section.items.map((item) => {
              const index = counter++;
              return (
                <div key={index} style={{ border: "1px solid #e5e7eb", borderRadius: "10px", marginBottom: "12px", overflow: "hidden" }}>
                  <button
                    onClick={() => toggle(index)}
                    style={{ width: "100%", textAlign: "left", padding: "18px 20px", backgroundColor: openIndex === index ? "#f36f21" : "white", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <span style={{ color: openIndex === index ? "white" : "#1f4e79", fontWeight: "600", fontSize: "16px" }}>
                      {item.q}
                    </span>
                    <span style={{ color: openIndex === index ? "white" : "#f36f21", fontSize: "20px", fontWeight: "bold" }}>
                      {openIndex === index ? "−" : "+"}
                    </span>
                  </button>
                  {openIndex === index && (
                    <div style={{ padding: "18px 20px", backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                      <p style={{ color: "#374151", margin: 0, lineHeight: "1.7" }}>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ background: "#1f4e79", borderRadius: "12px", padding: "32px", textAlign: "center", marginTop: "20px" }}>
          <h3 style={{ color: "white", marginBottom: "8px" }}>Still have questions?</h3>
          <p style={{ color: "#bfdbfe", marginBottom: "20px" }}>Our support team is happy to help you</p>
          <a href="/help" style={{ backgroundColor: "#f36f21", color: "white", padding: "12px 28px", borderRadius: "8px", textDecoration: "none", fontWeight: "600" }}>
            Contact Support
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
