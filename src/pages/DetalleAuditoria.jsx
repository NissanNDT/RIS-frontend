import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getAuditById
} from "../services/auditService";
import { 
  getPlants, 
  getAreas, 
  getUsers,
  createFinding, 
  updateFinding,
  getFindingsByAuditId
} from "../services/findingService";
import "../styles/Auditorias.css";

const DEMO_AUDITS = [
  {
    id: 1,
    name: "Auditoría de Seguridad Trimestral - Planta A1",
    audit_folio: "SES-1-ENSAMBLE-001",
    id_plant: 1,
    id_area: 101,
    type: "SES",
    created_at: new Date().toISOString(),
    id_audit_user: 10
  }
];

const DEMO_FINDINGS = [
  {
    id: 1,
    description: "Extintor con carga vencida en pasillo principal.",
    location: "Pasillo A3",
    finding_category: "Condición Insegura",
    status: "Abierto",
    id_audit: 1
  }
];

const DetalleAuditoria = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const role = localStorage.getItem("role") || "";
  
  const [audit, setAudit] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState([]);
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Modals
  const [showAddFindingModal, setShowAddFindingModal] = useState(false);
  const [showEditFindingModal, setShowEditFindingModal] = useState(false);

  // Forms
  const [auditForm, setAuditForm] = useState({});
  const [findingForm, setFindingForm] = useState({
    description: "",
    location: "",
    level: "A",
    reference_to_the_standard:""
  });
  const [editFindingForm, setEditFindingForm] = useState({});
  const [selectedFindingId, setSelectedFindingId] = useState(null);

  const [saving, setSaving] = useState(false);

  // Bulk actions states
  const [selectedFindings, setSelectedFindings] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkErrorMsg, setBulkErrorMsg] = useState("");
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(""); // "Enviar", "Cerrar", "Rechazar"

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditData, findingsData, plantsData, areasData, usersData] = await Promise.all([
        getAuditById(id),
        getFindingsByAuditId(id),
        getPlants(),
        getAreas(),
        getUsers().catch(() => [])
      ]);
      
      const currentAudit = auditData || DEMO_AUDITS.find(a => String(a.id) === String(id));
      setAudit(currentAudit);
      setFindings(findingsData.length > 0 ? findingsData : DEMO_FINDINGS.filter(f => String(f.id_audit) === String(id)));
      setPlants(plantsData);
      setAreas(areasData);
      setUsers(usersData);
      
      // Init edit form
      if (currentAudit) {
        setAuditForm({
          name: currentAudit.name,
          id_plant: currentAudit.id_plant,
          id_area: currentAudit.id_area,
          type: currentAudit.type
        });
      }
    } catch (err) {
      console.error("Error fetching audit details:", err);
      const demoA = DEMO_AUDITS.find(a => String(a.id) === String(id));
      if (demoA) {
        setAudit(demoA);
        setAuditForm({ name: demoA.name, id_plant: demoA.id_plant, id_area: demoA.id_area, type: demoA.type });
        setFindings(DEMO_FINDINGS.filter(f => String(f.id_audit) === String(id)));
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserFullName = (id) => {
    if (!id) return "—";
    const user = users.find((u) => String(u.id) === String(id));
    return user ? user.full_name : `Usuario ${id}`;
  };

  const handleToggleStatus = async (finding) => {
    const newStatus = finding.status === "En revisión" ? "Abierto" : "En revisión";
    
    // Update local state first
    setFindings(prev => prev.map(f => f.id === finding.id ? { ...f, status: newStatus } : f));
    
    // Call update API
    try {
      await updateFinding(finding.id, { status: newStatus });
    } catch (err) {
      console.error("Error updating finding status:", err);
    }
  };

  const eligibleVisibleFindings = useMemo(() => {
    return findings.filter((f) => {
      if (role === "Supervisor") {
        return f.status?.toLowerCase() === "abierto";
      }
      if (role === "Security") {
        return true;
      }
      return false;
    });
  }, [findings, role]);

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

    const targetStatus = statusValue;
    const selectedEligible = findings.filter(
      (f) => selectedFindings.includes(f.id) && (role === "Security" || (role === "Supervisor" && f.status?.toLowerCase() === "abierto"))
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
      const updatedFindings = await getFindingsByAuditId(id);
      setFindings(updatedFindings.length > 0 ? updatedFindings : DEMO_FINDINGS.filter(f => String(f.id_audit) === String(id)));
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

  const printAudit = () => {
    if (!audit) return;
    const plantName = plants.find(p => p.id === audit.id_plant)?.name || audit.id_plant;
    const areaName = areas.find(a => a.id === audit.id_area)?.name || audit.id_area;
    const responsibleName = getUserFullName(audit.id_responsible_user || audit.id_audit_user);

    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Formato de Auditoría — ${audit.audit_folio || audit.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;color:#111;background:#fff;padding:24px}
    .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #C8102E;padding-bottom:14px;margin-bottom:20px}
    .header-left h1{font-size:16pt;font-weight:800;color:#C8102E;letter-spacing:-0.5px}
    .header-left p{font-size:8.5pt;color:#555;margin-top:2px}
    .header-right{text-align:right;font-size:8.5pt;color:#555}
    .section{margin-bottom:18px}
    .section-title{font-size:10pt;font-weight:700;color:#C8102E;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:10px}
    .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
    .field{background:#f8f8f8;border:1px solid #e8e8e8;border-radius:6px;padding:8px 10px}
    .field-label{font-size:7.5pt;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
    .field-value{font-size:9.5pt;font-weight:500;color:#111}
    .table-findings{width:100%;border-collapse:collapse;margin-top:10px}
    .table-findings th, .table-findings td{border:1px solid #e8e8e8;padding:8px 10px;text-align:left}
    .table-findings th{background:#f8f8f8;font-size:8pt;font-weight:700;color:#555;text-transform:uppercase}
    .table-findings td{font-size:9pt}
    .badge{display:inline-block;padding:2px 6px;border-radius:4px;color:#fff;font-size:8pt;font-weight:700}
    .footer{margin-top:40px;border-top:1px solid #eee;padding-top:14px;display:grid;grid-template-columns:repeat(2,1fr);gap:24px}
    .sign-box{text-align:center}
    .sign-line{border-top:1px solid #333;margin-top:36px;padding-top:6px;font-size:8pt;color:#555}
    .watermark{position:fixed;bottom:24px;right:24px;font-size:7pt;color:#ccc}
    @media print{.no-print{display:none}}
  </style>
</head>
<body>
<div class="header">
  <div class="header-left">
    <h1>📋 Formato de Auditoría de Seguridad</h1>
    <p>Sistema RIS — Nissan Motor de México</p>
  </div>
  <div class="header-right">
    <strong>Folio: ${audit.audit_folio || "—"}</strong><br/>
    Generado: ${new Date().toLocaleString("es-MX")}
  </div>
</div>

<div class="section">
  <div class="section-title">📍 Datos Generales de la Auditoría</div>
  <div class="grid">
    <div class="field"><div class="field-label">Nombre de Auditoría</div><div class="field-value">${audit.name || "—"}</div></div>
    <div class="field"><div class="field-label">Tipo</div><div class="field-value">${audit.type || "—"}</div></div>
    <div class="field"><div class="field-label">Planta</div><div class="field-value">${plantName}</div></div>
    <div class="field"><div class="field-label">Área</div><div class="field-value">${areaName}</div></div>
    <div class="field"><div class="field-label">Fecha de Creación</div><div class="field-value">${new Date(audit.created_at).toLocaleDateString()}</div></div>
    <div class="field"><div class="field-label">Auditor / Responsable</div><div class="field-value">${responsibleName}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">⚠️ Hallazgos Registrados</div>
  <table class="table-findings">
    <thead>
      <tr>
        <th style="width: 8%">ID</th>
        <th>Descripción del Hallazgo</th>
        <th style="width: 20%">Ubicación</th>
        <th style="width: 15%">Categoría</th>
        <th style="width: 10%">Nivel</th>
        <th style="width: 12%">Estatus</th>
      </tr>
    </thead>
    <tbody>
      ${findings.length === 0 ? `<tr><td colspan="6" style="text-align:center">No hay hallazgos registrados</td></tr>` : findings.map(f => `
        <tr>
          <td>${f.id}</td>
          <td>${f.description || "—"}</td>
          <td>${f.location || "—"}</td>
          <td>${f.finding_category || "—"}</td>
          <td>${f.level || "—"}</td>
          <td>
            <span class="badge" style="background:${f.status === 'Abierto' ? '#C8102E' : f.status === 'En revisión' ? '#FB8C00' : '#43A047'}">${f.status}</span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>

<div class="footer">
  <div class="sign-box"><div class="sign-line">Auditor / Responsable</div></div>
  <div class="sign-box"><div class="sign-line">Seguridad Industrial</div></div>
</div>

<div class="watermark">RIS v1.0 — Nissan Motor de México</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`);
    win.document.close();
  };

  const handleCreateFinding = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...findingForm,
        id_audit: id,
        id_plant: audit.id_plant,
        id_area: audit.id_area
      };
      await createFinding(payload);
      setShowAddFindingModal(false);
      setFindingForm({ description: "", location: "", level: "A",reference_to_the_standard:"" });
      const updatedFindings = await getFindingsByAuditId(id);
      setFindings(updatedFindings);
    } catch (err) {
      console.error("Error creating finding:", err);
      alert("Error al crear el hallazgo");
    } finally {
      setSaving(false);
    }
  };

  const openEditFinding = (finding) => {
    setSelectedFindingId(finding.id);
    setEditFindingForm({
      description: finding.description,
      location: finding.location,
      status: finding.status,
      level: finding.level || "A",
      reference_to_the_standard:finding.reference_to_the_standard
    });
    setShowEditFindingModal(true);
  };

  const handleUpdateFinding = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateFinding(selectedFindingId, editFindingForm);
      setShowEditFindingModal(false);
      const updatedFindings = await getFindingsByAuditId(id);
      setFindings(updatedFindings);
      alert("Hallazgo actualizado");
    } catch (err) {
      console.error("Error updating finding:", err);
      alert("Error al actualizar el hallazgo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="auditorias-page"><div className="empty-state">Cargando detalles...</div></div>;
  if (!audit) return <div className="auditorias-page"><div className="empty-state">No se encontró la auditoría.</div></div>;

  const plantName = plants.find(p => p.id === audit.id_plant)?.name || audit.id_plant;
  const areaName = areas.find(a => a.id === audit.id_area)?.name || audit.id_area;
  const responsibleName = getUserFullName(audit.id_responsible_user || audit.id_audit_user);

  return (
    <div className="auditorias-page">
      <div className="auditorias-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button 
            onClick={() => navigate("/auditorias")}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle, #333)',
              color: 'var(--text-primary)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s ease, opacity 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
             Volver a Auditorías
          </button>
        </div>

        <div className="audit-detail-header animate-in glass" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className={`audit-type-badge type-${audit.type.toLowerCase()}`} style={{ position: 'static', marginBottom: '0.5rem', display: 'inline-block' }}>
                {audit.type}
              </span>
              <h1 style={{ margin: '0.5rem 0' }}>{audit.name}</h1>
              <p className="audit-folio" style={{ fontSize: '1.1rem' }}>{audit.audit_folio}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn-new-audit" 
                style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle, #333)', color: 'var(--text-primary)' }}
                onClick={printAudit}
              >
                🖨️ Generar Formato
              </button>
              {(role !== "Supervisor" && role !== "Admin") && (
                <button className="btn-new-audit" onClick={() => setShowAddFindingModal(true)}>
                  + Agregar Hallazgo
                </button>
              )}
            </div>
          </div>

          <div className="audit-info" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <div className="info-item">📍 Planta: <span>{plantName}</span></div>
            <div className="info-item"> Área: <span>{areaName}</span></div>
            <div className="info-item"> Fecha: <span>{new Date(audit.created_at).toLocaleDateString()}</span></div>
            <div className="info-item"> Responsable: <span>{responsibleName}</span></div>
          </div>
        </div>

        {/* Success/Error Feedback */}
        {bulkSuccessMsg && (
          <div className="bulk-feedback success animate-in" style={{ marginBottom: '1.5rem' }}>
            {bulkSuccessMsg}
          </div>
        )}
        {bulkErrorMsg && (
          <div className="bulk-feedback error animate-in" style={{ marginBottom: '1.5rem' }}>
            {bulkErrorMsg}
          </div>
        )}

        <h2 className="animate-in animate-in-delay-1" style={{ marginBottom: '1.5rem' }}>Hallazgos Registrados ({findings.length})</h2>

        {/* Bulk Actions Bar */}
        {(role === "Supervisor" || role === "Security") && findings.length > 0 && (
          <div className="bulk-actions-bar animate-in" style={{ marginBottom: '1.5rem' }}>
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
        )}

        {findings.length === 0 ? (
          <div className="empty-state animate-in animate-in-delay-2 glass" style={{ borderRadius: '16px' }}>
            No hay hallazgos registrados para esta auditoría todavía.
          </div>
        ) : (
          <div className="admin-table-wrapper animate-in animate-in-delay-2">
            <table className="admin-table">
              <thead>
                <tr>
                  {(role === "Supervisor" || role === "Security") && (
                    <th style={{ textAlign: 'center', width: '50px' }}>
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
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
                  )}
                  <th>ID</th>
                  <th>Descripción del Hallazgo</th>
                  <th>Ubicación / Equipo</th>
                  <th>Categoría</th>
                  <th>Referencia Norma</th>
                  <th>Nivel</th>
                  <th>Estatus</th>
                  <th style={{ textAlign: 'center' }}>Editar</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f) => {
                  const isSelected = selectedFindings.includes(f.id);
                  const isEligible = role === "Security" || (role === "Supervisor" && f.status?.toLowerCase() === "abierto");
                  
                  let rowClass = "";
                  if (isSelected) rowClass = "row-selected";

                  return (
                    <tr key={f.id} className={rowClass}>
                      {(role === "Supervisor" || role === "Security") && (
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isEligible}
                            onChange={() => handleSelectIndividual(f.id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                      )}
                      <td className="cell-id">{f.id}</td>
                      <td className="cell-desc" style={{ whiteSpace: 'normal', wordBreak: 'break-word', minWidth: '220px' }}>
                        {f.description}
                      </td>
                      <td>{f.location}</td>
                      <td>
                        <span className="category-badge">
                          {f.finding_category}
                        </span>
                      </td>
                      <td>{f.reference_to_the_standard || "—"}</td>
                      <td style={{ textAlign: 'center' }}>{f.level || "—"}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            background:
                              f.status === 'Abierto' ? 'var(--primary)' : f.status === 'En revisión' ? '#FB8C00' : f.status === 'Cerrado' ? '#43A047' : '#757575',
                          }}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn-edit"
                          onClick={() => openEditFinding(f)}
                          style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        >
                          ✏️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="popup" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content glass" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Acción Masiva</h2>
              <button className="btn-close" onClick={() => setShowConfirmModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                {actionType === "Enviar" && "¿Estás seguro de enviar los hallazgos seleccionados a revisión?"}
                {actionType === "Cerrar" && "¿Estás seguro de cerrar los hallazgos seleccionados?"}
                {actionType === "Rechazar" && "¿Estás seguro de rechazar los hallazgos seleccionados?"}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-cancel" onClick={() => setShowConfirmModal(false)}>
                  Cancelar
                </button>
                <button
                  className="btn-save"
                  style={{
                    background:
                      actionType === "Enviar" ? '#FB8C00' :
                      actionType === "Cerrar" ? '#43A047' : '#E53935'
                  }}
                  onClick={handleConfirmAction}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Finding Modal */}
      {showEditFindingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Editar Hallazgo</h2>
              <button className="btn-close" onClick={() => setShowEditFindingModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateFinding}>
              <div className="modal-body">
                <div className="audit-form-grid">
                  <div className="form-group full">
                    <label>Descripción del Hallazgo</label>
                    <textarea 
                      value={editFindingForm.description} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, description: e.target.value})} 
                      required 
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ubicación / Equipo</label>
                    <input 
                      type="text" 
                      value={editFindingForm.location} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, location: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Referencia a la Norma</label>
                    <input 
                      type="text" 
                      value={editFindingForm.reference_to_the_standard} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, reference_to_the_standard: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Nivel</label>
                    <select 
                      value={editFindingForm.level} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, level: e.target.value})} 
                      required
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estatus</label>
                    <select 
                      value={editFindingForm.status} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, status: e.target.value})} 
                      required
                    >
                      {role === "Security" ? (
                        <>
                          <option value="Abierto">Abierto</option>
                          <option value="En revisión">En revisión</option>
                          <option value="Cerrado">Cerrado</option>
                          <option value="Rechazado">Rechazado</option>
                        </>
                      ) : (role === "Supervisor" || role === "Admin") ? (
                        <>
                          <option value="Abierto">Abierto</option>
                          <option value="En revisión">En revisión</option>
                        </>
                      ) : (
                        <>
                          <option value="Abierto">Abierto</option>
                          <option value="En revisión">En revisión</option>
                          <option value="Cerrado">Cerrado</option>
                          <option value="Rechazado">Rechazado</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowEditFindingModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Guardando..." : "Actualizar Hallazgo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Finding Modal */}
      {showAddFindingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nuevo Hallazgo</h2>
              <button className="btn-close" onClick={() => setShowAddFindingModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateFinding}>
              <div className="modal-body">
                <div className="audit-form-grid">
                  <div className="form-group full">
                    <label>Descripción del Hallazgo</label>
                    <textarea 
                      name="description" 
                      value={findingForm.description} 
                      onChange={(e) => setFindingForm(p => ({...p, description: e.target.value}))} 
                      placeholder="Describe lo encontrado..."
                      required 
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ubicación / Equipo</label>
                    <input 
                      type="text" 
                      name="location" 
                      value={findingForm.location} 
                      onChange={(e) => setFindingForm(p => ({...p, location: e.target.value}))} 
                      placeholder="Ej. Línea de ensamble"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Referencia a la Norma</label>
                    <input 
                      type="text" 
                      name="reference_to_the_standard" 
                      value={findingForm.reference_to_the_standard} 
                      onChange={(e) => setFindingForm(p => ({...p, reference_to_the_standard: e.target.value}))} 
                      placeholder="Ej. ISO 14001"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Nivel</label>
                    <select 
                      name="level" 
                      value={findingForm.level} 
                      onChange={(e) => setFindingForm(p => ({...p, level: e.target.value}))} 
                      required
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowAddFindingModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Hallazgo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleAuditoria;

