// components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
  isAuth: boolean; // Whether the user is authenticated
  redirectTo?: string; // Optional redirect path if not authenticated
}

const ProtectedRoute = ({ children, isAuth, redirectTo = "/auth" }: ProtectedRouteProps) => {
  if (!isAuth) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
};

export default ProtectedRoute;
