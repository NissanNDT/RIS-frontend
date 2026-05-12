import { useNavigate } from "react-router-dom";
import "../App.css";

const Homepage = () => {
  const navigate = useNavigate();

  const quickLinks = [
    {
      icon: "📋",
      title: "Reportar Hallazgo",
      desc: "Registra hallazgos de seguridad para su seguimiento y resolución.",
      path: "/reporteDeHallazgo",
    },
    {
      icon: "🚨",
      title: "Reportar Incidente",
      desc: "Documenta incidentes de seguridad ocurridos en planta.",
      path: "/reporteIncidente",
    },
    {
      icon: "📞",
      title: "Contactos",
      desc: "Directorio de contactos de emergencia y encargados de área.",
      path: "/contact",
    },
    {
      icon: "📊",
      title: "Admin Hallazgos",
      desc: "Gestiona y da seguimiento a los hallazgos reportados.",
      path: "/adminHallazgos",
    },
    {
      icon: "📁",
      title: "Admin Incidentes",
      desc: "Administra los incidentes de seguridad registrados.",
      path: "/adminIncidentes",
    },
  ];

  return (
    <div className="homepage">
      {/* Hero */}
      <section className="hero-section">
        <span className="hero-badge">🔒 Sistema de Seguridad</span>
        <h1 className="hero-title">
          Reporte de <span className="highlight">Incidentes</span> y Seguridad
        </h1>
        <p className="hero-subtitle">
          Plataforma integral para el registro, seguimiento y gestión de hallazgos e incidentes de seguridad industrial.
        </p>
      </section>

      {/* Quick Access */}
      <section className="quick-access">
        <div className="quick-access-grid">
          {quickLinks.map((item, index) => (
            <div
              key={item.path}
              className={`quick-card animate-in animate-in-delay-${index + 1}`}
              onClick={() => navigate(item.path)}
            >
              <div className="quick-card-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Homepage;