import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute
 * Bloquea el acceso a rutas privadas si no hay sesión activa.
 * La sesión se determina por la existencia del objeto "user" en localStorage,
 * el cual es guardado por Login.jsx tras un login exitoso.
 *
 * Rutas públicas (no requieren este wrapper):
 *  - /           (Homepage)
 *  - /contact    (Contactos)
 *  - /login      (Login)
 */
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem("user");

  if (!user) {
    // Sin sesión → redirigir al login
    return <Navigate to="/login" replace />;
  }

  // Con sesión → renderizar la página solicitada
  return children;
};

export default ProtectedRoute;
