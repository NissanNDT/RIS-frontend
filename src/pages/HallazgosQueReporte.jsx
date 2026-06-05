import React, { useState, useEffect, useMemo } from "react";
import { getAllFindings, updateFinding, deleteFinding, getPlants, getAreas, getUsers } from "../services/findingService";
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

const HallazgosQueReporte = () => {
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
  const [auditFilter, setAuditFilter] = useState("todos");
  
  // States for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [findingToDelete, setFindingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Catalogs for names mapping
  const [plants, setPlants] = useState([]);
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);

  // Authenticated user
  const storedUser = localStorage.getItem("user");
  const loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  const loggedInUserName = loggedInUser ? loggedInUser.name : "";
  const role = localStorage.getItem("role") || "";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch findings and catalogs in parallel
      const [findingsData, plantsData, areasData, usersData] = await Promise.all([
        getAllFindings(),
        getPlants(),
        getAreas(),
        getUsers(),
      ]);

      const rawFindings = Array.isArray(findingsData) ? findingsData : findingsData.data || [];
      setFindings(rawFindings);
      setPlants(Array.isArray(plantsData) ? plantsData : []);
      setAreas(Array.isArray(areasData) ? areasData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Error al cargar los datos desde la base de datos.");
    } finally {
      setLoading(false);
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

  // 1. Filtrado por usuario en Frontend + otros filtros
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      // Filtrar únicamente los hallazgos donde created_by coincida con el usuario autenticado
      const matchesUser = normalizeStr(f.created_by) === normalizeStr(loggedInUserName);

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

      let matchAudit = true;
      if (role === "Security") {
        if (auditFilter === "con_auditoria") {
          matchAudit = f.id_audit !== null && f.id_audit !== undefined && String(f.id_audit).trim() !== "";
        } else if (auditFilter === "sin_auditoria") {
          matchAudit = f.id_audit === null || f.id_audit === undefined || String(f.id_audit).trim() === "";
        }
      }

      return matchesUser && matchSearch && matchCategory && matchStatus && matchAudit;
    });
  }, [findings, loggedInUserName, search, filterCategory, filterStatus, role, auditFilter]);

  // Map category to backend format
  const mapCategoryToBackend = (val) => {
    if (!val) return null;
    const lower = val.toLowerCase();
    if (lower.includes("acto")) return "Acto Inseguro";
    if (lower.includes("condicion insegura")) return "Condición Insegura";
    if (lower.includes("condicion ng")) return "Condición NG";
    return val;
  };

  // Map status to backend format
  const mapStatusToBackend = (val) => {
    if (!val) return null;
    const lower = val.toLowerCase();
    if (lower === "abierto") return "Abierto";
    if (lower.includes("revision")) return "En revisión";
    if (lower === "cerrado") return "Cerrado";
    if (lower === "rechazado") return "Rechazado";
    return val;
  };

  // Edit Handlers
  const startEdit = (finding) => {
    setEditingId(finding.id);
    setEditForm({
      description: finding.description || "",
      location: finding.location || "",
      id_area: finding.id_area || "",
      id_plant: finding.id_plant || "",
      id_responsible_user: finding.id_responsible_user || "",
      finding_category: (finding.finding_category || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      
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
        
      };
      const updatedFinding = await updateFinding(editingId, payload);
      
      // Update local findings state to reflect changes and keep filter
      setFindings((prev) =>
        prev.map((f) => (f.id === editingId ? { ...f, ...updatedFinding } : f))
      );
      
      setSuccessMsg("Hallazgo actualizado correctamente");
      setEditingId(null);
      
      // Fetch latest findings in background to ensure total consistency
      const latestData = await getAllFindings();
      setFindings(Array.isArray(latestData) ? latestData : latestData.data || []);
    } catch (err) {
      console.error("Error updating:", err);
      setSuccessMsg("Error al actualizar hallazgo");
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  // Open Delete Confirmation Dialog
  const handleDeleteClick = (id) => {
    setFindingToDelete(id);
    setShowDeleteConfirm(true);
  };

  // Execute deletion
  const handleDeleteFinding = async () => {
    if (!findingToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFinding(findingToDelete);
      // Actualizar la lista inmediatamente sin recargar la página
      setFindings((prev) => prev.filter((f) => f.id !== findingToDelete));
      setSuccessMsg("Hallazgo eliminado con éxito");
      setShowDeleteConfirm(false);
      setFindingToDelete(null);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error deleting finding:", err);
      alert("Error al intentar eliminar el hallazgo.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h1 className="animate-in">Hallazgos que Reporté</h1>
        <p className="animate-in animate-in-delay-1" style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
          Aquí puedes ver, editar y eliminar los hallazgos que has ingresado al sistema.
        </p>

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
          {role === "Security" && (
            <div className="filter-group">
              <label htmlFor="filter-audit">Auditoría</label>
              <select
                id="filter-audit"
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="con_auditoria">Con auditoría</option>
                <option value="sin_auditoria">Sin auditoría</option>
              </select>
            </div>
          )}
          <div className="filter-group filter-count">
            <span className="count-badge">{filteredFindings.length}</span>
            <span>resultados</span>
          </div>
        </div>

        {/* Loading */}
        {loading && <div className="admin-loading">Cargando tus hallazgos...</div>}

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
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="admin-empty">
                      No has reportado ningún hallazgo con los filtros seleccionados
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
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-edit"
                            onClick={() => startEdit(f)}
                            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                          >
                            ✏️ Editar
                          </button>
                           <button
                             className="btn-reject"
                             onClick={() => handleDeleteClick(f.id)}
                             disabled={f.status?.toLowerCase() !== "abierto"}
                             style={{ 
                               padding: '6px 10px', 
                               fontSize: '0.85rem', 
                               background: f.status?.toLowerCase() === "abierto" ? '#E53935' : '#757575', 
                               color: '#fff', 
                               border: 'none', 
                               borderRadius: '4px', 
                               cursor: f.status?.toLowerCase() === "abierto" ? 'pointer' : 'not-allowed',
                               opacity: f.status?.toLowerCase() === "abierto" ? '1' : '0.5',
                               transition: 'opacity 0.2s'
                             }}
                             onMouseOver={(e) => {
                               if (f.status?.toLowerCase() === "abierto") {
                                 e.currentTarget.style.opacity = '0.8';
                               }
                             }}
                             onMouseOut={(e) => {
                               if (f.status?.toLowerCase() === "abierto") {
                                 e.currentTarget.style.opacity = '1';
                               }
                             }}
                           >
                             🗑️ Eliminar
                           </button>
                        </div>
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
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Mi Hallazgo #{editingId}</h2>
              <button className="btn-close" onClick={cancelEdit}>&times;</button>
            </div>
            <form onSubmit={saveEdit}>
              <div className="modal-body">
                <div className="audit-form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Descripción</label>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      rows={3}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Ubicación</label>
                    <input
                      name="location"
                      value={editForm.location}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select
                      name="finding_category"
                      value={editForm.finding_category}
                      onChange={handleEditChange}
                    >
                      {CATEGORY_OPTIONS.filter((o) => o.value).map((o) => (
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
                    >
                      <option value="">Seleccione un área</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre ?? a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  
                  
                 
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={cancelEdit}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Finding Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="popup" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content glass" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="btn-close" onClick={() => setShowDeleteConfirm(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                ¿Estás seguro de eliminar este hallazgo?
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                  Cancelar
                </button>
                <button
                  className="btn-save"
                  style={{ background: '#E53935', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }}
                  onClick={handleDeleteFinding}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Eliminando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallazgosQueReporte;
