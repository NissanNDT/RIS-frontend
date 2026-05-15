import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FiAlertTriangle, FiCheckCircle, FiFileText, FiTrendingUp } from "react-icons/fi";
import "../App.css";

const Homepage = () => {
  const navigate = useNavigate();

  // Estados
  const [incidents, setIncidents] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch datos
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incRes, findRes] = await Promise.all([
        axios.get("/api/incidents", { withCredentials: true }),
        axios.get("/api/findings", { withCredentials: true }),
      ]);

      const incData = Array.isArray(incRes.data) ? incRes.data : incRes.data.data || [];
      const findData = Array.isArray(findRes.data) ? findRes.data : findRes.data.data || [];

      setIncidents(incData);
      setFindings(findData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos para Dashboard
  const stats = useMemo(() => {
    const totalInc = incidents.length;
    const openInc = incidents.filter(i => i.status !== 'cerrado').length;
    
    const totalFind = findings.length;
    const openFind = findings.filter(f => f.status !== 'cerrado').length;

    const actos = findings.filter(f => f.finding_category === 'Acto Inseguro').length;
    const condiciones = findings.filter(f => f.finding_category === 'Condición Insegura').length;

    return { totalInc, openInc, totalFind, openFind, actos, condiciones };
  }, [incidents, findings]);

  const countByLevel = (level) => incidents.filter((i) => i.severity === level).length;

  const quickLinks = [
    { icon: "📋", title: "Reportar Hallazgo", desc: "Registra hallazgos de seguridad.", path: "/reporteDeHallazgo" },
    { icon: "🚨", title: "Reportar Incidente", desc: "Documenta incidentes en planta.", path: "/reporteIncidente" },
    { icon: "📊", title: "Admin Hallazgos", desc: "Gestiona hallazgos reportados.", path: "/adminHallazgos" },
    { icon: "📁", title: "Admin Incidentes", desc: "Administra incidentes registrados.", path: "/adminIncidentes" },
    { icon: "📞", title: "Contactos", desc: "Directorio de emergencia.", path: "/contact" },
  ];

  return (
    <div className="homepage">
      {/* Hero */}
      <section className="hero-section">
        <span className="hero-badge animate-in">🔒 Sistema de Seguridad RIS</span>
        <h1 className="hero-title animate-in animate-in-delay-1">
          Panel de Control <span className="highlight">Nissan</span>
        </h1>
        <p className="hero-subtitle animate-in animate-in-delay-2">
          Gestión integral de seguridad industrial, prevención de riesgos y seguimiento de incidentes.
        </p>
      </section>

      {/* Dashboard Section */}
      <section className="dashboard-section animate-in animate-in-delay-3">
        <div className="dashboard-grid">
          <div className="stat-card glass">
            <div className="stat-icon incident"><FiAlertTriangle /></div>
            <div className="stat-info">
              <h3>Incidentes Totales</h3>
              <div className="stat-value">{stats.totalInc}</div>
              <p>{stats.openInc} Abiertos / {stats.totalInc - stats.openInc} Cerrados</p>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon finding"><FiFileText /></div>
            <div className="stat-info">
              <h3>Hallazgos Totales</h3>
              <div className="stat-value">{stats.totalFind}</div>
              <p>{stats.openFind} Abiertos / {stats.totalFind - stats.openFind} Cerrados</p>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon safe"><FiCheckCircle /></div>
            <div className="stat-info">
              <h3>Actos Inseguros</h3>
              <div className="stat-value">{stats.actos}</div>
              <p>Detectados y en seguimiento</p>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon risk"><FiTrendingUp /></div>
            <div className="stat-info">
              <h3>Condiciones NG</h3>
              <div className="stat-value">{stats.condiciones}</div>
              <p>Puntos de mejora identificados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pyramid Section */}
      <section className="pyramid-section animate-in animate-in-delay-4">
        <div className="pyramid-layout">
          <div className="pyramid-info">
            <h2 className="section-title">Pirámide de Seguridad</h2>
            <p>Visualización jerárquica de la severidad de los incidentes según el modelo Bird.</p>
            <div className="pyramid-legend">
              <div className="legend-item"><span className="dot g"></span> Fatal / Crítico</div>
              <div className="legend-item"><span className="dot r"></span> Alta Severidad</div>
              <div className="legend-item"><span className="dot u"></span> Media / Baja</div>
              <div className="legend-item"><span className="dot f"></span> Hallazgos Base</div>
            </div>
          </div>

          <div className="pyramid-graphic">
            <div className="pyramid">
              <div className="level g" onClick={() => navigate("/adminIncidentes")}>
                <span className="lvl-name">Crítico</span>
                <span className="lvl-count">{countByLevel("Crítica")}</span>
              </div>
              <div className="level r" onClick={() => navigate("/adminIncidentes")}>
                <span className="lvl-name">Alta</span>
                <span className="lvl-count">{countByLevel("Alta")}</span>
              </div>
              <div className="level u" onClick={() => navigate("/adminIncidentes")}>
                <span className="lvl-name">Media</span>
                <span className="lvl-count">{countByLevel("Media")}</span>
              </div>
              <div className="level fr1" onClick={() => navigate("/adminIncidentes")}>
                <span className="lvl-name">Baja</span>
                <span className="lvl-count">{countByLevel("Baja")}</span>
              </div>
              <div className="level findings" onClick={() => navigate("/adminHallazgos")}>
                <span className="lvl-name">Hallazgos</span>
                <span className="lvl-count">{findings.length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="quick-access">
        <h2 className="section-title animate-in">Acceso Rápido</h2>
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
