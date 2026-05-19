import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import CurrentAccountStatus from "./CurrentAccountStatus";
import { fetchPublicBrandingSettings } from "../../services/publicSettingsService.js";

function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandName, setBrandName] = useState("Smart Events");
  const navLinkClass =
    "relative inline-block pb-1 text-white transition-colors duration-200 hover:text-[#ff8a3d] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:bg-[#ff8a3d] after:transition-all after:duration-200 hover:after:w-full";
  const mobileNavLinkClass =
    "block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium !text-white transition hover:border-[#ff8a3d] hover:bg-white/10 hover:text-[#ff8a3d]";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    let isMounted = true;

    const loadBranding = async () => {
      try {
        const branding = await fetchPublicBrandingSettings();

        if (isMounted) {
          setBrandName(branding?.organization?.name || "Smart Events");
        }
      } catch {
        if (isMounted) {
          setBrandName("Smart Events");
        }
      }
    };

    loadBranding();

    return () => {
      isMounted = false;
    };
  }, []);

  const brandInitials = brandName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "SE";

  const renderBrandInitials = () => {
    const first = brandInitials[0] || "S";
    const second = brandInitials[1] || "";

    return (
      <span>
        <span className="text-[#1f4e79]">{first}</span>
        {second ? <span className="text-[#f36f21]">{second}</span> : null}
      </span>
    );
  };

  return (
    <>
      {mobileMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#061521]/70 backdrop-blur-[2px] md:hidden"
          aria-label="Close navigation menu overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <nav className="sticky top-0 z-50 border-b border-[#163a5a] bg-[#163c5e]">
        <div
          className={`mx-auto w-full max-w-[1440px] px-4 transition-all duration-200 sm:px-6 lg:px-12 ${
            mobileMenuOpen ? "py-2.5" : "py-4"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <div
                className={`flex shrink-0 items-center justify-center rounded-2xl bg-white font-black text-[#1f4e79] shadow-sm transition-all duration-200 ${
                  mobileMenuOpen ? "h-9 w-9 text-base" : "h-11 w-11 text-lg"
                }`}
              >
                {renderBrandInitials()}
              </div>
              <div className="min-w-0">
                <p
                  className={`truncate font-bold tracking-tight text-white transition-all duration-200 ${
                    mobileMenuOpen ? "text-base" : "text-lg"
                  }`}
                >
                  {brandName}
                </p>
                <p
                  className={`truncate font-medium uppercase text-slate-200 transition-all duration-200 ${
                    mobileMenuOpen ? "text-[10px] tracking-[0.18em]" : "text-xs tracking-[0.24em]"
                  }`}
                >
                  Discover and manage
                </p>
              </div>
            </Link>

            <ul className="hidden items-center gap-8 text-normal font-normal text-white md:flex">
              <li>
                <Link to="/" className={navLinkClass}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/browse-events" className={navLinkClass}>
                  Browse Events
                </Link>
              </li>
              <li>
                <Link to="/#categories" className={navLinkClass}>
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/about" className={navLinkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className={navLinkClass}>
                  Contact
                </Link>
              </li>
            </ul>

            <div className="hidden items-center gap-3 md:flex">
              <CurrentAccountStatus />
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:border-[#ff8a3d] hover:text-[#ff8a3d] md:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="absolute inset-x-4 top-full mt-3 space-y-4 rounded-3xl border border-white/10 bg-[#102f4a] p-4 shadow-2xl md:hidden sm:inset-x-6">
              <div className="grid gap-2">
                <Link to="/" className={mobileNavLinkClass}>
                  Home
                </Link>
                <Link to="/browse-events" className={mobileNavLinkClass}>
                  Browse Events
                </Link>
                <Link to="/#categories" className={mobileNavLinkClass}>
                  Categories
                </Link>
                <Link to="/about" className={mobileNavLinkClass}>
                  About
                </Link>
                <Link to="/contact" className={mobileNavLinkClass}>
                  Contact
                </Link>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
                <CurrentAccountStatus />
              </div>
            </div>
          ) : null}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
