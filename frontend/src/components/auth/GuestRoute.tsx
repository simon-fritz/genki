import { Navigate, Outlet } from "react-router";
import { getAccessToken } from "@/api/client";

export default function GuestRoute() {
    if (getAccessToken()) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
}
