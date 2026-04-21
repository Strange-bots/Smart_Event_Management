import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserCircle } from "lucide-react";
import { getCurrentUser, getDashboardPath } from "../../utils/auth";

function CurrentAccountStatus() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const syncCurrentUser = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener("storage", syncCurrentUser);
    window.addEventListener("focus", syncCurrentUser);

    return () => {
      window.removeEventListener("storage", syncCurrentUser);
      window.removeEventListener("focus", syncCurrentUser);
    };
  }, []);

  if (!currentUser?.token) {
    return (
      <>
        <Link
          to="/login"
          className="rounded-lg border border-white/60 bg-white px-4 py-2 text-sm font-semibold text-[#1f4e79] opacity-100 transition-opacity duration-300 hover:opacity-70"
        >
          Log In
        </Link>
        <Link
          to="/signup"
          className="rounded-lg bg-[#f36f21] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff8a3d]"
        >
          Sign Up
        </Link>
      </>
    );
  }

  const displayName = currentUser.name || currentUser.email || "Account";
  const dashboardPath = getDashboardPath(currentUser.role);

  return (
    <Link
      to={dashboardPath}
      className="flex min-w-0 items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:border-[#ff8a3d] hover:bg-white/15"
      title={displayName}
    >
      <UserCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="max-w-36 truncate">{displayName}</span>
      <span className="rounded-full bg-[#f36f21] px-2 py-0.5 text-xs capitalize text-white">
        {currentUser.role || "user"}
      </span>
    </Link>
  );
}

export default CurrentAccountStatus;
