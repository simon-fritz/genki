import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import MainLayout from "@/components/layout/MainLayout";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import SettingsPage from "@/pages/Settings/LearnStyleSettingsPage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
