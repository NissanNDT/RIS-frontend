import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Homepage from "./pages/HomePage";
import Contact from "./pages/Contact";
import ReporteDeHallazgo from "./pages/ReporteDeHallazgos";
import AdminHallazgos from "./pages/AdminHallazgos";
import ReporteDeIncidentes from "./pages/ReporteDeIncidentes";
import AdminIncidentes from "./pages/AdminIncidentes";

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
        {/* demás rutas */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;