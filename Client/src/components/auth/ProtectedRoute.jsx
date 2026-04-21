import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  authorizeDashboardAccess,
  clearCurrentUser,
  getCurrentUser,
  getDashboardPath,
  setCurrentUser,
} from "../../utils/auth";

const ProtectedRoute = ({ role, children }) => {
  const [state, setState] = useState({
    isLoading: true,
    authorized: false,
    redirectTo: "/login",
  });

  useEffect(() => {
    let isMounted = true;

    const validateAccess = async () => {
      const currentUser = getCurrentUser();

      if (!currentUser?.email) {
        if (isMounted) {
          setState({ isLoading: false, authorized: false, redirectTo: "/login" });
        }
        return;
      }

      try {
        const result = await authorizeDashboardAccess(role);

        if (!isMounted) {
          return;
        }

        if (result.authorized) {
          setCurrentUser(result.user);
          setState({ isLoading: false, authorized: true, redirectTo: "" });
          return;
        }

        if (result.user?.role) {
          setCurrentUser(result.user);
          setState({
            isLoading: false,
            authorized: false,
            redirectTo: getDashboardPath(result.user.role),
          });
          return;
        }

        clearCurrentUser();
        setState({ isLoading: false, authorized: false, redirectTo: "/login" });
      } catch {
        if (isMounted) {
          clearCurrentUser();
          setState({ isLoading: false, authorized: false, redirectTo: "/login" });
        }
      }
    };

    validateAccess();

    return () => {
      isMounted = false;
    };
  }, [role]);

  if (state.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="rounded-lg bg-white px-6 py-5 text-center shadow-sm">
          <p className="font-medium text-[#0f1e33]">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!state.authorized) {
    return <Navigate to={state.redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
