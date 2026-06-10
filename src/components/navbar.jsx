import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import logoNissan from "../assets/Nissan.png";
import { logoutRequest } from "../services/authService";
import "../App.css";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Detectar sesión activa
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isLoggedIn = Boolean(user);

  const goTo = (path) => {
    setOpen(false);
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logoutRequest(); // limpia cookie httpOnly + localStorage
    navigate("/", { replace: true }); // replace evita volver con "atrás"
  };

  const isActive = (path) => location.pathname === path;

  const role = localStorage.getItem("role");

  const links = [
    { path: "/", label: "Home" },
    { path: "/contact", label: "Contacto" },
    { path: "/reporteDeHallazgo", label: "Reportar Hallazgo" },
    { path: "/adminHallazgos", label: "Admin Hallazgos" },
    { path: "/reporteIncidente", label: "Reportar Incidente" },
    { path: "/adminIncidentes", label: "Admin Incidentes" },
    { path: "/auditorias", label: "Auditorias" },
    { path: "/misHallazgos", label: "Hallazgos que Reporte" },
    ...(role === "Admin" ? [{ path: "/adminPanel", label: "Panel Admin" }] : []),
  ];


  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => goTo("/")}>
          <img src={logoNissan} alt="Nissan" />
        </div>

        {/* Menú centrado */}
        <ul className={`navbar-menu${menuOpen ? " menu-open" : ""}`}>
          {links.map((link) => (
            <li key={link.path}>
              <span
                className={isActive(link.path) ? "active" : ""}
                onClick={() => goTo(link.path)}
              >
                {link.label}
              </span>
            </li>
          ))}
        </ul>

        {/* Hamburger (móvil) */}
        <button
          className={`hamburger${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Usuario */}
        <div className="user-icon" onClick={() => setOpen(!open)}>
          <FaUserCircle size={28} />
        </div>
      </nav>

      {/* Overlay + Dropdown */}
      {open && (
        <div className="login-overlay" onClick={() => setOpen(false)}>
          <div
            className="login-popup-content user-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoggedIn ? (
              <>
                <div className="user-dropdown-info">
                  <FaUserCircle size={32} className="user-dropdown-avatar" />
                  <span className="user-dropdown-name">
                    {user.name || user.email || "Usuario"}
                  </span>
                </div>
                <button
                  className="btn-profile"
                  onClick={() => goTo("/miPerfil")}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "transparent",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    transition: "all var(--transition-base)",
                    fontFamily: "var(--font-sans)",
                    marginBottom: "8px",
                    textAlign: "center"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "var(--bg-card-hover)";
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "var(--border-default)";
                  }}
                >
                  Mi Perfil
                </button>
                <button className="btn-logout" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button onClick={() => goTo("/login")}>
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      )}

      {/* Espacio por navbar fijo */}
      <div id="spacer"></div>
    </>
  );
};

export default Navbar;