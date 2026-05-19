import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Login from "./pages/Login";
import Homepage from "./pages/HomePage";
import Contact from "./pages/Contact";
import ReporteDeHallazgo from "./pages/ReporteDeHallazgos";
import AdminHallazgos from "./pages/AdminHallazgos";
import ReporteDeIncidentes from "./pages/ReporteDeIncidentes";
import AdminIncidentes from "./pages/AdminIncidentes";
import Auditorias from "./pages/Auditorias";
import DetalleAuditoria from "./pages/DetalleAuditoria";
import LlenadoFormatoIncidente from "./pages/LlenadoFormatoIncidente";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact" element={<Contact />} /> 
        <Route path="/reporteDeHallazgo" element={<ReporteDeHallazgo />} />
        <Route path="/adminHallazgos" element={<AdminHallazgos />} />
        <Route path="/reporteIncidente" element={<ReporteDeIncidentes />} />
        <Route path="/adminIncidentes" element={<AdminIncidentes />} />
        <Route path="/auditorias" element={<Auditorias />} />
        <Route path="/auditorias/:id" element={<DetalleAuditoria />} />
        <Route path="/llenadoFormatoIncidente" element={<LlenadoFormatoIncidente />} />
        {/* demás rutas */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;