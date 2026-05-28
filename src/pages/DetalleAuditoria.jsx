import React, { useState, useEffect } from "react";
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
    finding_category: "Acto Inseguro",
    level: "A"
  });
  const [editFindingForm, setEditFindingForm] = useState({});
  const [selectedFindingId, setSelectedFindingId] = useState(null);

  const [saving, setSaving] = useState(false);

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
      setFindingForm({ description: "", location: "", finding_category: "Acto Inseguro", level: "A" });
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
      finding_category: finding.finding_category,
      status: finding.status,
      level: finding.level || "A"
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

        <h2 className="animate-in animate-in-delay-1" style={{ marginBottom: '1.5rem' }}>Hallazgos Registrados ({findings.length})</h2>

        {findings.length === 0 ? (
          <div className="empty-state animate-in animate-in-delay-2 glass" style={{ borderRadius: '16px' }}>
            No hay hallazgos registrados para esta auditoría todavía.
          </div>
        ) : (
          <div className="findings-list animate-in animate-in-delay-2">
            {findings.map(f => (
              <div key={f.id} className="finding-item glass" style={{ padding: '1.5rem', borderLeft: '6px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div className="finding-desc" style={{ fontSize: '1.1rem' }}>{f.description}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer', marginRight: '0.5rem', color: 'var(--text-secondary)' }}>
                      <input 
                        type="checkbox" 
                        checked={f.status === "En revisión"} 
                        onChange={() => handleToggleStatus(f)}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                      <span>En revisión</span>
                    </label>
                    <span className="status-badge" style={{ background: f.status === 'Abierto' ? 'var(--primary)' : f.status === 'En revisión' ? '#FB8C00' : '#43A047' }}>{f.status}</span>
                    <button className="btn-view" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => openEditFinding(f)}>✏️</button>
                  </div>
                </div>
                <div className="finding-meta">
                  <span>📍 <strong>Ubicación:</strong> {f.location}</span>
                  <span> <strong>Categoría:</strong> {f.finding_category}</span>
                  <span> <strong>Nivel:</strong> {f.level || "—"}</span>
                  <span> <strong>ID:</strong> {f.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


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
                    <label>Categoría</label>
                    <select 
                      value={editFindingForm.finding_category} 
                      onChange={(e) => setEditFindingForm({...editFindingForm, finding_category: e.target.value})} 
                      required
                    >
                      <option value="Acto Inseguro">Acto Inseguro</option>
                      <option value="Condición Insegura">Condición Insegura</option>
                      <option value="Condición NG">Condición NG</option>
                    </select>
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
                    <label>Categoría</label>
                    <select 
                      name="finding_category" 
                      value={findingForm.finding_category} 
                      onChange={(e) => setFindingForm(p => ({...p, finding_category: e.target.value}))} 
                      required
                    >
                      <option value="Acto Inseguro">Acto Inseguro</option>
                      <option value="Condición Insegura">Condición Insegura</option>
                      <option value="Condición NG">Condición NG</option>
                    </select>
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
