import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GuestRoute from "@/components/auth/GuestRoute";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import SettingsPage from "@/pages/Settings/LearnStyleSettingsPage";
import LoginPage from "@/pages/Auth/LoginPage";
import RegisterPage from "@/pages/Auth/RegisterPage";
import CreateCardPage from "./pages/Deck/CreateCardPage";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";

const router = createBrowserRouter([
    {
        element: <MainLayout />,
        children: [
            {
                element: <GuestRoute />,
                children: [
                    { path: "/login", element: <LoginPage /> },
                    { path: "/register", element: <RegisterPage /> },
                ],
            },
            {
                element: <ProtectedRoute />,
                children: [
                    { index: true, element: <DashboardPage /> },
                    { path: "/settings", element: <SettingsPage /> },
                    {
                        path: "/deck/:deckId/newcard",
                        element: <CreateCardPage />,
                    },
                ],
            },
        ],
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Toaster position="top-center" />
        <RouterProvider router={router} />
    </StrictMode>,
);
