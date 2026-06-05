import React, { useState, useEffect, useMemo } from "react";
import { getAllFindings, updateFinding, deleteFinding, getPlants, getAreas, getUsers } from "../services/findingService";
import XLSX from "xlsx-js-style";
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
  const [filterAuditStatus, setFilterAuditStatus] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [filteredFindings, setFilteredFindings] = useState([]);
  const [selectedFindings, setSelectedFindings] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkErrorMsg, setBulkErrorMsg] = useState("");
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(""); // "Enviar", "Cerrar", "Rechazar"
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [findingToDelete, setFindingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

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

      const matchAuditStatus =
        !filterAuditStatus ||
        (filterAuditStatus === "con_auditoria" ? !!f.id_audit : !f.id_audit);

      const matchRole = role === "Supervisor" ? String(f.id_responsible_user) === String(userId) : true;

      return matchSearch && matchCategory && matchStatus && matchLevel && matchPlant && matchArea && matchAuditStatus && matchRole;
    });
    setFilteredFindings(newFiltered);
  }, [findings, search, filterCategory, filterStatus, filterLevel, filterPlant, filterArea, filterAuditStatus]);

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

  const isEligibleForBulkAction = (f) => {
    if (role === "Supervisor") {
      return f.status?.toLowerCase() === "abierto";
    }
    if (role === "Security") {
      return true;
    }
    return false;
  };

  const eligibleVisibleFindings = useMemo(() => {
    return filteredFindings.filter(isEligibleForBulkAction);
  }, [filteredFindings, role]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const toAdd = eligibleVisibleFindings.map(f => f.id);
      setSelectedFindings(prev => {
        const next = new Set(prev);
        toAdd.forEach(id => next.add(id));
        return Array.from(next);
      });
    } else {
      const toRemove = new Set(eligibleVisibleFindings.map(f => f.id));
      setSelectedFindings(prev => prev.filter(id => !toRemove.has(id)));
    }
  };

  const handleSelectIndividual = (id) => {
    setSelectedFindings(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const openConfirmModal = (type) => {
    setActionType(type);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    setShowConfirmModal(false);
    let statusValue = "";
    if (actionType === "Enviar") statusValue = "En revisión";
    else if (actionType === "Cerrar") statusValue = "Cerrado";
    else if (actionType === "Rechazar") statusValue = "Rechazado";

    if (!statusValue) return;
    await handleBulkAction(statusValue);
  };

  const handleBulkAction = async (statusValue) => {
    if (selectedFindings.length === 0) return;
    setBulkProcessing(true);
    setBulkErrorMsg("");
    setBulkSuccessMsg("");

    const targetStatus = mapStatusToBackend(statusValue);
    const selectedEligible = findings.filter(
      (f) => selectedFindings.includes(f.id) && isEligibleForBulkAction(f)
    );

    const promises = selectedEligible.map(async (finding) => {
      const payload = {
        status: targetStatus,
      };
      if (statusValue.toLowerCase() === "cerrado") {
        payload.conclusion_date = new Date().toISOString().split("T")[0];
      }
      await updateFinding(finding.id, payload);
    });

    try {
      const results = await Promise.allSettled(promises);
      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results.filter((r) => r.status === "rejected").length;

      if (failures === 0) {
        setBulkSuccessMsg(`Se actualizaron correctamente ${successes} hallazgo(s) a "${statusValue}".`);
      } else {
        setBulkErrorMsg(
          `Acción completada con errores. Éxitos: ${successes}, Errores: ${failures}.`
        );
      }

      setSelectedFindings([]);
      await fetchFindings();
    } catch (err) {
      console.error("Error running bulk actions:", err);
      setBulkErrorMsg("Error inesperado al ejecutar las acciones masivas.");
    } finally {
      setBulkProcessing(false);
      setTimeout(() => {
        setBulkSuccessMsg("");
        setBulkErrorMsg("");
      }, 5000);
    }
  };

  const handleExportExcel = () => {
    try {
      setExporting(true);
      setSuccessMsg("Generando archivo Excel... La descarga se iniciará automáticamente.");
      setTimeout(() => setSuccessMsg(""), 3000);

      const dataToExport = filteredFindings.map((f) => ({
        "ID": f.id,
        "Descripción": f.description || "",
        "Ubicación": f.location || "",
        "Categoría": f.finding_category || "",
        "Nivel": f.level || "",
        "Estatus": f.status || "",
        "Planta": getPlantName(f.id_plant),
        "Área": getAreaName(f.id_area),
        "Responsable": getUserFullName(f.id_responsible_user),
        "Fecha de Verificación": formatDate(f.verification_date),
        "Acción Correctiva": f.corrective_action || "",
        "ID de Auditoría": f.id_audit || "—",
        "Fecha de Conclusión": formatDate(f.conclusion_date),
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      const colWidths = Object.keys(dataToExport[0] || {}).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...dataToExport.map((row) => String(row[key] || "").length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet["!cols"] = colWidths;

      if (dataToExport.length > 0) {
        const lastColIndex = Object.keys(dataToExport[0]).length - 1;
        worksheet["!autofilter"] = {
          ref: XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: { r: dataToExport.length, c: lastColIndex }
          })
        };

        // Style the worksheet cells beautifully
        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
            if (!worksheet[cell_address]) continue;
            
            const cell = worksheet[cell_address];
            
            // Base style
            cell.s = {
              font: { name: "Segoe UI", sz: 10 },
              alignment: { vertical: "center", wrapText: true },
              border: {
                top: { style: "thin", color: { rgb: "E2E8F0" } },
                bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                left: { style: "thin", color: { rgb: "E2E8F0" } },
                right: { style: "thin", color: { rgb: "E2E8F0" } }
              }
            };

            if (R === 0) {
              // Header styles (Premium Slate Blue)
              cell.s.fill = { fgColor: { rgb: "1F4E79" } };
              cell.s.font = { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "FFFFFF" } };
              cell.s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
            } else {
              // Data rows styles
              // Zebra striping
              if (R % 2 === 0) {
                cell.s.fill = { fgColor: { rgb: "F8FAFC" } };
              }

              // Column alignments: ID (0), Nivel (4), Estatus (5), Fecha Verificación (9), Auditoría (11), Conclusión (12)
              const centerCols = [0, 4, 5, 9, 11, 12];
              if (centerCols.includes(C)) {
                cell.s.alignment.horizontal = "center";
              } else {
                cell.s.alignment.horizontal = "left";
              }

              // Status badges colors matching UI
              if (C === 5) {
                const statusVal = String(cell.v || "").toLowerCase();
                if (statusVal === "abierto") {
                  cell.s.fill = { fgColor: { rgb: "FDE8E8" } }; // Light red
                  cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "9B1C1C" } };
                } else if (statusVal === "cerrado") {
                  cell.s.fill = { fgColor: { rgb: "DEF7EC" } }; // Light green
                  cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "03543F" } };
                } else if (statusVal.includes("revision")) {
                  cell.s.fill = { fgColor: { rgb: "FEF3C7" } }; // Light orange
                  cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "92400E" } };
                } else if (statusVal === "rechazado") {
                  cell.s.fill = { fgColor: { rgb: "F3F4F6" } }; // Light gray
                  cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "374151" } };
                }
              }

              // Bold ID Column
              if (C === 0) {
                cell.s.font = { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "1F4E79" } };
              }
            }
          }
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Hallazgos");

      const filename = `Hallazgos_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      setError("Error al exportar los datos a Excel.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setExporting(false);
    }
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
      reference_to_the_standard: finding.reference_to_the_standard || "",
      level: finding.level || "A",
    });
    setSuccessMsg("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const confirmDeleteFinding = (id) => {
    setFindingToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteFinding = async () => {
    if (!findingToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFinding(findingToDelete);
      setSuccessMsg("Hallazgo eliminado con éxito.");
      setShowDeleteConfirm(false);
      setFindingToDelete(null);
      await fetchFindings();
    } catch (err) {
      console.error("Error deleting finding:", err);
      setError("Error al eliminar el hallazgo.");
    } finally {
      setIsDeleting(false);
      setTimeout(() => {
        setSuccessMsg("");
        setError("");
      }, 5000);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const isSecurity = role === "Security";
  const hasAudit = !!editForm.id_audit;

  const isFieldDisabled = (fieldName) => {
    if (isSecurity) {
      if (!hasAudit) {
        return true;
      }
      const allowedFields = [
        "location",
        "description",
        "reference_to_the_standard",
        "level",
        "verification_date"
      ];
      return !allowedFields.includes(fieldName);
    }
    return false;
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
        reference_to_the_standard: editForm.reference_to_the_standard || null,
        level: editForm.level || null,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 className="animate-in" style={{ margin: 0, textAlign: 'left' }}>Administración de Hallazgos</h1>
          <button
            onClick={handleExportExcel}
            className="btn-save animate-in"
            disabled={filteredFindings.length === 0 || exporting}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'linear-gradient(135deg, #1D6F42, #105B34)', 
              border: 'none',
              padding: '10px 20px',
            }}
          >
            {exporting ? "Exportando..." : "📥 Exportar a Excel"}
          </button>
        </div>

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
          {role !== "Supervisor" && (
            <>
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
            </>
          )}
          <div className="filter-group">
            <label htmlFor="filter-audit-status">Auditoría</label>
            <select
              id="filter-audit-status"
              value={filterAuditStatus}
              onChange={(e) => setFilterAuditStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="con_auditoria">Con auditoría</option>
              <option value="sin_auditoria">Sin auditoría</option>
            </select>
          </div>
          <div className="filter-group filter-count">
            <span className="count-badge">{filteredFindings.length}</span>
            <span>resultados</span>
          </div>
        </div>

        {/* Bulk Action feedback messages */}
        {bulkSuccessMsg && (
          <div className="bulk-feedback success">{bulkSuccessMsg}</div>
        )}
        {bulkErrorMsg && (
          <div className="bulk-feedback error">{bulkErrorMsg}</div>
        )}

        {/* Bulk Actions Bar */}
        <div className="bulk-actions-bar animate-in">
          <span>
            <strong>{selectedFindings.length}</strong> hallazgo(s) seleccionado(s)
          </span>
          <div className="bulk-actions-buttons">
            {role === "Supervisor" && (
              <button
                className="btn-action"
                style={{ background: '#FB8C00', color: 'white' }}
                onClick={() => openConfirmModal("Enviar")}
                disabled={selectedFindings.length === 0 || bulkProcessing}
              >
                Enviar a revisión
              </button>
            )}
            {role === "Security" && (
              <>
                <button
                  className="btn-close-finding"
                  style={{ background: '#43A047', color: 'white' }}
                  onClick={() => openConfirmModal("Cerrar")}
                  disabled={selectedFindings.length === 0 || bulkProcessing}
                >
                  Cerrar
                </button>
                <button
                  className="btn-reject"
                  style={{ background: '#E53935', color: 'white' }}
                  onClick={() => openConfirmModal("Rechazar")}
                  disabled={selectedFindings.length === 0 || bulkProcessing}
                >
                  Rechazar
                </button>
              </>
            )}
            <button
              className="btn-cancel"
              onClick={() => setSelectedFindings([])}
              disabled={selectedFindings.length === 0 || bulkProcessing}
            >
              Cancelar selección
            </button>
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
                  <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          eligibleVisibleFindings.length > 0 &&
                          eligibleVisibleFindings.every((f) =>
                            selectedFindings.includes(f.id)
                          )
                        }
                        ref={(el) => {
                          if (el) {
                            const someSelected = eligibleVisibleFindings.some((f) =>
                              selectedFindings.includes(f.id)
                            );
                            const allSelected = eligibleVisibleFindings.every((f) =>
                              selectedFindings.includes(f.id)
                            );
                            el.indeterminate = someSelected && !allSelected;
                          }
                        }}
                      />
                      <span>Seleccionar para enviar a revisión</span>
                    </div>
                  </th>
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
                    <td colSpan="20" className="admin-empty">
                      No se encontraron hallazgos
                    </td>
                  </tr>
                ) : (
                  filteredFindings.map((f) => {
                    const isSelected = selectedFindings.includes(f.id);
                    const isEligible = isEligibleForBulkAction(f);
                    let rowClass = "";
                    if (editingId === f.id) rowClass = "row-editing";
                    else if (isSelected) rowClass = "row-selected";

                    return (
                      <tr key={f.id} className={rowClass}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isEligible}
                            onChange={() => handleSelectIndividual(f.id)}
                          />
                        </td>
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
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                            <button
                              className="btn-edit"
                              onClick={() => startEdit(f)}
                              style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                            >
                              ✏️ Editar
                            </button>
                            {role === "Admin" && (
                              <button
                                className="btn-delete"
                                onClick={() => confirmDeleteFinding(f.id)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.9rem',
                                  background: '#E53935',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'opacity 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                              >
                                🗑️ Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
              <h2>Editar Hallazgo #{editingId}</h2>
              <button className="btn-close" onClick={cancelEdit}>&times;</button>
            </div>
            <form onSubmit={saveEdit}>
              <div className="modal-body">
                {isSecurity && !hasAudit && (
                  <div style={{ marginBottom: '1.2rem', background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'left', fontWeight: '500' }}>
                    ⚠️ Este hallazgo no pertenece a ninguna auditoría. Como usuario con rol "Security", no tienes permisos para editarlo (modo solo lectura).
                  </div>
                )}
                {isSecurity && hasAudit && (
                  <div style={{ marginBottom: '1.2rem', background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'left', fontWeight: '500' }}>
                    ℹ️ Como usuario con rol "Security", solo se te permite editar: Descripción, Ubicación, Referencia a la Norma, Nivel y Fecha de Verificación.
                  </div>
                )}
                <div className="audit-form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Descripción</label>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      rows={3}
                      disabled={isFieldDisabled("description")}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ubicación</label>
                    <input
                      name="location"
                      value={editForm.location}
                      onChange={handleEditChange}
                      disabled={isFieldDisabled("location")}
                    />
                  </div>
                  <div className="form-group">
                    <label>Referencia a la Norma</label>
                    <input
                      name="reference_to_the_standard"
                      value={editForm.reference_to_the_standard}
                      onChange={handleEditChange}
                      disabled={isFieldDisabled("reference_to_the_standard")}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nivel</label>
                    <select
                      name="level"
                      value={editForm.level}
                      onChange={handleEditChange}
                      disabled={isFieldDisabled("level")}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select
                      name="finding_category"
                      value={editForm.finding_category}
                      onChange={handleEditChange}
                      disabled={isFieldDisabled("finding_category")}
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
                      disabled={isFieldDisabled("status")}
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
                      disabled={isFieldDisabled("id_plant")}
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
                      disabled={isFieldDisabled("id_area")}
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
                      disabled={isFieldDisabled("id_responsible_user")}
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
                      disabled={isFieldDisabled("id_audit")}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha Verificación</label>
                    <input
                      name="verification_date"
                      type="date"
                      value={editForm.verification_date}
                      onChange={handleEditChange}
                      disabled={isFieldDisabled("verification_date")}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha Conclusión</label>
                    <input
                      name="conclusion_date"
                      type="date"
                      value={editForm.conclusion_date}
                      onChange={handleEditChange}
                      disabled={isFieldDisabled("conclusion_date")}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Acción Correctiva</label>
                    <textarea
                      name="corrective_action"
                      value={editForm.corrective_action}
                      onChange={handleEditChange}
                      rows={2}
                      disabled={isFieldDisabled("corrective_action")}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={cancelEdit}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving || (isSecurity && !hasAudit)}>
                  {saving ? "Guardando..." : " Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="popup" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content glass" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Acción</h2>
              <button className="btn-close" onClick={() => setShowConfirmModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '20px', fontSize: '1.1rem', color: 'var(--text-primary)', textAlign: 'center' }}>
              {actionType === "Enviar" && "¿Estás seguro de enviar los hallazgos seleccionados a revisión?"}
              {actionType === "Cerrar" && "¿Estás seguro de cerrar los hallazgos seleccionados?"}
              {actionType === "Rechazar" && "¿Estás seguro de rechazar los hallazgos seleccionados?"}
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-cancel" onClick={() => setShowConfirmModal(false)}>Cancelar</button>
              <button
                type="button"
                className="btn-save"
                style={{
                  background: actionType === "Enviar" ? "#FB8C00" : actionType === "Cerrar" ? "#43A047" : "#E53935",
                  color: "white",
                  border: "none"
                }}
                onClick={handleConfirmAction}
              >
                Confirmar
              </button>
            </div>
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
                  style={{ background: '#E53935', color: 'white' }}
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

export default AdminHallazgos;
