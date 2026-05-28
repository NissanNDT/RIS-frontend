import React, { useState, useEffect } from "react";
import { getAllFindings, getPlants, getAreas } from "../services/findingService";
import "../App.css";

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const STATUS_COLORS = {
  abierto: "#E53935",
  "en revision": "#FB8C00",
  cerrado: "#43A047",
  rechazado: "#757575",
};

// Caché simple a nivel de módulo para evitar nuevas peticiones si los datos ya están cargados en memoria
let cachedFindings = null;
let cachedPlants = null;
let cachedAreas = null;

const HallazgosQueReporte = () => {
  const [findings, setFindings] = useState(cachedFindings || []);
  const [plants, setPlants] = useState(cachedPlants || []);
  const [areas, setAreas] = useState(cachedAreas || []);
  const [loading, setLoading] = useState(!cachedFindings);
  const [error, setError] = useState("");

  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).id : null;

  useEffect(() => {
    const fetchData = async () => {
      // 6. No hacer nuevas peticiones si los datos ya están cargados.
      if (cachedFindings && cachedPlants && cachedAreas) {
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [findingsData, plantsData, areasData] = await Promise.all([
          getAllFindings(),
          getPlants(),
          getAreas(),
        ]);
        
        const allFindings = Array.isArray(findingsData) ? findingsData : findingsData.data || [];
        
        cachedFindings = allFindings;
        cachedPlants = Array.isArray(plantsData) ? plantsData : [];
        cachedAreas = Array.isArray(areasData) ? areasData : [];
        
        setFindings(cachedFindings);
        setPlants(cachedPlants);
        setAreas(cachedAreas);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 3. Filtrar los datos: mostrar únicamente los hallazgos donde id_responsible_user coincida con el userId
  const filteredFindings = findings.filter(
    (f) => String(f.id_responsible_user) === String(userId)
  );

  const getPlantName = (id) => {
    if (!id) return "—";
    const plant = plants.find((p) => String(p.id) === String(id));
    return plant ? plant.name : `Planta ${id}`;
  };

  const getAreaName = (id) => {
    if (!id) return "—";
    const area = areas.find((a) => String(a.id) === String(id));
    return area ? (area.nombre ?? area.name) : `Área ${id}`;
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h1 className="animate-in">Hallazgos que Reporte</h1>

        {loading && <div className="admin-loading">Cargando hallazgos...</div>}
        {error && !loading && <div className="admin-error">{error}</div>}

        {!loading && !error && (
          <div className="admin-table-wrapper animate-in animate-in-delay-1">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Descripción</th>
                  <th>Estatus</th>
                  <th>Fecha</th>
                  <th>Área</th>
                  <th>Planta</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-empty">
                      No tienes hallazgos reportados.
                    </td>
                  </tr>
                ) : (
                  filteredFindings.map((f) => (
                    <tr key={f.id}>
                      <td className="cell-id">{f.id}</td>
                      <td className="cell-desc">
                        <div style={{ maxHeight: "70px", overflowY: "auto", whiteSpace: "normal", wordBreak: "break-word" }}>
                          {f.description}
                        </div>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            background: STATUS_COLORS[f.status?.toLowerCase()] || "#888",
                          }}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td>{formatDate(f.verification_date)}</td>
                      <td>{getAreaName(f.id_area)}</td>
                      <td>{getPlantName(f.id_plant)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HallazgosQueReporte;
