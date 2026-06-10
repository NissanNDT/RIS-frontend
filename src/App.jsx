import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Homepage from "./pages/Homepage";
import Contact from "./pages/Contact";
import ReporteDeHallazgo from "./pages/ReporteDeHallazgos";
import AdminHallazgos from "./pages/AdminHallazgos";
import ReporteDeIncidentes from "./pages/ReporteDeIncidentes";
import AdminIncidentes from "./pages/AdminIncidentes";
import Auditorias from "./pages/Auditorias";
import DetalleAuditoria from "./pages/DetalleAuditoria";
import LlenadoFormatoIncidente from "./pages/LlenadoFormatoIncidente";
import HallazgosQueReporte from "./pages/HallazgosQueReporte";
import AdminPanel from "./pages/AdminPanel";
import MiPerfil from "./pages/MiPerfil";
import { isTokenExpired } from "./utils/auth";
import { logoutRequest } from "./services/authService";

function App() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && isTokenExpired(token)) {
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("token");
      logoutRequest();
      window.location.href = "/login?expired=true";
    }
  }, []);

  return (

    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* ── Rutas públicas ── */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact" element={<Contact />} />

        {/* ── Rutas privadas (requieren sesión) ── */}
        <Route path="/reporteDeHallazgo" element={<ProtectedRoute><ReporteDeHallazgo /></ProtectedRoute>} />
        <Route path="/adminHallazgos" element={<ProtectedRoute><AdminHallazgos /></ProtectedRoute>} />
        <Route path="/reporteIncidente" element={<ProtectedRoute><ReporteDeIncidentes /></ProtectedRoute>} />
        <Route path="/adminIncidentes" element={<ProtectedRoute><AdminIncidentes /></ProtectedRoute>} />
        <Route path="/auditorias" element={<ProtectedRoute><Auditorias /></ProtectedRoute>} />
        <Route path="/auditorias/:id" element={<ProtectedRoute><DetalleAuditoria /></ProtectedRoute>} />
        <Route path="/llenadoFormatoIncidente" element={<ProtectedRoute><LlenadoFormatoIncidente /></ProtectedRoute>} />
        <Route path="/misHallazgos" element={<ProtectedRoute><HallazgosQueReporte /></ProtectedRoute>} />
        <Route path="/adminPanel" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/miPerfil" element={<ProtectedRoute><MiPerfil /></ProtectedRoute>} />
        {/* demás rutas */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;