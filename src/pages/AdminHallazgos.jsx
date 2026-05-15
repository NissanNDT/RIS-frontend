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
      console.error("Error fetching findings:", err.response || err);
      setError("Error al cargar los hallazgos desde la base de datos.");
      setFindings([]); 
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

  const saveEdit = async (e) => {
    e.preventDefault();
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
      setSuccessMsg("Error al actualizar hallazgo");
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
                    <tr key={f.id} className={editingId === f.id ? "row-editing" : ""}>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="popup" onClick={cancelEdit}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Editar Hallazgo #{editingId}</h2>
              <button className="btn-close" onClick={cancelEdit}>&times;</button>
            </div>
            <form onSubmit={saveEdit}>
              <div className="modal-body">
                <div className="audit-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Descripción</label>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      rows={3}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ubicación</label>
                    <input
                      name="location"
                      value={editForm.location}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select
                      name="finding_category"
                      value={editForm.finding_category}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    >
                      {CATEGORY_OPTIONS.filter((o) => o.value).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estatus</label>
                    <select
                      name="status"
                      value={editForm.status}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    >
                      {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Planta</label>
                    <input
                      name="id_plant"
                      type="number"
                      value={editForm.id_plant}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Área</label>
                    <input
                      name="id_area"
                      type="number"
                      value={editForm.id_area}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>ID Auditoría</label>
                    <input
                      name="id_audit"
                      type="number"
                      value={editForm.id_audit}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha Verificación</label>
                    <input
                      name="verification_date"
                      type="date"
                      value={editForm.verification_date}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha Conclusión</label>
                    <input
                      name="conclusion_date"
                      type="date"
                      value={editForm.conclusion_date}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Acción Correctiva</label>
                    <textarea
                      name="corrective_action"
                      value={editForm.corrective_action}
                      onChange={handleEditChange}
                      rows={2}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" className="btn-cancel" onClick={cancelEdit}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Guardando..." : "💾 Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHallazgos;
