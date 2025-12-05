import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router';
import MainLayout from "./components/layout/MainLayout";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import './index.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route element={<MainLayout />}>
					<Route index element={<DashboardPage />} />
				</Route>
			</Routes>
		</BrowserRouter>
	</StrictMode>
);
