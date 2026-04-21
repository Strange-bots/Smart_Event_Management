import { useState } from "react";
import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";

export default function HelpCenter() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      <Navbar />
      <div style={{ backgroundColor: "#1f4e79", padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: "36px", fontWeight: "bold", margin: 0 }}>Help Center</h1>
        <p style={{ color: "#bfdbfe", marginTop: "8px" }}>Submit a support request and we will get back to you</p>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 24px" }}>
        {submitted ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
            <h2 style={{ color: "#16a34a", marginBottom: "12px" }}>Request Submitted!</h2>
            <p style={{ color: "#374151" }}>Thank you for contacting us. Our team will respond to your request within 1-2 business days at your email address.</p>
            <button
              onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
              style={{ marginTop: "24px", backgroundColor: "#f36f21", color: "white", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "16px", cursor: "pointer" }}
            >
              Submit Another Request
            </button>
          </div>
        ) : (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "40px" }}>
            <h2 style={{ color: "#1f4e79", marginBottom: "24px" }}>Contact Support</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: "#374151", fontWeight: "600", marginBottom: "6px" }}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: "#374151", fontWeight: "600", marginBottom: "6px" }}>KOI Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="yourname@koi.edu.au"
                  style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: "#374151", fontWeight: "600", marginBottom: "6px" }}>Subject</label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box", backgroundColor: "white" }}
                >
                  <option value="">Select a subject</option>
                  <option value="account">Account Issue</option>
                  <option value="login">Login Problem</option>
                  <option value="event">Event Registration Issue</option>
                  <option value="payment">Payment Issue</option>
                  <option value="technical">Technical Problem</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", color: "#374151", fontWeight: "600", marginBottom: "6px" }}>Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Describe your issue in detail..."
                  style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>
              <button
                type="submit"
                style={{ width: "100%", backgroundColor: "#f36f21", color: "white", border: "none", borderRadius: "8px", padding: "14px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
              >
                Submit Request
              </button>
            </form>
            <p style={{ color: "#6b7280", textAlign: "center", marginTop: "24px", fontSize: "14px" }}>
              Or email us directly at events@koi.edu.au
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
