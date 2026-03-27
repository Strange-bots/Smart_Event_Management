import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const iconClassName = "text-lg leading-none";

const HomeIcon = () => <span className={iconClassName}>⌂</span>;
const CalendarIcon = () => <span className={iconClassName}>📅</span>;
const ChartIcon = () => <span className={iconClassName}>📊</span>;
const UsersIcon = () => <span className={iconClassName}>👥</span>;
const LogoutIcon = () => <span className={iconClassName}>⇦</span>;
const MenuIcon = () => <span className={iconClassName}>☰</span>;
const CloseIcon = () => <span className={iconClassName}>✕</span>;
const MessageIcon = () => <span className={iconClassName}>✉</span>;
const SettingIcon = () => <span className={iconClassName}>*</span>;
const CollapseIcon = ({ collapsed }) => (
  <span
    className={cn(
      iconClassName,
      "inline-block transition-transform",
      collapsed ? "rotate-180" : ""
    )}
  >
    ❮
  </span>
);

const roleLabels = {
  admin: "Administrator",
  user: "Student User",
  organizer: "Event Organizer",
};

const navItemsByRole = {
  admin: [
    { path: "/admin/admindashboard", label: "Overview", icon: HomeIcon },
    { path: "/admin/adminevents", label: "Events", icon: CalendarIcon },
    { path: "/admin/adminusers", label: "Users", icon: UsersIcon },
    { path: "/admin/adminmessage", label: "Messages", icon: MessageIcon },
    { path: "/admin/adminsettings", label: "Settings", icon: SettingIcon },
    { path: "logout", label: "Log Out", icon: LogoutIcon },
  ],
  user: [
    { path: "/user/dashboard", label: "Overview", icon: HomeIcon },
    { path: "/browse-events", label: "Browse", icon: CalendarIcon },
    { path: "/contact", label: "Support", icon: UsersIcon },
    { path: "logout", label: "Log Out", icon: LogoutIcon },
  ],
  organizer: [
    { path: "/organizer/organizerdashboard", label: "Overview", icon: HomeIcon },
    { path: "/browse-events", label: "Events", icon: CalendarIcon },
    { path: "/about", label: "Analytics", icon: ChartIcon },
    { path: "logout", label: "Log Out", icon: LogoutIcon },
  ],
};

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const storedUser = window.localStorage.getItem("smart_event_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userRole = currentUser?.role ?? "user";
  const userName = currentUser?.email ?? "Guest User";
  const items = navItemsByRole[userRole] ?? navItemsByRole.user;

  const handleLogout = () => {
    window.localStorage.removeItem("smart_event_user");
    navigate("/login");
  };

  const renderNavItems = (isMobile = false) =>
    items.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;
      const isLogout = item.path === "logout";

      if (isLogout) {
        return (
          <button
            key={item.path}
            onClick={() => {
              if (isMobile) {
                setMobileMenuOpen(false);
              }
              handleLogout();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
              "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon />
            {(!isMobile && sidebarOpen) || isMobile ? (
              <span className="font-medium">{item.label}</span>
            ) : null}
          </button>
        );
      }

      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => {
            if (isMobile) {
              setMobileMenuOpen(false);
            }
          }}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
            isActive
              ? "bg-[#f36f21] text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
        >
          <Icon />
          {(!isMobile && sidebarOpen) || isMobile ? (
            <span className="font-medium">{item.label}</span>
          ) : null}
        </Link>
      );
    });

  return (
    <div className="flex min-h-screen w-full bg-[#f5f7fa]">
      <aside
        className={cn(
          "hidden flex-col bg-gradient-to-b from-[#1f4e79] via-[#163a5a] to-[#0f1e33] transition-all duration-300 md:flex",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-white p-1 font-black text-[#1f4e79]">
              SE
            </div>
            {sidebarOpen ? (
              <span className="font-semibold text-white">Smart Events</span>
            ) : null}
          </Link>
          <button
            onClick={() => setSidebarOpen((value) => !value)}
            className="p-1 text-white/70 hover:text-white"
            aria-label="Toggle sidebar"
          >
            <CollapseIcon collapsed={!sidebarOpen} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">{renderNavItems(false)}</nav>
      </aside>

      {mobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-gradient-to-b from-[#1f4e79] via-[#163a5a] to-[#0f1e33] transition-transform md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-white p-1 font-black text-[#1f4e79]">
              SE
            </div>
            <span className="font-semibold text-white">Smart Events</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 text-white"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="space-y-1 p-4">{renderNavItems(true)}</nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#d9e2ec] bg-white px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 text-[#0f1e33] md:hidden"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#6b7c93]">@</span>
              <span className="font-semibold text-[#0f1e33]">
                KOI Smart Events
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[#0f1e33]">{userName}</p>
              <p className="text-xs text-[#6b7c93]">
                {roleLabels[userRole] ?? "Dashboard User"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f7fa] text-[#6b7c93]">
              <UsersIcon />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
