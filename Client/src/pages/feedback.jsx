import { useState } from "react";
import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";

export default function Feedback() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    event: "",
    rating: 0,
    category: "",
    message: "",
    recommend: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [hovered, setHovered] = useState(0);

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
        <h1 style={{ color: "white", fontSize: "36px", fontWeight: "bold", margin: 0 }}>Share Your Feedback</h1>
        <p style={{ color: "#bfdbfe", marginTop: "8px" }}>Help us improve the Smart Event Management platform</p>
      </div>

      <div style={{ maxWidth: "650px", margin: "0 auto", padding: "40px 24px" }}>
        {submitted ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ color: "#16a34a", marginBottom: "12px" }}>Thank You for Your Feedback!</h2>
            <p style={{ color: "#374151" }}>Your feedback helps us improve the platform and deliver better events for the KOI community.</p>
            <button
              onClick={() => { setSubmitted(false); setForm({ name: "", email: "", event: "", rating: 0, category: "", message: "", recommend: "" }); }}
              style={{ marginTop: "24px", backgroundColor: "#f36f21", color: "white", border: "none", borderRadius: "8px", padding: "12px 28px", fontSize: "16px", cursor: "pointer", fontWeight: "600" }}
            >
              Submit Another Feedback
            </button>
          </div>
        ) : (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "40px" }}>
            <h2 style={{ color: "#1f4e79", marginBottom: "8px" }}>Feedback Form</h2>
            <p style={{ color: "#6b7280", marginBottom: "28px", fontSize: "14px" }}>We value your opinion. Please take a moment to share your experience.</p>

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
                <label style={{ display: "block", color: "#374151", fontWeight: "600", marginBottom: "6px" }}>Event Name <span style={{ fontWeight: "400", color: "#9ca3af" }}>(optional)</span></label>
                <input
                  type="text"
                  name="event"
                  value={form.event}
                  onChange={handleChange}
                  placeholder="Which event are you reviewing?"
                  style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: "#374151", fontWeight: "600", marginBottom: "10px" }}>Overall Rating</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setForm({ ...form, rating: star })}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      style={{ fontSize: "36px", cursor: "pointer", color: star <= (hovered || form.rating) ? "#f36f21" : "#d1d5db" }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                {form.rating > 0 && (
                  <p style={{ color: "#f36f21", fontSize: "14px", marginTop: "6px" }}>
                    {form.rating === 1 ? "Poor" : form.rating === 2 ? "Fair" : form.rating === 3 ? "Good" : form.rating === 4 ? "Very Good" : "Excellent"}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: "#374151", fontWeight: "600", marginBottom: "6px" }}>Feedback Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box", backgroundColor: "white" }}
                >
                  <option value="">Select a category</option>
                  <option value="platform">Platform Experience</option>
                  <option value="event">Event Quality</option>
                  <option value="registration">Registration Process</option>
                  <option value="notifications">Notifications</option>
                  <option value="ai">AI Recommendations</option>
                  <option value="support">Customer Support</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: "#374151", fontWeight: "600", marginBottom: "6px" }}>Your Feedback</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Share your thoughts, suggestions, or experience..."
                  style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ marginBottom: "28px" }}>
                <label style={{ display: "block", color: "#374151", fontWeight: "600", marginBottom: "10px" }}>Would you recommend Smart Events to others?</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  {["Yes", "Maybe", "No"].map((option) => (
                    <label key={option} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#374151" }}>
                      <input
                        type="radio"
                        name="recommend"
                        value={option}
                        checked={form.recommend === option}
                        onChange={handleChange}
                        style={{ cursor: "pointer" }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                style={{ width: "100%", backgroundColor: "#f36f21", color: "white", border: "none", borderRadius: "8px", padding: "14px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
              >
                Submit Feedback
              </button>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
