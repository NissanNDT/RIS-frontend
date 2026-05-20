import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FiAlertTriangle, FiCheckCircle, FiFileText, FiActivity, FiShield, FiBarChart2 } from "react-icons/fi";
import "../App.css";

const BarChart = ({ data, color = "#C8102E" }) => {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  if (entries.length === 0) {
    return <p style={{ color: "var(--text-tertiary)", fontStyle: "italic", textAlign: "center" }}>Sin datos</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {entries.map(([name, count]) => (
        <div key={name} style={{ display: "grid", gridTemplateColumns: "110px 1fr 30px", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }} title={name}>{name}</span>
          <div style={{ height: "8px", background: "var(--bg-elevated)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(count / maxVal) * 100}%`, background: color, borderRadius: "4px", transition: "width 0.6s ease" }} />
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", textAlign: "right" }}>{count}</span>
        </div>
      ))}
    </div>
  );
};

const Homepage = () => {
  const navigate = useNavigate();

  // Estados
  const [incidents, setIncidents] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch datos (Un solo consumo por endpoint)
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

  // Cálculos para Dashboard usando filter()
  const stats = useMemo(() => {
    // ── HALLAZGOS ──
    const totalFind = findings.length;
    const openFind = findings.filter(f => f.status === "Abierto" || f.status === "En revisión").length;
    const closedFind = findings.filter(f => f.status === "Cerrado").length;

    const byPlantFind = {};
    findings.forEach(f => {
      const p = f.id_plant ? `Planta ${f.id_plant}` : "Sin Planta";
      byPlantFind[p] = (byPlantFind[p] || 0) + 1;
    });

    const byAreaFind = {};
    findings.forEach(f => {
      const a = f.id_area ? `Área ${f.id_area}` : "Sin Área";
      byAreaFind[a] = (byAreaFind[a] || 0) + 1;
    });

    // ── CLASIFICACIÓN (Hallazgos) ──
    const actoInseguro = findings.filter(f => f.finding_category === 'Acto Inseguro').length;
    const condicionInsegura = findings.filter(f => f.finding_category === 'Condición Insegura').length;
    const condicionNG = findings.filter(f => f.finding_category === 'Condición NG').length;

    // ── INCIDENTES ──
    const totalInc = incidents.length;
    const byPlantInc = {};
    incidents.forEach(i => {
      const p = i.id_plant ? `Planta ${i.id_plant}` : "Sin Planta";
      byPlantInc[p] = (byPlantInc[p] || 0) + 1;
    });

    const byAreaInc = {};
    incidents.forEach(i => {
      const a = i.id_area ? `Área ${i.id_area}` : "Sin Área";
      byAreaInc[a] = (byAreaInc[a] || 0) + 1;
    });

    // ── PIRÁMIDE (Incidentes) ──
    // Se asume que level puede venir como "G,U..."
    const getLevel = (levelStr) => levelStr ? String(levelStr).split(',')[0].trim() : null;

    const byLevel = {
      G: incidents.filter(i => getLevel(i.level) === "G").length,
      U: incidents.filter(i => getLevel(i.level) === "U").length,
      R: incidents.filter(i => getLevel(i.level) === "R").length,
      FR1: incidents.filter(i => getLevel(i.level) === "FR1").length,
      FR0: incidents.filter(i => getLevel(i.level) === "FR0").length,
    };

    return {
      totalFind, openFind, closedFind, byPlantFind, byAreaFind,
      actoInseguro, condicionInsegura, condicionNG,
      totalInc, byPlantInc, byAreaInc, byLevel
    };
  }, [incidents, findings]);


  return (
    <div className="homepage">
      <style>{`
        .dash-section { max-width: 1200px; margin: 0 auto 48px; padding: 0 24px; width: 100%; }
        .dash-title { display: flex; align-items: center; gap: 10px; font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; }
        .dash-icon { color: var(--primary); font-size: 1.2rem; }
        .dash-grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
        .dash-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; }
        .dash-card { background: rgba(255,255,255,0.75); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-sm); }
        .dash-card-title { font-size: 0.9rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 20px; }
        
        .class-card { background: var(--bg-surface); border-radius: var(--radius-md); padding: 18px 20px 14px; border: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .class-info { display: flex; align-items: baseline; gap: 10px; }
        .class-count { font-size: 2rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
        .class-label { font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }
        .class-bar { height: 6px; background: var(--bg-elevated); border-radius: 4px; overflow: hidden; }
        
        /* Inline Pyramid overrides */
        .pyr-container { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 20px 0; }
        .pyr-level { display: flex; justify-content: space-between; align-items: center; padding: 10px 30px; color: white; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.5); font-size: 0.85rem; cursor: pointer; transition: transform 0.2s; }
        .pyr-level:hover { transform: scale(1.03); }
        .pyr-g { width: 140px; background: linear-gradient(135deg, #333, #000); border-radius: 4px 4px 0 0; clip-path: polygon(25% 0, 75% 0, 100% 100%, 0 100%); }
        .pyr-u { width: 220px; background: linear-gradient(135deg, #FB8C00, #EF6C00); clip-path: polygon(15% 0, 85% 0, 100% 100%, 0 100%); }
        .pyr-r { width: 300px; background: linear-gradient(135deg, #C8102E, #9B0A1E); clip-path: polygon(10% 0, 90% 0, 100% 100%, 0 100%); }
        .pyr-fr1 { width: 380px; background: linear-gradient(135deg, #FBC02D, #F9A825); clip-path: polygon(8% 0, 92% 0, 100% 100%, 0 100%); }
        .pyr-fr0 { width: 460px; background: linear-gradient(135deg, #455A64, #263238); clip-path: polygon(5% 0, 95% 0, 100% 100%, 0 100%); border-radius: 0 0 4px 4px; }
      `}</style>

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

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Cargando dashboard...</div>
      ) : (
        <>
          {/* Tarjetas Resumen */}
          <section className="dash-section animate-in animate-in-delay-3">
            <div className="dash-grid-4">
              <div className="stat-card glass">
                <div className="stat-icon finding"><FiFileText /></div>
                <div className="stat-info">
                  <h3>Total Hallazgos</h3>
                  <div className="stat-value">{stats.totalFind}</div>
                  <p>Registrados en el sistema</p>
                </div>
              </div>
              <div className="stat-card glass">
                <div className="stat-icon incident"><FiAlertTriangle /></div>
                <div className="stat-info">
                  <h3>Hallazgos Abiertos</h3>
                  <div className="stat-value">{stats.openFind}</div>
                  <p>Pendientes de resolución</p>
                </div>
              </div>
              <div className="stat-card glass">
                <div className="stat-icon safe"><FiCheckCircle /></div>
                <div className="stat-info">
                  <h3>Hallazgos Cerrados</h3>
                  <div className="stat-value">{stats.closedFind}</div>
                  <p>Resueltos exitosamente</p>
                </div>
              </div>
              <div className="stat-card glass">
                <div className="stat-icon risk"><FiActivity /></div>
                <div className="stat-info">
                  <h3>Total Incidentes</h3>
                  <div className="stat-value">{stats.totalInc}</div>
                  <p>Registrados en el sistema</p>
                </div>
              </div>
            </div>
          </section>

          {/* Hallazgos: Planta y Área */}
          <section className="dash-section animate-in animate-in-delay-3">
            <h2 className="dash-title"><FiFileText className="dash-icon" /> Hallazgos — Distribución</h2>
            <div className="dash-grid-2">
              <div className="dash-card">
                <h3 className="dash-card-title">Por Planta</h3>
                <BarChart data={stats.byPlantFind} color="#1E88E5" />
              </div>
              <div className="dash-card">
                <h3 className="dash-card-title">Por Área</h3>
                <BarChart data={stats.byAreaFind} color="#7B1FA2" />
              </div>
            </div>
          </section>

          {/* Incidentes: Planta y Área */}
          <section className="dash-section animate-in animate-in-delay-4">
            <h2 className="dash-title"><FiActivity className="dash-icon" /> Incidentes — Distribución</h2>
            <div className="dash-grid-2">
              <div className="dash-card">
                <h3 className="dash-card-title">Por Planta</h3>
                <BarChart data={stats.byPlantInc} color="#C8102E" />
              </div>
              <div className="dash-card">
                <h3 className="dash-card-title">Por Área</h3>
                <BarChart data={stats.byAreaInc} color="#FB8C00" />
              </div>
            </div>
          </section>

          {/* Pirámide y Clasificación */}
          <section className="dash-section animate-in animate-in-delay-4">
            <div className="dash-grid-2">
              {/* Pirámide de Incidentes */}
              <div className="dash-card">
                <h2 className="dash-title" style={{ marginBottom: "8px" }}><FiBarChart2 className="dash-icon" /> Pirámide de Incidentes</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>Clasificación jerárquica de niveles.</p>
                <div className="pyr-container">
                  <div className="pyr-level pyr-g" onClick={() => navigate("/adminIncidentes")}>
                    <span>G</span> <span style={{ fontSize: "1.2rem" }}>{stats.byLevel.G}</span>
                  </div>
                  <div className="pyr-level pyr-u" onClick={() => navigate("/adminIncidentes")}>
                    <span>U</span> <span style={{ fontSize: "1.2rem" }}>{stats.byLevel.U}</span>
                  </div>
                  <div className="pyr-level pyr-r" onClick={() => navigate("/adminIncidentes")}>
                    <span>R</span> <span style={{ fontSize: "1.2rem" }}>{stats.byLevel.R}</span>
                  </div>
                  <div className="pyr-level pyr-fr1" onClick={() => navigate("/adminIncidentes")}>
                    <span>FR1</span> <span style={{ fontSize: "1.2rem" }}>{stats.byLevel.FR1}</span>
                  </div>
                  <div className="pyr-level pyr-fr0" onClick={() => navigate("/adminIncidentes")}>
                    <span>FR0</span> <span style={{ fontSize: "1.2rem" }}>{stats.byLevel.FR0}</span>
                  </div>
                </div>
              </div>

              {/* Clasificación de Hallazgos */}
              <div className="dash-card">
                <h2 className="dash-title" style={{ marginBottom: "8px" }}><FiShield className="dash-icon" /> Clasificación Hallazgos</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>Distribución por tipo de condición.</p>

                <div className="class-card">
                  <div className="class-info">
                    <span className="class-count">{stats.actoInseguro}</span>
                    <span className="class-label">Acto Inseguro</span>
                  </div>
                  <div className="class-bar"><div style={{ height: "100%", width: stats.totalFind ? `${(stats.actoInseguro / stats.totalFind) * 100}%` : '0%', background: "#C8102E", transition: "width 0.6s ease" }} /></div>
                </div>

                <div className="class-card">
                  <div className="class-info">
                    <span className="class-count">{stats.condicionInsegura}</span>
                    <span className="class-label">Condición Insegura</span>
                  </div>
                  <div className="class-bar"><div style={{ height: "100%", width: stats.totalFind ? `${(stats.condicionInsegura / stats.totalFind) * 100}%` : '0%', background: "#FB8C00", transition: "width 0.6s ease" }} /></div>
                </div>

                <div className="class-card">
                  <div className="class-info">
                    <span className="class-count">{stats.condicionNG}</span>
                    <span className="class-label">Condición NG</span>
                  </div>
                  <div className="class-bar"><div style={{ height: "100%", width: stats.totalFind ? `${(stats.condicionNG / stats.totalFind) * 100}%` : '0%', background: "#D32F2F", transition: "width 0.6s ease" }} /></div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Homepage;
