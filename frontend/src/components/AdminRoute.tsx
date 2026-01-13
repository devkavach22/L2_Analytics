// components/AdminRoute.tsx
import { Navigate } from "react-router-dom";

interface AdminRouteProps {
  children: JSX.Element;
  isAdmin: boolean;
  redirectTo?: string;
}

const AdminRoute = ({ children, isAdmin, redirectTo = "/dashboard" }: AdminRouteProps) => {
  if (!isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
};

export default AdminRoute;
