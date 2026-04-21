import { useState } from "react";
import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";

export default function ReportIssue() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    type: "",
    description: "",
    steps: "",
    urgent: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      <Navbar />
      <div style={{ backgroundColor: "#1f4e79", padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: "36px", fontWeight: "bold", margin: 0 }}>Report an Issue</h1>
        <p style={{ color: "#bfdbfe", marginTop: "8px" }}>Help us improve by reporting any bugs or problems you encounter</p>
      </div>

      <div style={{ maxWidth: "650px", margin: "0 auto", padding: "40px 24px" }}>
        {submitted ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ color: "#16a34a", marginBottom: "12px" }}>Issue Reported Successfully</h2>
            <p style={{ color: "#374151" }}>Thank you for reporting this issue. Our team will investigate and respond to your report within 1-2 business days.</p>
            <button
              onClick={() => { setSubmitted(false); setForm({ name: "", email: "", type: "", description: "", steps: "", urgent: false }); }}
              style={{ marginTop: "24px", backgroundColor: "#f36f21", color: "white", border: "none", borderRadius: "8px", padding: "12px 28px", fontSize: "16px", cursor: "pointer", fontWeight: "600" }}
            >
              Report Another Issue
            </button>
          </div>
        ) : (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "40px" }}>
            <h2 style={{ color: "#1f4e79", marginBottom: "8px" }}>Issue Report Form</h2>
            <p style={{ color: "#6b7280", marginBottom: "28px", fontSize: "14px" }}>Please fill in as much detail as possible so we can resolve the issue quickly.</p>

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
                <label style={{ display: "block", color: "#374151", fontWeight: "600", marginBottom: "6px" }}>Issue Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box", backgroundColor: "white" }}
                >
                  <option value="">Select issue type</option>
                  <option value="bug">Bug or Error</option>
                  <option value="login">Login or Authentication Problem</option>
                  <option value="payment">Payment Issue</option>
                  <option value="event">Event Registration Problem</option>
                  <option value="performance">Page Loading or Performance</option>
                  <option value="display">Display or Layout Problem</option>
                  <option value="notification">Notification Not Working</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: "#374151", fontWeight: "600", marginBottom: "6px" }}>Issue Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describe the issue you encountered..."
                  style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: "#374151", fontWeight: "600", marginBottom: "6px" }}>Steps to Reproduce <span style={{ fontWeight: "400", color: "#9ca3af" }}>(optional)</span></label>
                <textarea
                  name="steps"
                  value={form.steps}
                  onChange={handleChange}
                  rows={3}
                  placeholder="1. Go to... 2. Click on... 3. Error appears..."
                  style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  name="urgent"
                  checked={form.urgent}
                  onChange={handleChange}
                  id="urgent"
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label htmlFor="urgent" style={{ color: "#374151", fontWeight: "600", cursor: "pointer" }}>
                  This is an urgent issue that is blocking me from using the platform
                </label>
              </div>

              <button
                type="submit"
                style={{ width: "100%", backgroundColor: "#f36f21", color: "white", border: "none", borderRadius: "8px", padding: "14px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
              >
                Submit Report
              </button>
            </form>

            <p style={{ color: "#6b7280", textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
              For urgent issues contact us directly at events@koi.edu.au
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
