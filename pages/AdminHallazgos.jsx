import React, { useState, useEffect, useMemo } from "react";
import { getAllFindings, updateFinding } from "../services/findingService";
import "../App.css";

const CATEGORY_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "acto inseguro", label: "Acto Inseguro" },
  { value: "condicion insegura", label: "Condición Insegura" },
  { value: "condicion ng", label: "Condición NG" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "abierto", label: "Abierto" },
  { value: "en revision", label: "En Revisión" },
  { value: "cerrado", label: "Cerrado" },
  { value: "rechazado", label: "Rechazado" },
];

const STATUS_COLORS = {
  abierto: "#E53935",
  "en revision": "#FB8C00",
  cerrado: "#43A047",
  rechazado: "#757575",
};

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateInput = (d) => {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
};

const AdminHallazgos = () => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch findings
  useEffect(() => {
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllFindings();
      setFindings(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Error fetching findings:", err);
      setError("Error al cargar los hallazgos. Verifica tu conexión.");
      // Demo data for development
      setFindings([
        {
          id: 1,
          description: "Cable expuesto en zona de producción",
          location: "Línea 3, Estación 5",
          id_area: 1,
          id_plant: 1,
          finding_category: "condicion insegura",
          status: "abierto",
          verification_date: null,
          corrective_action: null,
          id_audit: null,
          conclusion_date: null,
          created_at: "2026-05-10T14:30:00",
        },
        {
          id: 2,
          description: "Operador sin EPP en área de soldadura",
          location: "Bodyshop A1",
          id_area: 2,
          id_plant: 1,
          finding_category: "acto inseguro",
          status: "en revision",
          verification_date: "2026-05-11T00:00:00",
          corrective_action: "Se proporcionó EPP y se capacitó al operador",
          id_audit: null,
          conclusion_date: null,
          created_at: "2026-05-09T09:15:00",
        },
        {
          id: 3,
          description: "Piso mojado sin señalización",
          location: "PDI, Área de lavado",
          id_area: 3,
          id_plant: 2,
          finding_category: "condicion ng",
          status: "cerrado",
          verification_date: "2026-05-08T00:00:00",
          corrective_action: "Se instalaron señalizaciones permanentes",
          id_audit: 101,
          conclusion_date: "2026-05-10T00:00:00",
          created_at: "2026-05-07T11:00:00",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered findings
  const filtered = useMemo(() => {
    return findings.filter((f) => {
      const matchSearch =
        !search ||
        f.description?.toLowerCase().includes(search.toLowerCase()) ||
        f.location?.toLowerCase().includes(search.toLowerCase()) ||
        String(f.id).includes(search);
      const matchCategory =
        !filterCategory || f.finding_category === filterCategory;
      const matchStatus = !filterStatus || f.status === filterStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [findings, search, filterCategory, filterStatus]);

  // Edit handlers
  const startEdit = (finding) => {
    setEditingId(finding.id);
    setEditForm({
      description: finding.description || "",
      location: finding.location || "",
      id_area: finding.id_area || "",
      id_plant: finding.id_plant || "",
      finding_category: finding.finding_category || "",
      status: finding.status || "",
      verification_date: formatDateInput(finding.verification_date),
      corrective_action: finding.corrective_action || "",
      id_audit: finding.id_audit || "",
      conclusion_date: formatDateInput(finding.conclusion_date),
    });
    setSuccessMsg("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        id_area: Number(editForm.id_area) || null,
        id_plant: Number(editForm.id_plant) || null,
        id_audit: editForm.id_audit ? Number(editForm.id_audit) : null,
        verification_date: editForm.verification_date || null,
        conclusion_date: editForm.conclusion_date || null,
      };
      await updateFinding(editingId, payload);
      setSuccessMsg("Hallazgo actualizado correctamente");
      setEditingId(null);
      fetchFindings();
    } catch (err) {
      console.error("Error updating:", err);
      // For demo, update locally
      setFindings((prev) =>
        prev.map((f) => (f.id === editingId ? { ...f, ...editForm } : f))
      );
      setSuccessMsg("Hallazgo actualizado (local)");
      setEditingId(null);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h1 className="animate-in">Administración de Hallazgos</h1>

        {/* Success message */}
        {successMsg && (
          <div className="admin-success animate-in">{successMsg}</div>
        )}

        {/* Filters */}
        <div className="admin-filters animate-in animate-in-delay-1">
          <div className="filter-group">
            <label htmlFor="search-input">Buscar</label>
            <input
              id="search-input"
              type="text"
              placeholder="ID, descripción o ubicación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="filter-category">Categoría</label>
            <select
              id="filter-category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-status">Estatus</label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group filter-count">
            <span className="count-badge">{filtered.length}</span>
            <span>resultados</span>
          </div>
        </div>

        {/* Loading */}
        {loading && <div className="admin-loading">Cargando hallazgos...</div>}

        {/* Error */}
        {error && !loading && <div className="admin-error">{error}</div>}

        {/* Table */}
        {!loading && (
          <div className="admin-table-wrapper animate-in animate-in-delay-2">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Descripción</th>
                  <th>Ubicación</th>
                  <th>Categoría</th>
                  <th>Estatus</th>
                  <th>Planta</th>
                  <th>Área</th>
                  <th>Verificación</th>
                  <th>Acción Correctiva</th>
                  <th>Auditoría</th>
                  <th>Conclusión</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="admin-empty">
                      No se encontraron hallazgos
                    </td>
                  </tr>
                ) : (
                  filtered.map((f) => (
                    <React.Fragment key={f.id}>
                      <tr className={editingId === f.id ? "row-editing" : ""}>
                        <td className="cell-id">{f.id}</td>
                        <td className="cell-desc">{f.description}</td>
                        <td>{f.location}</td>
                        <td>
                          <span className="category-badge">
                            {f.finding_category}
                          </span>
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              background:
                                STATUS_COLORS[f.status] || "#888",
                            }}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td>{f.id_plant}</td>
                        <td>{f.id_area}</td>
                        <td>{formatDate(f.verification_date)}</td>
                        <td className="cell-desc">
                          {f.corrective_action || "—"}
                        </td>
                        <td>{f.id_audit || "—"}</td>
                        <td>{formatDate(f.conclusion_date)}</td>
                        <td>
                          <button
                            className="btn-edit"
                            onClick={() => startEdit(f)}
                          >
                            ✏️ Editar
                          </button>
                        </td>
                      </tr>

                      {/* Inline edit row */}
                      {editingId === f.id && (
                        <tr className="edit-row">
                          <td colSpan="12">
                            <div className="edit-form">
                              <h3>Editar Hallazgo #{f.id}</h3>
                              <div className="edit-grid">
                                <label>
                                  Descripción
                                  <textarea
                                    name="description"
                                    value={editForm.description}
                                    onChange={handleEditChange}
                                    rows={2}
                                  />
                                </label>
                                <label>
                                  Ubicación
                                  <input
                                    name="location"
                                    value={editForm.location}
                                    onChange={handleEditChange}
                                  />
                                </label>
                                <label>
                                  Planta
                                  <input
                                    name="id_plant"
                                    type="number"
                                    value={editForm.id_plant}
                                    onChange={handleEditChange}
                                  />
                                </label>
                                <label>
                                  Área
                                  <input
                                    name="id_area"
                                    type="number"
                                    value={editForm.id_area}
                                    onChange={handleEditChange}
                                  />
                                </label>
                                <label>
                                  Categoría
                                  <select
                                    name="finding_category"
                                    value={editForm.finding_category}
                                    onChange={handleEditChange}
                                  >
                                    {CATEGORY_OPTIONS.filter(
                                      (o) => o.value
                                    ).map((o) => (
                                      <option key={o.value} value={o.value}>
                                        {o.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label>
                                  Estatus
                                  <select
                                    name="status"
                                    value={editForm.status}
                                    onChange={handleEditChange}
                                  >
                                    {STATUS_OPTIONS.filter(
                                      (o) => o.value
                                    ).map((o) => (
                                      <option key={o.value} value={o.value}>
                                        {o.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label>
                                  Fecha de Verificación
                                  <input
                                    name="verification_date"
                                    type="date"
                                    value={editForm.verification_date}
                                    onChange={handleEditChange}
                                  />
                                </label>
                                <label>
                                  Fecha de Conclusión
                                  <input
                                    name="conclusion_date"
                                    type="date"
                                    value={editForm.conclusion_date}
                                    onChange={handleEditChange}
                                  />
                                </label>
                                <label>
                                  ID Auditoría
                                  <input
                                    name="id_audit"
                                    type="number"
                                    value={editForm.id_audit}
                                    onChange={handleEditChange}
                                  />
                                </label>
                                <label className="full-width">
                                  Acción Correctiva
                                  <textarea
                                    name="corrective_action"
                                    value={editForm.corrective_action}
                                    onChange={handleEditChange}
                                    rows={2}
                                  />
                                </label>
                              </div>
                              <div className="edit-actions">
                                <button
                                  className="btn-save"
                                  onClick={saveEdit}
                                  disabled={saving}
                                >
                                  {saving ? "Guardando..." : "💾 Guardar"}
                                </button>
                                <button
                                  className="btn-cancel"
                                  onClick={cancelEdit}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

export default AdminHallazgos;
