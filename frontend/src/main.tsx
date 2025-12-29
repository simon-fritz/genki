import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter, Routes, Route} from "react-router";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GuestRoute from "@/components/auth/GuestRoute";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import SettingsPage from "@/pages/Settings/LearnStyleSettingsPage";
import LoginPage from "@/pages/Auth/LoginPage";
import RegisterPage from "@/pages/Auth/RegisterPage";
//import CreateCardPage from "./pages/Deck/CreateCardPage";
import {Toaster} from "@/components/ui/sonner";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Toaster position="top-center"/>
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout/>}>
                    {/* Guest (public) routes */}
                    <Route element={<GuestRoute/>}>
                        <Route path="/login" element={<LoginPage/>}/>
                        <Route path="/register" element={<RegisterPage/>}/>
                    </Route>

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute/>}>
                        <Route index element={<DashboardPage/>}/>
                        <Route path="/settings" element={<SettingsPage/>}/>
                        {/*
                           TODO: fix CreateCardPage import
                            <Route
                              path="/deck/:deckId/newcard"
                              element={<CreateCardPage />}
                              />
                             */}
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
