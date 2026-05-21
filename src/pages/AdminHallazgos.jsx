import React, { useState, useEffect, useMemo } from "react";
import { getAllFindings, updateFinding, getPlants, getAreas, getUsers } from "../services/findingService";
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
  const [filterLevel, setFilterLevel] = useState("");
  const [filterPlant, setFilterPlant] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [filteredFindings, setFilteredFindings] = useState([]);

  // Role and UserId
  const role = localStorage.getItem("role");
  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).id : null;

  // Catalog states
  const [plants, setPlants] = useState([]);
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch findings and catalogs
  useEffect(() => {
    fetchFindings();
    fetchCatalogs();
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

  const fetchCatalogs = async () => {
    try {
      const [plantsData, areasData, usersData] = await Promise.all([
        getPlants(),
        getAreas(),
        getUsers(),
      ]);
      setPlants(Array.isArray(plantsData) ? plantsData : []);
      setAreas(Array.isArray(areasData) ? areasData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Error fetching catalogs:", err);
    }
  };

  // Name mapping helpers
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

  const getUserFullName = (id) => {
    if (!id) return "—";
    const user = users.find((u) => String(u.id) === String(id));
    return user ? user.full_name : `Usuario ${id}`;
  };

  // Normalization helper for robust string comparison (ignores case and accents)
  const normalizeStr = (str) =>
    str
      ? str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      : "";

  // Extract unique values for filters from findings
  const uniqueLevels = useMemo(() => [...new Set(findings.map((f) => f.level).filter(Boolean))], [findings]);
  
  const uniquePlants = useMemo(() => {
    const ids = [...new Set(findings.map((f) => f.id_plant).filter(Boolean))];
    return ids.map(id => ({
      id,
      name: getPlantName(id)
    }));
  }, [findings, plants]);

  const uniqueAreas = useMemo(() => {
    const ids = [...new Set(findings.map((f) => f.id_area).filter(Boolean))];
    return ids.map(id => ({
      id,
      name: getAreaName(id)
    }));
  }, [findings, areas]);

  // Effect to copy findings to filteredFindings when the raw findings change
  useEffect(() => {
    setFilteredFindings(findings);
  }, [findings]);

  // Filtered findings using state and useEffect
  useEffect(() => {
    const newFiltered = findings.filter((f) => {
      const matchSearch =
        !search ||
        f.description?.toLowerCase().includes(search.toLowerCase()) ||
        f.location?.toLowerCase().includes(search.toLowerCase()) ||
        String(f.id).includes(search);
      
      const matchCategory =
        !filterCategory ||
        normalizeStr(f.finding_category) === normalizeStr(filterCategory);
      
      const matchStatus =
        !filterStatus ||
        normalizeStr(f.status) === normalizeStr(filterStatus);
      
      const matchLevel = !filterLevel || f.level === filterLevel;
      const matchPlant = !filterPlant || String(f.id_plant) === String(filterPlant);
      const matchArea = !filterArea || String(f.id_area) === String(filterArea);
      
      const matchRole = role === "Supervisor" ? String(f.id_responsible_user) === String(userId) : true;
      
      return matchSearch && matchCategory && matchStatus && matchLevel && matchPlant && matchArea && matchRole;
    });
    setFilteredFindings(newFiltered);
  }, [findings, search, filterCategory, filterStatus, filterLevel, filterPlant, filterArea]);

  // Map value to backend category format
  const mapCategoryToBackend = (val) => {
    if (!val) return null;
    const lower = val.toLowerCase();
    if (lower.includes("acto")) return "Acto Inseguro";
    if (lower.includes("condicion insegura")) return "Condición Insegura";
    if (lower.includes("condicion ng")) return "Condición NG";
    return val;
  };

  // Map value to backend status format
  const mapStatusToBackend = (val) => {
    if (!val) return null;
    const lower = val.toLowerCase();
    if (lower === "abierto") return "Abierto";
    if (lower.includes("revision")) return "En revisión";
    if (lower === "cerrado") return "Cerrado";
    if (lower === "rechazado") return "Rechazado";
    return val;
  };

  // Edit handlers
  const changeFindingStatus = (id, newStatus) => {
    setFindings((prevFindings) =>
      prevFindings.map((f) =>
        f.id === id ? { ...f, status: newStatus } : f
      )
    );
  };

  const startEdit = (finding) => {
    setEditingId(finding.id);
    setEditForm({
      description: finding.description || "",
      location: finding.location || "",
      id_area: finding.id_area || "",
      id_plant: finding.id_plant || "",
      id_responsible_user: finding.id_responsible_user || "",
      finding_category: (finding.finding_category || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      status: (finding.status || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
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
        id_responsible_user: editForm.id_responsible_user ? Number(editForm.id_responsible_user) : null,
        finding_category: mapCategoryToBackend(editForm.finding_category),
        status: mapStatusToBackend(editForm.status),
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
          <div className="filter-group">
            <label htmlFor="filter-level">Nivel</label>
            <select
              id="filter-level"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="">Todos</option>
              {uniqueLevels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-plant">Planta</label>
            <select
              id="filter-plant"
              value={filterPlant}
              onChange={(e) => setFilterPlant(e.target.value)}
            >
              <option value="">Todas</option>
              {uniquePlants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-area">Área</label>
            <select
              id="filter-area"
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
            >
              <option value="">Todas</option>
              {uniqueAreas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group filter-count">
            <span className="count-badge">{filteredFindings.length}</span>
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
                  <th>Responsable</th>
                  <th>Verificación</th>
                  <th>Acción Correctiva</th>
                  <th>Auditoría</th>
                  <th>Conclusión</th>
                  {role === "Supervisor" && <th>Enviar a revisión</th>}
                  {role === "Security" && <th>Acciones</th>}
                  <th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="admin-empty">
                      No se encontraron hallazgos
                    </td>
                  </tr>
                ) : (
                  filteredFindings.map((f) => (
                    <tr key={f.id} className={editingId === f.id ? "row-editing" : ""}>
                      <td className="cell-id">{f.id}</td>
                      <td className="cell-desc">
                        <div style={{ maxHeight: '70px', overflowY: 'auto', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {f.description}
                        </div>
                      </td>
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
                              STATUS_COLORS[f.status?.toLowerCase()] || "#888",
                          }}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td>{getPlantName(f.id_plant)}</td>
                      <td>{getAreaName(f.id_area)}</td>
                      <td>{getUserFullName(f.id_responsible_user)}</td>
                      <td>{formatDate(f.verification_date)}</td>
                      <td className="cell-desc">
                        <div style={{ maxHeight: '70px', overflowY: 'auto', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {f.corrective_action || "—"}
                        </div>
                      </td>
                      <td>{f.id_audit || "—"}</td>
                      <td>{formatDate(f.conclusion_date)}</td>
                      {role === "Supervisor" && (
                        <td>
                          {f.status?.toLowerCase() === "abierto" && (
                            <button
                              className="btn-action"
                              style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#FB8C00', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => changeFindingStatus(f.id, "En revisión")}
                            >
                              Enviar a revisión
                            </button>
                          )}
                        </td>
                      )}
                      {role === "Security" && (
                        <td style={{ display: 'flex', gap: '5px' }}>
                          <button
                            className="btn-close-finding"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#43A047', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => changeFindingStatus(f.id, "Cerrado")}
                          >
                            Cerrar
                          </button>
                          <button
                            className="btn-reject"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#E53935', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => changeFindingStatus(f.id, "Rechazado")}
                          >
                            Rechazar
                          </button>
                        </td>
                      )}
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
                    <select
                      name="id_plant"
                      value={editForm.id_plant}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    >
                      <option value="">Seleccione una planta</option>
                      {plants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Área</label>
                    <select
                      name="id_area"
                      value={editForm.id_area}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    >
                      <option value="">Seleccione un área</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre ?? a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Responsable</label>
                    <select
                      name="id_responsible_user"
                      value={editForm.id_responsible_user}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                    >
                      <option value="">Seleccione un responsable</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name}
                        </option>
                      ))}
                    </select>
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
