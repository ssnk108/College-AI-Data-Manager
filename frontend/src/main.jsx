import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminAuthProvider } from "./auth/AdminAuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import "./index.css";
import AdminLayout from "./layouts/AdminLayout.jsx";
import PublicLayout from "./layouts/PublicLayout.jsx";
import AddAI from "./pages/AddAI.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import AdminPlaceholder from "./pages/AdminPlaceholder.jsx";
import CollegeDatabase from "./pages/CollegeDatabase.jsx";
import CollegeDetail from "./pages/CollegeDetail.jsx";
import CollegeFormPage from "./pages/CollegeFormPage.jsx";
import PublicHome from "./pages/PublicHome.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />

          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicHome />} />
            <Route path="/colleges" element={<CollegeDatabase variant="public" />} />
            <Route path="/search" element={<CollegeDatabase variant="public" />} />
            <Route path="/states/:state" element={<CollegeDatabase variant="public" />} />
            <Route path="/colleges/:id" element={<CollegeDetail variant="public" />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="database" element={<CollegeDatabase variant="admin" />} />
            <Route path="manual" element={<CollegeFormPage mode="create" />} />
            <Route path="ai-fill" element={<AddAI />} />
            <Route path="research" element={<AdminPlaceholder type="research" />} />
            <Route path="debug" element={<AdminPlaceholder type="debug" />} />
            <Route path="reports" element={<AdminPlaceholder type="reports" />} />
            <Route path="settings" element={<AdminPlaceholder type="settings" />} />
            <Route path="consultancy" element={<AdminPlaceholder type="consultancy" />} />
            <Route path="merge-queue" element={<AdminPlaceholder type="merge-queue" />} />
            <Route path="colleges/:id" element={<CollegeDetail variant="admin" />} />
            <Route path="colleges/:id/edit" element={<CollegeFormPage mode="edit" />} />
          </Route>

          <Route path="/add-manual" element={<Navigate to="/admin/manual" replace />} />
          <Route path="/add-ai" element={<Navigate to="/admin/ai-fill" replace />} />
          <Route path="/colleges/:id/edit" element={<Navigate to="/admin/login" replace state={{ adminRequired: true }} />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  </React.StrictMode>
);
