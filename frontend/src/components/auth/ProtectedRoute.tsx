import { Navigate, Outlet } from "react-router";
import { getAccessToken, getRefreshToken, clearTokens } from "@/api/client";

function isAuthValid(): boolean {
    const access = getAccessToken();
    const refresh = getRefreshToken();
    const user = localStorage.getItem("user");

    if (!access || !refresh || !user) {
        clearTokens();
        return false;
    }

    return true;
}

export default function ProtectedRoute() {
    if (!isAuthValid()) {
        return (
            <Navigate to="/login" replace state={{ sessionExpired: true }} />
        );
    }
    return <Outlet />;
}
