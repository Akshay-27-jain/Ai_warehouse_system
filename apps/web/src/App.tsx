import { lazy, Suspense, useEffect, useState } from "react";
import {
    Navigate,
    Outlet,
    Route,
    Routes
} from "react-router-dom";

import Layout from "./components/layout/Layout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const WarehousePage = lazy(() => import("./pages/WarehousePage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const DemandPredictionPage = lazy(() => import("./pages/DemandPredictionPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

function ProtectedRoute() {

    const token = localStorage.getItem("access_token");

    if (!token)
        return <Navigate to="/login" replace />;

    return <Outlet />;
}

export default function App() {

    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        try {
            const raw = localStorage.getItem('isDarkMode');
            return raw === null ? true : raw === 'true';
        } catch (e) {
            return true;
        }
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        try { localStorage.setItem('isDarkMode', isDarkMode ? 'true' : 'false'); } catch (e) {}
    }, [isDarkMode]);

    return (

        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400"><span className="text-lg">Loading...</span></div>}>
            <Routes>

                <Route path="/" element={<LandingPage />} />

                <Route path="/login" element={<LoginPage />} />

                <Route path="/register" element={<RegisterPage />} />

                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route path="/oauth2callback" element={<LoginPage />} />

                <Route element={<ProtectedRoute />}>

                    <Route
                        element={
                            <Layout
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}                        />
                        }
                    >

                        <Route
                            path="/search"
                            element={<SearchPage />}
                        />

                        <Route
                            path="/dashboard"
                            element={<DashboardPage />}
                        />

                        <Route
                            path="/warehouses"
                            element={<WarehousePage />}
                        />

                        <Route
                            path="/inventory"
                            element={<InventoryPage />}
                        />

                        <Route
                            path="/products"
                            element={<ProductPage />}
                        />

                        <Route
                            path="/orders"
                            element={<OrdersPage />}
                        />

                        <Route
                            path="/analytics"
                            element={<AnalyticsPage />}
                        />

                        <Route
                            path="/demand-prediction"
                            element={<DemandPredictionPage />}
                        />

                        <Route
                            path="/settings"
                            element={<SettingsPage />}
                        />

                    </Route>

                </Route>

                <Route
                    path="*"
                    element={<NotFoundPage />}
                />

            </Routes>
        </Suspense>

    );

}
