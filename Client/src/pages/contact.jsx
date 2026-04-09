import { useState } from "react";
import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
} from "lucide-react";

const contactMessagesStore = [];

export const getContactMessages = () => contactMessagesStore;

const initialFormData = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

function validateContactForm(formData) {
  const errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formData.fullName.trim()) {
    errors.fullName = "Full name is required";
  } else if (formData.fullName.trim().length > 100) {
    errors.fullName = "Name must be less than 100 characters";
  }

  if (!formData.email.trim()) {
    errors.email = "Email is required";
  } else if (!emailPattern.test(formData.email.trim())) {
    errors.email = "Invalid email address";
  } else if (formData.email.trim().length > 255) {
    errors.email = "Email must be less than 255 characters";
  }

  if (!formData.subject.trim()) {
    errors.subject = "Subject is required";
  } else if (formData.subject.trim().length > 200) {
    errors.subject = "Subject must be less than 200 characters";
  }

  if (!formData.message.trim()) {
    errors.message = "Message is required";
  } else if (formData.message.trim().length > 2000) {
    errors.message = "Message must be less than 2000 characters";
  }

  return errors;
}

function Contact() {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (event) => {
    const { id, value } = event.target;

    setFormData((prev) => ({ ...prev, [id]: value }));

    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const validationErrors = validateContactForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    const cleanedData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    };

    contactMessagesStore.push({
      ...cleanedData,
      id: `msg-${Date.now()}`,
      date: new Date().toISOString(),
      status: "unread",
    });

    setErrors({});
    setIsSubmitted(true);

    setTimeout(() => {
      setFormData(initialFormData);
      setIsSubmitted(false);
    }, 3000);

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fa]">
      <Navbar />
      <main className="flex-1 bg-[#f5f7fa]">
        <div className="bg-gradient-to-b from-[#2e5f8f] to-[#345f8d] py-24 md:py-32">
          <div className="mx-auto max-w-[1440px] px-4 text-center lg:px-12">
            <h1 className="mb-5 text-4xl font-bold text-white md:text-[4rem]">
              Contact Us
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-white/85 md:text-[1.15rem]">
              Have questions about events, registrations, or our platform?
              We&apos;re here to help!
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1440px] px-4 py-12 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.95fr]">
            <div className="space-y-6">
              <div className="rounded-2xl bg-white shadow-[0_10px_35px_rgba(15,30,51,0.08)]">
                <div className="p-8 pb-5">
                  <h2 className="text-[2rem] font-bold text-[#1f4e79]">
                    Get in Touch
                  </h2>
                  <p className="mt-1 text-base text-[#6b7c93]">
                    Reach out to us through any of these channels
                  </p>
                </div>

                <div className="space-y-6 p-8 pt-1">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f36f21]/10">
                      <Mail className="text-[#f36f21]" size={22} />
                    </div>
                    <div>
                      <p className="text-[1.05rem] font-medium text-[#0f1e33]">
                        Email
                      </p>
                      <a
                        href="mailto:events@koi.edu.au"
                        className="text-[1.05rem] text-[#5f7fa9] transition-colors hover:text-[#f36f21]"
                      >
                        events@koi.edu.au
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f36f21]/10">
                      <Phone className="text-[#f36f21]" size={22} />
                    </div>
                    <div>
                      <p className="text-[1.05rem] font-medium text-[#0f1e33]">
                        Phone
                      </p>
                      <a
                        href="tel:+61292833583"
                        className="text-[1.05rem] text-[#5f7fa9] transition-colors hover:text-[#f36f21]"
                      >
                        +61 2 9283 3583
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f36f21]/10">
                      <MapPin className="text-[#f36f21]" size={22} />
                    </div>
                    <div>
                      <p className="text-[1.05rem] font-medium text-[#0f1e33]">
                        Address
                      </p>
                      <p className="text-[1.05rem] leading-relaxed text-[#5f7fa9]">
                        Level 1, 545 Kent Street
                        <br />
                        Sydney NSW 2000, Australia
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f36f21]/10">
                      <Clock className="text-[#f36f21]" size={22} />
                    </div>
                    <div>
                      <p className="text-[1.05rem] font-medium text-[#0f1e33]">
                        Office Hours
                      </p>
                      <p className="text-[1.05rem] leading-relaxed text-[#5f7fa9]">
                        Mon - Fri: 9:00 AM - 5:00 PM
                        <br />
                        Sat - Sun: Closed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_35px_rgba(15,30,51,0.08)]">
                <div className="flex h-48 items-center justify-center bg-[#f5f7fa]">
                  <div className="text-center text-[#6b7c93]">
                    <MapPin size={32} className="mx-auto mb-2" />
                    <p className="text-sm">Map integration placeholder</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-white shadow-[0_10px_35px_rgba(15,30,51,0.08)]">
                <div className="p-8 pb-5">
                  <h2 className="text-[2rem] font-bold text-[#1f4e79]">
                    Send us a Message
                  </h2>
                  <p className="mt-1 text-base text-[#6b7c93]">
                    Fill out the form below and we&apos;ll get back to you
                    within 24-48 hours
                  </p>
                </div>

                <div className="p-8 pt-1">
                  {isSubmitted ? (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-600" size={32} />
                      </div>
                      <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                        Message Sent!
                      </h3>
                      <p className="text-muted-foreground">
                        Thank you for contacting us. We&apos;ll respond to your
                        inquiry soon.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label
                            htmlFor="fullName"
                            className="text-[1.02rem] font-medium text-[#0f1e33]"
                          >
                            Full Name *
                          </label>
                          <input
                            id="fullName"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={handleChange}
                            className={`w-full rounded-lg border bg-white px-4 py-3 text-[1.02rem] text-[#0f1e33] outline-none transition placeholder:text-[#6b7c93] ${
                              errors.fullName
                                ? "border-red-500"
                                : "border-[#d9e2ec] focus:border-[#1f4e79]"
                            }`}
                          />
                          {errors.fullName && (
                            <p className="text-sm text-red-500">
                              {errors.fullName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="email"
                            className="text-[1.02rem] font-medium text-[#0f1e33]"
                          >
                            Email Address *
                          </label>
                          <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full rounded-lg border bg-white px-4 py-3 text-[1.02rem] text-[#0f1e33] outline-none transition placeholder:text-[#6b7c93] ${
                              errors.email
                                ? "border-red-500"
                                : "border-[#d9e2ec] focus:border-[#1f4e79]"
                            }`}
                          />
                          {errors.email && (
                            <p className="text-sm text-red-500">
                              {errors.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="subject"
                          className="text-[1.02rem] font-medium text-[#0f1e33]"
                        >
                          Subject *
                        </label>
                        <input
                          id="subject"
                          placeholder="What is your message about?"
                          value={formData.subject}
                          onChange={handleChange}
                          className={`w-full rounded-lg border bg-white px-4 py-3 text-[1.02rem] text-[#0f1e33] outline-none transition placeholder:text-[#6b7c93] ${
                            errors.subject
                              ? "border-red-500"
                              : "border-[#d9e2ec] focus:border-[#1f4e79]"
                          }`}
                        />
                        {errors.subject && (
                          <p className="text-sm text-red-500">
                            {errors.subject}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="message"
                          className="text-[1.02rem] font-medium text-[#0f1e33]"
                        >
                          Message *
                        </label>
                        <textarea
                          id="message"
                          placeholder="Type your message here..."
                          rows={6}
                          value={formData.message}
                          onChange={handleChange}
                          className={`w-full rounded-lg border bg-white px-4 py-3 text-[1.02rem] text-[#0f1e33] outline-none transition placeholder:text-[#6b7c93] ${
                            errors.message
                              ? "border-red-500"
                              : "border-[#d9e2ec] focus:border-[#1f4e79]"
                          }`}
                        />
                        {errors.message && (
                          <p className="text-sm text-red-500">
                            {errors.message}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#f36f21] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff8a3d] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
                        disabled={isSubmitting}
                      >
                        <Send size={18} />
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Contact;
