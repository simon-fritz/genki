import { Navigate, Outlet } from "react-router";
import { getAccessToken } from "@/api/client";

export default function ProtectedRoute() {
    if (!getAccessToken()) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
}
