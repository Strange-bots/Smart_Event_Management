import { useState } from "react";
import { Link } from "react-router-dom";

function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (event) => {
    event.preventDefault();
    setEmail("");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const socialLinks = [
    { label: "Facebook", href: "https://www.facebook.com/KOIAustralia", symbol: "f" },
    { label: "Twitter", href: "https://twitter.com", symbol: "x" },
    { label: "LinkedIn", href: " https://au.linkedin.com/school/king's-own-institute/  ", symbol: "in" },
    { label: "Instagram", href: "https://www.instagram.com/koiaustralia/", symbol: "ig" },
  ];

  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/browse-events", label: "Browse Events" },
    { href: "/contact", label: "Contact" },
    { href: "/about", label: "About Us" },
  ];

  const supportLinks = [
    { href: "/help", label: "Help Center" },
    { href: "/faqs", label: "FAQs" },
    { href: "/report", label: "Report Issue" },
    { href: "/feedback", label: "Feedback" },
  ];

  const legalLinks = [
    { href: "/privacy-policy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/cookies", label: "Cookies" },
  ];

  return (
    <footer
      id="footer"
      className="relative overflow-hidden bg-[#0f1e33] text-white"
    >
      <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-[#f36f21]/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-[#6d5df6]/10 blur-3xl" />

      <div className="relative border-b border-white/10">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-10 lg:px-12">
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row lg:gap-12">
            <div className="text-center lg:text-left">
              <div className="mb-2 flex items-center justify-center gap-2 lg:justify-start">
                <span className="text-[#f36f21]">✦</span>
                <span className="text-sm font-medium uppercase tracking-wide text-[#f36f21]">
                  Stay Updated
                </span>
              </div>
              <h3 className="text-xl font-bold text-white md:text-2xl">
                Subscribe to our Newsletter
              </h3>
              <p className="mt-1 max-w-md text-sm text-white/60">
                Get the latest events, recommendations, and exclusive updates
                delivered to your inbox.
              </p>
            </div>

            <form
              onSubmit={handleSubscribe}
              className="flex w-full max-w-md gap-2"
            >
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#f36f21] focus:outline-none"
                required
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-[#f36f21] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ff8a3d]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          <div className="space-y-5 lg:col-span-2">
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-3 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1.5 font-black text-[#1f4e79] transition-transform duration-300 group-hover:scale-105">
                SE
              </div>
              <div>
                <span className="block text-xl font-bold">Smart Events</span>
                <span className="text-xs text-white/50">
                  by King&apos;s Own Institute
                </span>
              </div>
            </button>

            <p className="max-w-sm text-sm leading-relaxed text-white/70">
              Empowering educational events with data-driven insights.
              Discover, register, and engage with events that matter to your
              academic journey.
            </p>

            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/60 transition-all duration-300 hover:bg-[#f36f21] hover:text-white"
                  aria-label={link.label}
                >
                  {link.symbol}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-lg font-semibold text-white">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="inline-block text-sm text-white/70 transition-colors hover:text-[#f36f21]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-lg font-semibold text-white">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-block text-sm text-white/70 transition-colors hover:text-[#f36f21]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-lg font-semibold text-white">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f36f21]/20 text-[#f36f21]">
                  📍
                </div>
                <span className="leading-relaxed text-white/70">
                  Level 1, 545 Kent Street, Sydney NSW 2000
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f36f21]/20 text-[#f36f21]">
                  ☎
                </div>
                <a
                  href="tel:+61292833583"
                  className="text-white/70 transition-colors hover:text-[#f36f21]"
                >
                  +61 2 9283 3583
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f36f21]/20 text-[#f36f21]">
                  ✉
                </div>
                <a
                  href="mailto:events@koi.edu.au"
                  className="text-white/70 transition-colors hover:text-[#f36f21]"
                >
                  events@koi.edu.au
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-center text-sm text-white/50 md:text-left">
            © {new Date().getFullYear()} King&apos;s Own Institute. All rights
            reserved. Made in Sydney.
          </p>
          <div className="flex items-center gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-white/50 transition-colors hover:text-[#f36f21]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#f36f21] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#ff8a3d]"
        aria-label="Back to top"
      >
        ↑
      </button>
    </footer>
  );
}

export default Footer;
