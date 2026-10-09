import { Navigate, useLocation } from "react-router-dom";

function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("crisisops_user") || "null"
    );
  } catch {
    return null;
  }
}

function ProtectedRoute({
  children,
  roles = [],
}) {
  const location = useLocation();

  const token = localStorage.getItem(
    "crisisops_token"
  );

  const user = getStoredUser();

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (
    roles.length > 0 &&
    !roles.includes(user.role)
  ) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;