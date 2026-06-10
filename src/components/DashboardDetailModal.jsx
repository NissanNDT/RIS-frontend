import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiSearch, FiExternalLink } from "react-icons/fi";

const DashboardDetailModal = ({
  isOpen,
  onClose,
  title,
  data = [],
  type = "incident", // "incident" | "finding" | "audit"
  plantsMap = {},
  areasMap = {}
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  // Formatter for date
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Safe mapping helpers
  const getPlantName = (id) => {
    if (!id) return "—";
    return plantsMap[String(id)] || `Planta ${id}`;
  };

  const getAreaName = (id) => {
    if (!id) return "—";
    return areasMap[String(id)] || `Área ${id}`;
  };

  // Text search filtering (across all columns)
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();

    if (type === "incident") {
      return (
        item.folio?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.location?.toLowerCase().includes(term) ||
        item.level?.toLowerCase().includes(term) ||
        item.root_cause?.toLowerCase().includes(term) ||
        getPlantName(item.id_plant).toLowerCase().includes(term) ||
        getAreaName(item.id_area).toLowerCase().includes(term)
      );
    } else if (type === "finding") {
      return (
        item.finding_folio?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.location?.toLowerCase().includes(term) ||
        item.finding_category?.toLowerCase().includes(term) ||
        item.status?.toLowerCase().includes(term) ||
        getPlantName(item.id_plant).toLowerCase().includes(term) ||
        getAreaName(item.id_area).toLowerCase().includes(term)
      );
    } else if (type === "audit") {
      return (
        String(item.id).includes(term) ||
        item.title?.toLowerCase().includes(term) ||
        item.status?.toLowerCase().includes(term) ||
        getPlantName(item.id_plant).toLowerCase().includes(term) ||
        getAreaName(item.id_area).toLowerCase().includes(term)
      );
    }
    return false;
  });

  const handleNavigateToDetail = (item) => {
    onClose();
    if (type === "incident") {
      navigate("/adminIncidentes", { state: { search: item.folio } });
    } else if (type === "finding") {
      navigate("/adminHallazgos", { state: { search: item.finding_folio || String(item.id) } });
    } else if (type === "audit") {
      navigate(`/auditorias/${item.id}`);
    }
  };

  return (
    <div className="modal-backdrop-custom">
      <style>{`
        .modal-backdrop-custom {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
          padding: 20px;
        }

        .modal-container-custom {
          background: var(--bg-card, #ffffff);
          border-radius: var(--radius-lg, 16px);
          border: 1px solid var(--border-default, rgba(0, 0, 0, 0.1));
          box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
          width: 100%;
          max-width: 1100px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .modal-header-custom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
        }

        .modal-header-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary, #1A1A1A);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-counter-badge {
          background: var(--primary-subtle, rgba(200, 16, 46, 0.08));
          color: var(--primary, #C8102E);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--radius-full, 999px);
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary, #555555);
          cursor: pointer;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 50%;
          transition: background 0.2s, color 0.2s;
        }

        .modal-close-btn:hover {
          background: var(--bg-elevated, #f5f5f5);
          color: var(--text-primary, #1A1A1A);
        }

        .modal-body-custom {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex: 1;
        }

        .modal-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          max-width: 400px;
          width: 100%;
        }

        .modal-search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-tertiary, #888888);
          font-size: 1rem;
        }

        .modal-search-input {
          width: 100%;
          padding: 10px 14px 10px 40px;
          border-radius: var(--radius-md, 10px);
          border: 1px solid var(--border-default, rgba(0, 0, 0, 0.15));
          background: var(--bg-input, #ffffff);
          font-size: 0.9rem;
          color: var(--text-primary, #1a1a1a);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .modal-search-input:focus {
          border-color: var(--primary, #C8102E);
          box-shadow: 0 0 0 3px var(--primary-glow, rgba(200, 16, 46, 0.15));
          outline: none;
        }

        .modal-table-container {
          width: 100%;
          overflow-x: auto;
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
          border-radius: var(--radius-md, 10px);
          position: relative;
          background: var(--bg-card, #ffffff);
        }

        .modal-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          text-align: left;
        }

        .modal-table th {
          position: sticky;
          top: 0;
          background: var(--bg-elevated, #f5f5f5);
          color: var(--text-secondary, #555555);
          font-weight: 700;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-default, rgba(0, 0, 0, 0.1));
          z-index: 1;
          white-space: nowrap;
        }

        .modal-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.04));
          color: var(--text-primary, #1a1a1a);
          vertical-align: middle;
        }

        .modal-table tr:last-child td {
          border-bottom: none;
        }

        .modal-table tr:hover td {
          background: var(--bg-elevated, rgba(0, 0, 0, 0.015));
        }

        .modal-btn-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--primary, #C8102E);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: var(--radius-sm, 6px);
          font-weight: 600;
          font-size: 0.75rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }

        .modal-btn-action:hover {
          background: var(--primary-dark, #9B0A1E);
          transform: translateY(-1px);
        }

        .modal-badge {
          display: inline-block;
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .modal-badge.abierto {
          background: rgba(229, 57, 53, 0.15);
          color: #E53935;
        }

        .modal-badge.en-revision, .modal-badge.en-investigacion {
          background: rgba(142, 36, 170, 0.15);
          color: #8E24AA;
        }

        .modal-badge.cerrado {
          background: rgba(67, 160, 71, 0.15);
          color: #43A047;
        }

        .modal-badge.nivel {
          background: rgba(251, 140, 0, 0.15);
          color: #FB8C00;
        }

        .modal-empty {
          text-align: center;
          padding: 40px;
          color: var(--text-tertiary, #888888);
          font-style: italic;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="modal-container-custom" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-custom">
          <div className="modal-header-title">
            <span>{title}</span>
            <span className="modal-counter-badge">
              {filteredData.length} {filteredData.length === 1 ? "registro" : "registros"}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body-custom">
          <div className="modal-search-wrapper">
            <FiSearch className="modal-search-icon" />
            <input
              type="text"
              className="modal-search-input"
              placeholder="Buscar registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="modal-table-container">
            {filteredData.length === 0 ? (
              <div className="modal-empty">No se encontraron registros relacionados.</div>
            ) : (
              <table className="modal-table">
                <thead>
                  {type === "incident" && (
                    <tr>
                      <th>Folio</th>
                      <th>Fecha</th>
                      <th>Planta</th>
                      <th>Área</th>
                      <th>Nivel</th>
                      <th>Ubicación</th>
                      <th>Descripción</th>
                      <th>Causa Raíz</th>
                      <th>Acciones</th>
                    </tr>
                  )}
                  {type === "finding" && (
                    <tr>
                      <th>Folio</th>
                      <th>Descripción</th>
                      <th>Planta</th>
                      <th>Área</th>
                      <th>Ubicación</th>
                      <th>Categoría</th>
                      <th>Estatus</th>
                      <th>Acciones</th>
                    </tr>
                  )}
                  {type === "audit" && (
                    <tr>
                      <th>ID</th>
                      <th>Título / Nombre</th>
                      <th>Planta</th>
                      <th>Área</th>
                      <th>Estatus</th>
                      <th>Acciones</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {filteredData.map((item) => {
                    if (type === "incident") {
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700 }}>{item.folio || `Incidente #${item.id}`}</td>
                          <td>{formatDate(item.incident_date || item.created_at)}</td>
                          <td>{getPlantName(item.id_plant)}</td>
                          <td>{getAreaName(item.id_area)}</td>
                          <td>
                            <span className="modal-badge nivel">
                              {item.level || "—"}
                            </span>
                          </td>
                          <td>{item.location || "—"}</td>
                          <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.description}>
                            {item.description || "—"}
                          </td>
                          <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.root_cause}>
                            {item.root_cause || "—"}
                          </td>
                          <td>
                            <button className="modal-btn-action" onClick={() => handleNavigateToDetail(item)}>
                              <FiExternalLink /> Ver detalle
                            </button>
                          </td>
                        </tr>
                      );
                    } else if (type === "finding") {
                      const statusClass = item.status?.toLowerCase()?.replace(/\s+/g, '-');
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700 }}>{item.finding_folio || `Hallazgo #${item.id}`}</td>
                          <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.description}>
                            {item.description || "—"}
                          </td>
                          <td>{getPlantName(item.id_plant)}</td>
                          <td>{getAreaName(item.id_area)}</td>
                          <td>{item.location || "—"}</td>
                          <td>{item.finding_category || "—"}</td>
                          <td>
                            <span className={`modal-badge ${statusClass}`}>
                              {item.status || "—"}
                            </span>
                          </td>
                          <td>
                            <button className="modal-btn-action" onClick={() => handleNavigateToDetail(item)}>
                              <FiExternalLink /> Ver detalle
                            </button>
                          </td>
                        </tr>
                      );
                    } else if (type === "audit") {
                      const statusClass = item.status?.toLowerCase()?.replace(/\s+/g, '-');
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700 }}>{item.id}</td>
                          <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.title}>
                            {item.title || "—"}
                          </td>
                          <td>{getPlantName(item.id_plant)}</td>
                          <td>{getAreaName(item.id_area)}</td>
                          <td>
                            <span className={`modal-badge ${statusClass}`}>
                              {item.status || "—"}
                            </span>
                          </td>
                          <td>
                            <button className="modal-btn-action" onClick={() => handleNavigateToDetail(item)}>
                              <FiExternalLink /> Ver detalle
                            </button>
                          </td>
                        </tr>
                      );
                    }
                    return null;
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDetailModal;
