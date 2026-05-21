import { Navigate, useLocation } from "react-router-dom";

/**
 * ProtectedRoute
 * Bloquea el acceso a rutas privadas si no hay sesión activa.
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    // Sin sesión → redirigir al login
    return <Navigate to="/login" replace />;
  }

  // Si el rol es General, restringir rutas
  if (role === "General") {
    // Estas son las rutas públicas y permitidas según requerimiento
    const allowedPaths = ["/", "/contact", "/reporteDeHallazgo"];
    if (!allowedPaths.includes(location.pathname)) {
      // Intenta acceder a una ruta no permitida -> redirigir a inicio
      return <Navigate to="/" replace />;
    }
  }

  // Con sesión y permisos → renderizar la página solicitada
  return children;
};

export default ProtectedRoute;
