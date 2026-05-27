import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import "./index.css";
import AddAI from "./pages/AddAI.jsx";
import CollegeDatabase from "./pages/CollegeDatabase.jsx";
import CollegeDetail from "./pages/CollegeDetail.jsx";
import CollegeFormPage from "./pages/CollegeFormPage.jsx";
import Home from "./pages/Home.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/add-manual" element={<CollegeFormPage mode="create" />} />
          <Route path="/add-ai" element={<AddAI />} />
          <Route path="/colleges" element={<CollegeDatabase />} />
          <Route path="/colleges/:id" element={<CollegeDetail />} />
          <Route path="/colleges/:id/edit" element={<CollegeFormPage mode="edit" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

